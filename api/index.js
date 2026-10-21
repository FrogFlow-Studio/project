/**
 * Бессерверная точка входа (Vercel Serverless Function)
 * Перенаправляет все запросы /api/* в приложение Express (src/server.js)
 */
const app = require('../src/server');

module.exports = app;
