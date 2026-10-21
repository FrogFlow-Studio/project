/**
 * Аутентификация через Supabase Auth.
 * Браузер получает от сервера access_token и передаёт его в заголовке Authorization.
 * Роль пользователя хранится в таблице profiles и проверяется на каждом запросе.
 */
const { db, authClient, q } = require('./supabase');
const { httpError } = require('./logic');

async function register({ email, password, full_name, role }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const name = String(full_name || '').trim();
  if (!cleanEmail || !cleanEmail.includes('@')) throw httpError(400, 'Укажите корректный email');
  if (String(password || '').length < 6) throw httpError(400, 'Пароль должен быть не короче 6 символов');
  if (!name) throw httpError(400, 'Укажите имя');
  if (!['teacher', 'student'].includes(role)) throw httpError(400, 'Выберите роль');

  const { data, error } = await db.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role }
  });
  if (error) {
    const exists = /already|registered|exists/i.test(error.message);
    throw httpError(exists ? 409 : 400, exists ? 'Пользователь с таким email уже зарегистрирован' : error.message);
  }

  try {
    await q(db.from('profiles').insert({ id: data.user.id, full_name: name, role }));
  } catch (err) {
    await db.auth.admin.deleteUser(data.user.id);
    throw err;
  }
  return login({ email: cleanEmail, password });
}

async function login({ email, password }) {
  const { data, error } = await authClient().auth.signInWithPassword({
    email: String(email || '').trim().toLowerCase(),
    password: String(password || '')
  });
  if (error) throw httpError(401, 'Неверный email или пароль');
  const profile = await loadProfile(data.user.id);
  return { session: pickSession(data.session), profile };
}

async function refresh({ refresh_token }) {
  if (!refresh_token) throw httpError(401, 'Сессия истекла, войдите снова');
  const { data, error } = await authClient().auth.refreshSession({ refresh_token });
  if (error || !data.session) throw httpError(401, 'Сессия истекла, войдите снова');
  const profile = await loadProfile(data.user.id);
  return { session: pickSession(data.session), profile };
}

function pickSession(session) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at
  };
}

async function loadProfile(userId) {
  const profile = await q(db.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle());
  if (!profile) throw httpError(403, 'Профиль пользователя не найден');
  return profile;
}

/**
 * Middleware: проверяет токен и кладёт профиль пользователя в req.user
 */
async function requireUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(httpError(401, 'Требуется вход в систему'));
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return next(httpError(401, 'Сессия истекла, войдите снова'));
  try {
    req.user = await loadProfile(data.user.id);
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return next(httpError(403, role === 'teacher' ? 'Раздел доступен только преподавателю' : 'Раздел доступен только студенту'));
    }
    next();
  };
}

module.exports = { register, login, refresh, requireUser, requireRole };
