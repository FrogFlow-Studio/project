/**
 * Маршруты преподавателя: создание курса через ИИ, правка плана,
 * генерация блоков, публикация и контроль студентов.
 */
const express = require('express');
const { db, q } = require('../supabase');
const ai = require('../ai');
const {
  normalizeOutline,
  generateInviteCode,
  computeBlockStates,
  progressPercent,
  httpError
} = require('../logic');

const router = express.Router();

async function getOwnCourse(courseId, teacherId) {
  const course = await q(db.from('courses').select('*').eq('id', courseId).maybeSingle());
  if (!course || course.teacher_id !== teacherId) throw httpError(404, 'Курс не найден');
  return course;
}

async function getOwnBlock(blockId, teacherId) {
  const block = await q(db.from('course_blocks').select('*').eq('id', blockId).maybeSingle());
  if (!block) throw httpError(404, 'Блок не найден');
  const course = await getOwnCourse(block.course_id, teacherId);
  return { block, course };
}

async function loadBlocksWithContent(courseId) {
  const blocks = await q(db.from('course_blocks').select('*').eq('course_id', courseId).order('position'));
  const ids = blocks.map((b) => b.id);
  if (!ids.length) return [];
  const [questions, tasks] = await Promise.all([
    q(db.from('quiz_questions').select('*').in('block_id', ids).order('position')),
    q(db.from('practice_tasks').select('*').in('block_id', ids))
  ]);
  return blocks.map((b) => ({
    ...b,
    quiz_questions: questions.filter((x) => x.block_id === b.id),
    practice_task: tasks.find((t) => t.block_id === b.id) || null
  }));
}

// Список курсов преподавателя
router.get('/courses', async (req, res) => {
  const courses = await q(
    db.from('courses')
      .select('id, title, topic, status, invite_code, difficulty, created_at, course_blocks(count), enrollments(count)')
      .eq('teacher_id', req.user.id)
      .order('created_at', { ascending: false })
  );
  res.json({
    courses: courses.map(({ course_blocks, enrollments, ...c }) => ({
      ...c,
      block_count: course_blocks?.[0]?.count ?? 0,
      student_count: enrollments?.[0]?.count ?? 0
    }))
  });
});

// Шаг 1: ИИ разбирает тему на план из блоков, курс создаётся как черновик
router.post('/courses', async (req, res) => {
  const topic = String(req.body.topic || '').trim();
  const difficulty = ['Базовый', 'Средний', 'Продвинутый'].includes(req.body.difficulty) ? req.body.difficulty : 'Средний';
  const blocksCount = Math.min(Math.max(parseInt(req.body.blocksCount, 10) || 4, 2), 8);
  if (topic.length < 3) throw httpError(400, 'Опишите тему курса (не меньше 3 символов)');

  const outline = await ai.generateOutline({ topic, difficulty, blocksCount });
  const course = await q(
    db.from('courses')
      .insert({
        teacher_id: req.user.id,
        title: outline.title,
        description: outline.description,
        topic,
        difficulty,
        ai_model: outline.model
      })
      .select()
      .single()
  );
  const blocks = normalizeOutline(outline.blocks).map((b) => ({
    course_id: course.id,
    position: b.position,
    title: b.title,
    goal: b.goal
  }));
  await q(db.from('course_blocks').insert(blocks));
  res.status(201).json({ course_id: course.id });
});

// Полная структура курса для преподавателя (с правильными ответами)
router.get('/courses/:id', async (req, res) => {
  const course = await getOwnCourse(req.params.id, req.user.id);
  const blocks = await loadBlocksWithContent(course.id);
  res.json({ course, blocks });
});

// Изменение названия и описания курса
router.patch('/courses/:id', async (req, res) => {
  await getOwnCourse(req.params.id, req.user.id);
  const update = {};
  if (typeof req.body.title === 'string' && req.body.title.trim()) update.title = req.body.title.trim().slice(0, 200);
  if (typeof req.body.description === 'string') update.description = req.body.description.trim().slice(0, 2000);
  const course = await q(db.from('courses').update(update).eq('id', req.params.id).select().single());
  res.json({ course });
});

