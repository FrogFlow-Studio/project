/**
 * Маршруты студента: вступление в курс по invite_code,
 * последовательное изучение блоков, сдача тестов, проверка кода, ИИ-наставник.
 */
const express = require('express');
const { db, q } = require('../supabase');
const ai = require('../ai');
const {
  scoreQuiz,
  computeBlockStates,
  progressPercent,
  httpError
} = require('../logic');

const router = express.Router();

/**
 * Проверка, что студент записан на курс
 */
async function getEnrolledCourse(courseId, studentId) {
  const enrollment = await q(
    db.from('enrollments')
      .select('course_id, joined_at, courses(*, profiles(full_name))')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle()
  );
  if (!enrollment || !enrollment.courses) throw httpError(404, 'Вы не записаны на этот курс');
  return enrollment.courses;
}

// Список курсов студента
router.get('/courses', async (req, res) => {
  const enrollments = await q(
    db.from('enrollments')
      .select('joined_at, courses(id, title, topic, description, difficulty, status, teacher_id, profiles(full_name))')
      .eq('student_id', req.user.id)
      .order('joined_at', { ascending: false })
  );

  const courseList = [];
  for (const item of enrollments) {
    const c = item.courses;
    if (!c || c.status !== 'published') continue;
    
    // Получаем блоки и прогресс
    const blocks = await q(db.from('course_blocks').select('id, position').eq('course_id', c.id).order('position'));
    const blockIds = blocks.map((b) => b.id);
    let attempts = [];
    let submissions = [];
    if (blockIds.length) {
      [attempts, submissions] = await Promise.all([
        q(db.from('quiz_attempts').select('block_id, score, passed').eq('student_id', req.user.id).in('block_id', blockIds)),
        q(db.from('practice_submissions').select('block_id, score, passed').eq('student_id', req.user.id).in('block_id', blockIds))
      ]);
    }
    const states = computeBlockStates(blocks, attempts, submissions);
    courseList.push({
      id: c.id,
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
      teacher_name: c.profiles?.full_name || 'Преподаватель',
      progress: progressPercent(states),
      block_count: blocks.length
    });
  }

  res.json({ courses: courseList });
});

// Запись на курс по коду приглашения
router.post('/courses/join', async (req, res) => {
  const code = String(req.body.invite_code || '').trim().toUpperCase();
  if (!code) throw httpError(400, 'Введите код приглашения');

  const course = await q(
    db.from('courses')
      .select('id, title, status')
      .eq('invite_code', code)
      .maybeSingle()
  );
  if (!course || course.status !== 'published') {
    throw httpError(404, 'Курс с таким кодом не найден или ещё не опубликован');
  }

  const existing = await q(
    db.from('enrollments')
      .select('id')
      .eq('course_id', course.id)
      .eq('student_id', req.user.id)
      .maybeSingle()
  );
  if (existing) {
    return res.json({ course_id: course.id, message: 'Вы уже записаны на этот курс' });
  }

  await q(db.from('enrollments').insert({ course_id: course.id, student_id: req.user.id }));
  res.status(201).json({ course_id: course.id, message: `Вы успешно записаны на курс «${course.title}»` });
});

// Структура курса для студента: блоки со статусами (открыт/заблокирован/пройден)
router.get('/courses/:id', async (req, res) => {
  const course = await getEnrolledCourse(req.params.id, req.user.id);
  const blocks = await q(
    db.from('course_blocks')
      .select('id, position, title, goal, summary, estimated_minutes')
      .eq('course_id', course.id)
      .order('position')
  );

  const blockIds = blocks.map((b) => b.id);
  let attempts = [];
  let submissions = [];
  if (blockIds.length) {
    [attempts, submissions] = await Promise.all([
      q(db.from('quiz_attempts').select('block_id, score, passed').eq('student_id', req.user.id).in('block_id', blockIds)),
      q(db.from('practice_submissions').select('block_id, score, passed').eq('student_id', req.user.id).in('block_id', blockIds))
    ]);
  }

  const states = computeBlockStates(blocks, attempts, submissions);
  const blocksWithStates = blocks.map((b) => {
    const st = states.find((s) => s.block_id === b.id);
    return {
      ...b,
      unlocked: st?.unlocked ?? false,
      completed: st?.completed ?? false,
      quiz_passed: st?.quiz_passed ?? false,
      practice_passed: st?.practice_passed ?? false,
      best_quiz_score: st?.best_quiz_score ?? null,
      best_practice_score: st?.best_practice_score ?? null
    };
  });

  res.json({
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      progress: progressPercent(states)
    },
    blocks: blocksWithStates
  });
});

