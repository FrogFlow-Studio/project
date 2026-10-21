/**
 * Подключение к Supabase с ключом service_role.
 * Ключ используется только на сервере и никогда не отдаётся в браузер.
 */
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error('Не заданы переменные окружения SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

// Клиент для работы с таблицами и администрирования пользователей
const db = createClient(url, serviceKey, clientOptions);

// Отдельный клиент на каждую операцию входа, чтобы сессии пользователей не смешивались
function authClient() {
  return createClient(url, serviceKey, clientOptions);
}

/**
 * Выполняет запрос к Supabase и выбрасывает ошибку, если запрос не удался
 */
async function q(promise) {
  const { data, error } = await promise;
  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }
  return data;
}

module.exports = { db, authClient, q };