// Сохранение плана: переименование, порядок, удаление и добавление блоков
router.put('/courses/:id/outline', async (req, res) => {
  const course = await getOwnCourse(req.params.id, req.user.id);
  const outline = normalizeOutline(req.body.blocks);
  const existing = await q(db.from('course_blocks').select('id, title, goal').eq('course_id', course.id));
  const existingIds = new Set(existing.map((b) => b.id));
  const keptIds = new Set(outline.filter((b) => b.id && existingIds.has(b.id)).map((b) => b.id));

  const toDelete = existing.filter((b) => !keptIds.has(b.id)).map((b) => b.id);
  if (toDelete.length) await q(db.from('course_blocks').delete().in('id', toDelete));

  for (const b of outline) {
    if (b.id && existingIds.has(b.id)) {
      const old = existing.find((e) => e.id === b.id);
      const update = { position: b.position, title: b.title, goal: b.goal };
      // Если тема блока изменилась, старое содержимое больше не соответствует плану
      if (old.title !== b.title || old.goal !== b.goal) update.content_status = 'outline';
      await q(db.from('course_blocks').update(update).eq('id', b.id));
    } else {
      await q(db.from('course_blocks').insert({ course_id: course.id, position: b.position, title: b.title, goal: b.goal }));
    }
  }
  const blocks = await loadBlocksWithContent(course.id);
  res.json({ blocks });
});

// Шаг 2: ИИ генерирует теорию, тест и практику для блока (повторный вызов перегенерирует блок)
router.post('/blocks/:id/generate', async (req, res) => {
  const { block, course } = await getOwnBlock(req.params.id, req.user.id);
  const previousBlocks = await q(
    db.from('course_blocks').select('position, title').eq('course_id', course.id).lt('position', block.position).order('position')
  );
  const content = await ai.generateBlockContent({ course, block, previousBlocks });

  const quiz = (content.quiz || [])
    .filter((x) => Array.isArray(x.options) && x.options.length >= 2 && Number.isInteger(x.correct_index) && x.correct_index >= 0 && x.correct_index < x.options.length)
    .map((x, i) => ({
      block_id: block.id,
      position: i + 1,
      question_text: x.question,
      options: x.options,
      correct_index: x.correct_index,
      explanation: x.explanation || ''
    }));
  if (!quiz.length) throw httpError(502, 'ИИ не сформировал корректный тест, попробуйте ещё раз');

  await q(db.from('quiz_questions').delete().eq('block_id', block.id));
  await q(db.from('practice_tasks').delete().eq('block_id', block.id));
  await q(db.from('quiz_questions').insert(quiz));
  await q(
    db.from('practice_tasks').insert({
      block_id: block.id,
      title: content.practice.title,
      instructions: content.practice.instructions,
      starter_code: content.practice.starter_code || '',
      evaluation_criteria: content.practice.evaluation_criteria
    })
  );
  await q(
    db.from('course_blocks')
      .update({
        content_status: 'generated',
        summary: content.summary,
        theory_markdown: content.theory_markdown,
        code_example: content.code_example,
        key_concepts: content.key_concepts || [],
        estimated_minutes: content.estimated_minutes || null,
        generated_at: new Date().toISOString()
      })
      .eq('id', block.id)
  );
  const [updated] = (await loadBlocksWithContent(course.id)).filter((b) => b.id === block.id);
  res.json({ block: updated });
});

// Публикация: курс становится доступен студентам по коду приглашения
router.post('/courses/:id/publish', async (req, res) => {
  const course = await getOwnCourse(req.params.id, req.user.id);
  const blocks = await q(db.from('course_blocks').select('id, content_status').eq('course_id', course.id));
  if (!blocks.length) throw httpError(400, 'В курсе нет блоков');
  if (blocks.some((b) => b.content_status !== 'generated')) {
    throw httpError(400, 'Сначала сгенерируйте содержимое всех блоков');
  }
  let inviteCode = course.invite_code;
  for (let attempt = 0; !inviteCode && attempt < 5; attempt++) {
    const candidate = generateInviteCode();
    const taken = await q(db.from('courses').select('id').eq('invite_code', candidate).maybeSingle());
    if (!taken) inviteCode = candidate;
  }
  const updated = await q(
    db.from('courses')
      .update({ status: 'published', invite_code: inviteCode, published_at: course.published_at || new Date().toISOString() })
      .eq('id', course.id)
      .select()
      .single()
  );
  res.json({ course: updated });
});