// Получение содержимого открытого блока (вопросы БЕЗ correct_index и правильных ответов)
router.get('/blocks/:id', async (req, res) => {
  const block = await q(db.from('course_blocks').select('*').eq('id', req.params.id).maybeSingle());
  if (!block) throw httpError(404, 'Блок не найден');

  const course = await getEnrolledCourse(block.course_id, req.user.id);
  
  // Проверяем, открыт ли блок
  const allBlocks = await q(db.from('course_blocks').select('id, position').eq('course_id', course.id).order('position'));
  const prevIds = allBlocks.filter((b) => b.position < block.position).map((b) => b.id);
  if (prevIds.length) {
    const [prevQuizzes, prevPractices] = await Promise.all([
      q(db.from('quiz_attempts').select('block_id, passed').eq('student_id', req.user.id).in('block_id', prevIds)),
      q(db.from('practice_submissions').select('block_id, passed').eq('student_id', req.user.id).in('block_id', prevIds))
    ]);
    const prevStates = computeBlockStates(allBlocks, prevQuizzes, prevPractices);
    const thisState = prevStates.find((s) => s.block_id === block.id);
    if (!thisState || !thisState.unlocked) {
      throw httpError(403, 'Этот блок заблокирован: сначала завершите предыдущие блоки');
    }
  }

  const [questions, task, myAttempts, mySubmissions] = await Promise.all([
    q(db.from('quiz_questions').select('id, position, question_text, options').eq('block_id', block.id).order('position')),
    q(db.from('practice_tasks').select('id, title, instructions, starter_code, pass_score').eq('block_id', block.id).maybeSingle()),
    q(db.from('quiz_attempts').select('score, passed, created_at').eq('block_id', block.id).eq('student_id', req.user.id).order('created_at', { ascending: false }).limit(5)),
    q(db.from('practice_submissions').select('id, code, score, passed, ai_feedback, teacher_comment, created_at').eq('block_id', block.id).eq('student_id', req.user.id).order('created_at', { ascending: false }).limit(5))
  ]);

  res.json({
    block: {
      id: block.id,
      course_id: block.course_id,
      position: block.position,
      title: block.title,
      summary: block.summary,
      theory_markdown: block.theory_markdown,
      code_example: block.code_example,
      key_concepts: block.key_concepts || [],
      estimated_minutes: block.estimated_minutes
    },
    quiz_questions: questions,
    practice_task: task,
    attempts: myAttempts,
    submissions: mySubmissions
  });
});

// Сдача теста студентом: проверка на сервере
router.post('/blocks/:id/quiz', async (req, res) => {
  const block = await q(db.from('course_blocks').select('id, course_id, position').eq('id', req.params.id).maybeSingle());
  if (!block) throw httpError(404, 'Блок не найден');
  await getEnrolledCourse(block.course_id, req.user.id);

  const questions = await q(
    db.from('quiz_questions')
      .select('id, position, correct_index, explanation')
      .eq('block_id', block.id)
      .order('position')
  );
  if (!questions.length) throw httpError(400, 'В этом блоке нет вопросов для теста');

  const evalResult = scoreQuiz(questions, req.body.answers);

  await q(
    db.from('quiz_attempts').insert({
      block_id: block.id,
      student_id: req.user.id,
      answers: req.body.answers || [],
      score: evalResult.score,
      passed: evalResult.passed
    })
  );

  res.json(evalResult);
});

// Отправка решения практики: проверка через ИИ (Claude)
router.post('/blocks/:id/practice', async (req, res) => {
  const code = String(req.body.code || '').trim();
  if (code.length < 5) throw httpError(400, 'Введите программный код решения');

  const block = await q(db.from('course_blocks').select('id, title, course_id').eq('id', req.params.id).maybeSingle());
  if (!block) throw httpError(404, 'Блок не найден');
  await getEnrolledCourse(block.course_id, req.user.id);

  const task = await q(db.from('practice_tasks').select('*').eq('block_id', block.id).maybeSingle());
  if (!task) throw httpError(404, 'Практическое задание не найдено');

  const review = await ai.reviewPractice({ block, task, code });

  const submission = await q(
    db.from('practice_submissions')
      .insert({
        block_id: block.id,
        student_id: req.user.id,
        code,
        score: review.score,
        passed: review.passed,
        ai_feedback: review.feedback
      })
      .select()
      .single()
  );

  res.json({ submission, review });
});

// Вопрос к ИИ-наставнику по текущему блоку
router.post('/blocks/:id/tutor', async (req, res) => {
  const question = String(req.body.question || '').trim();
  if (!question) throw httpError(400, 'Введите ваш вопрос');

  const block = await q(db.from('course_blocks').select('*').eq('id', req.params.id).maybeSingle());
  if (!block) throw httpError(404, 'Блок не найден');
  await getEnrolledCourse(block.course_id, req.user.id);

  const task = await q(db.from('practice_tasks').select('*').eq('block_id', block.id).maybeSingle());

  const answer = await ai.tutorAnswer({
    block,
    task,
    question,
    code: req.body.code || ''
  });

  await q(
    db.from('tutor_messages').insert({
      block_id: block.id,
      student_id: req.user.id,
      question,
      code: req.body.code || null,
      answer
    })
  );

  res.json({ answer });
});

module.exports = router;
