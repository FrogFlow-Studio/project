/**
 * Главный сервер приложения онлайн-курса «Web разработчик»
 * Разделение ролей, аутентификация через Supabase Auth,
 * подключение Claude API и обработка API запросов.
 */
require('dotenv').config();
const path = require('path');
const express = require('express');

const auth = require('./auth');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ================= Маршруты аутентификации =================
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const data = await auth.register(req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const data = await auth.login(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/refresh', async (req, res, next) => {
  try {
    const data = await auth.refresh(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.get('/api/auth/me', auth.requireUser, (req, res) => {
  res.json({ user: req.user });
});

// ================= Защищённые маршруты по ролям =================
app.use('/api/teacher', auth.requireUser, auth.requireRole('teacher'), teacherRoutes);
app.use('/api/student', auth.requireUser, auth.requireRole('student'), studentRoutes);

// Централизованная обработка ошибок
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Внутренняя ошибка сервера',
    status
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Сервер платформы «Web разработчик» запущен: http://localhost:${PORT}`);
  });
}

module.exports = app;