router.delete('/courses/:id', async (req, res) => {
  await getOwnCourse(req.params.id, req.user.id);
  await q(db.from('courses').delete().eq('id', req.params.id));
  res.status(204).end();
});

// Прогресс студентов курса по блокам
router.get('/courses/:id/students', async (req, res) => {
  const course = await getOwnCourse(req.params.id, req.user.id);
  const blocks = await q(db.from('course_blocks').select('id, position, title').eq('course_id', course.id).order('position'));
  const enrollments = await q(
    db.from('enrollments').select('student_id, joined_at, profiles(full_name)').eq('course_id', course.id).order('joined_at')
  );
  const blockIds = blocks.map((b) => b.id);
  const studentIds = enrollments.map((e) => e.student_id);
  let attempts = [];
  let submissions = [];
  if (blockIds.length && studentIds.length) {
    [attempts, submissions] = await Promise.all([
      q(db.from('quiz_attempts').select('student_id, block_id, score, passed').in('block_id', blockIds).in('student_id', studentIds)),
      q(db.from('practice_submissions').select('student_id, block_id, score, passed').in('block_id', blockIds).in('student_id', studentIds))
    ]);
  }
  const students = enrollments.map((e) => {
    const states = computeBlockStates(
      blocks,
      attempts.filter((a) => a.student_id === e.student_id),
      submissions.filter((s) => s.student_id === e.student_id)
    );
    return {
      student_id: e.student_id,
      full_name: e.profiles?.full_name || 'Студент',
      joined_at: e.joined_at,
      progress: progressPercent(states),
      blocks: states
    };
  });
  res.json({ blocks, students });
});

// Решения практических заданий
router.get('/courses/:id/submissions', async (req, res) => {
  const course = await getOwnCourse(req.params.id, req.user.id);
  const blocks = await q(db.from('course_blocks').select('id, position, title').eq('course_id', course.id));
  if (!blocks.length) return res.json({ submissions: [] });
  const rows = await q(
    db.from('practice_submissions')
      .select('id, block_id, code, score, passed, ai_feedback, teacher_comment, created_at, profiles(full_name)')
      .in('block_id', blocks.map((b) => b.id))
      .order('created_at', { ascending: false })
      .limit(200)
  );
  res.json({
    submissions: rows.map(({ profiles, ...s }) => ({
      ...s,
      student_name: profiles?.full_name || 'Студент',
      block_title: blocks.find((b) => b.id === s.block_id)?.title || ''
    }))
  });
});

router.patch('/submissions/:id', async (req, res) => {
  const submission = await q(db.from('practice_submissions').select('id, block_id').eq('id', req.params.id).maybeSingle());
  if (!submission) throw httpError(404, 'Решение не найдено');
  await getOwnBlock(submission.block_id, req.user.id);
  const updated = await q(
    db.from('practice_submissions')
      .update({ teacher_comment: String(req.body.teacher_comment || '').trim().slice(0, 2000) || null })
      .eq('id', submission.id)
      .select('id, teacher_comment')
      .single()
  );
  res.json({ submission: updated });
});

// Вопросы студентов к ИИ-наставнику
router.get('/courses/:id/tutor', async (req, res) => {
  const course = await getOwnCourse(req.params.id, req.user.id);
  const blocks = await q(db.from('course_blocks').select('id, title').eq('course_id', course.id));
  if (!blocks.length) return res.json({ messages: [] });
  const rows = await q(
    db.from('tutor_messages')
      .select('id, block_id, question, answer, created_at, profiles(full_name)')
      .in('block_id', blocks.map((b) => b.id))
      .order('created_at', { ascending: false })
      .limit(200)
  );
  res.json({
    messages: rows.map(({ profiles, ...m }) => ({
      ...m,
      student_name: profiles?.full_name || 'Студент',
      block_title: blocks.find((b) => b.id === m.block_id)?.title || ''
    }))
  });
});

module.exports = router;
