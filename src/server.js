/**
 * Главный сервер приложения онлайн-курса «Web разработчик»
 * Дисциплина: «Серверное программирование»
 * Реализует REST API маршрутизацию, разграничение ролей (студент / преподаватель),
 * генерацию учебных блоков через ИИ Claude и хранение в PostgreSQL (Supabase).
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const db = require('./db');
const ai = require('./ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

/**
 * Middleware: проверка роли преподавателя для защищённых маршрутов управления курсом
 */
function requireTeacherRole(req, res, next) {
  const role = req.headers['x-user-role'] || req.body?.role || 'teacher';
  if (role !== 'teacher') {
    return res.status(403).json({
      error: 'Доступ запрещён: операция разрешена только пользователю с ролью «Преподаватель»'
    });
  }
  next();
}

/**
 * GET /api/status — состояние сервера, хранилища Supabase и модели Claude
 */
app.get('/api/status', async (req, res) => {
  const stats = await db.getDashboardStats(req.query.userId || 'u-student-01');
  res.json({
    status: 'online',
    storage_mode: stats.storage_mode,
    ai_engine: stats.ai_engine,
    users: stats.users
  });
});

/**
 * GET /api/courses — список всех доступных курсов
 */
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await db.listCourses();
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/courses/:id — получение полной структуры курса с его учебными блоками, тестами и заданиями
 */
app.get('/api/courses/:id', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] || req.query.role || 'student';
    const includeCorrect = role === 'teacher';
    const course = await db.getCourseDetails(req.params.id, includeCorrect);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/courses/generate — ИИ-генерация нового курса по введённой теме (разбивка на блоки, тесты, практику)
 */
app.post('/api/courses/generate', requireTeacherRole, async (req, res) => {
  try {
    const { topic, difficulty, blocksCount } = req.body;
    if (!topic || String(topic).trim().length < 3) {
      return res.status(400).json({
        error: 'Пожалуйста, укажите тему курса (не менее 3 символов)'
      });
    }

    const generatedPayload = await ai.generateCourseFromTopic({
      topic,
      difficulty: difficulty || 'Средний',
      blocksCount: Number(blocksCount) || 3
    });

    const savedCourse = await db.saveGeneratedCourse(generatedPayload);
    res.status(201).json({
      message: 'Курс успешно сгенерирован моделью ИИ и сохранён в базе данных',
      course: savedCourse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/blocks/:blockId/quiz — серверная проверка ответов теста по учебному блоку
 */
app.post('/api/blocks/:blockId/quiz', async (req, res) => {
  try {
    const { userId, answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Поле answers должно быть массивом индексов выбранных ответов' });
    }
    const result = await db.evaluateAndSaveQuiz(
      userId || 'u-student-01',
      req.params.blockId,
      answers
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/blocks/:blockId/practice — автоматическая и ИИ-проверка практического кода студента
 */
app.post('/api/blocks/:blockId/practice', async (req, res) => {
  try {
    const { userId, courseId, code } = req.body;
    if (!code || String(code).trim().length === 0) {
      return res.status(400).json({ error: 'Код решения не может быть пустым' });
    }

    const courses = await db.listCourses();
    let targetBlock = null;
    for (const c of courses) {
      if (courseId && c.id !== courseId) continue;
      const details = await db.getCourseDetails(c.id, true);
      const found = details?.blocks?.find((b) => b.id === req.params.blockId);
      if (found) {
        targetBlock = found;
        break;
      }
    }

    if (!targetBlock || !targetBlock.practice_task) {
      return res.status(404).json({ error: 'Практическое задание для данного блока не найдено' });
    }

    const evaluation = await ai.evaluatePracticeCode({
      blockTitle: targetBlock.title,
      taskInstructions: targetBlock.practice_task.instructions,
      expectedPatterns: targetBlock.practice_task.expected_patterns,
      evaluationCriteria: targetBlock.practice_task.evaluation_criteria,
      studentCode: code
    });

    const saved = await db.savePracticeSubmission(
      userId || 'u-student-01',
      req.params.blockId,
      code,
      evaluation
    );

    res.status(200).json({
      evaluation,
      submission: saved.submission,
      progress: saved.progress
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/blocks/:blockId/tutor — обращение студента к ИИ-наставнику по текущему блоку
 */
app.post('/api/blocks/:blockId/tutor', async (req, res) => {
  try {
    const { userId, question, code } = req.body;
    if (!question || String(question).trim().length === 0) {
      return res.status(400).json({ error: 'Вопрос к ИИ-наставнику не может быть пустым' });
    }

    const courses = await db.listCourses();
    let targetBlock = null;
    for (const c of courses) {
      const details = await db.getCourseDetails(c.id, true);
      const found = details?.blocks?.find((b) => b.id === req.params.blockId);
      if (found) {
        targetBlock = found;
        break;
      }
    }

    if (!targetBlock) {
      return res.status(404).json({ error: 'Учебный блок не найден' });
    }

    const aiAnswer = await ai.askAiTutor({
      blockTitle: targetBlock.title,
      theoryMarkdown: targetBlock.theory_markdown,
      taskInstructions: targetBlock.practice_task?.instructions || '',
      studentQuestion: question,
      studentCode: code || ''
    });

    const logEntry = await db.saveTutorInteraction(
      userId || 'u-student-01',
      req.params.blockId,
      question,
      code,
      aiAnswer
    );

    res.status(200).json({
      answer: aiAnswer,
      log: logEntry
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard — сводные данные прогресса, решений и диалогов для преподавателя и студента
 */
app.get('/api/dashboard', async (req, res) => {
  try {
    const stats = await db.getDashboardStats(req.query.userId || 'u-student-01');
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/submissions/:id/review — комментарий и статус проверки от преподавателя
 */
app.post('/api/submissions/:id/review', requireTeacherRole, async (req, res) => {
  try {
    const { teacherComment, status } = req.body;
    const updated = await db.updateTeacherReview(req.params.id, teacherComment || '', status);
    res.json({ submission: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Сервер платформы «Web разработчик» запущен: http://localhost:${PORT}`);
  });
}

module.exports = app;
