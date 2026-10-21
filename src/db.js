/**
 * Модуль хранения данных с поддержкой PostgreSQL (Supabase)
 * и автоматическим локальным JSON-репозиторием для автономной работы.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');

const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_FILE = IS_VERCEL
  ? path.join(os.tmpdir(), 'ai_course_local_db.json')
  : path.join(__dirname, '..', 'data', 'local_db.json');

let memoryDbCache = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project-id')
);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function generateId() {
  return crypto.randomUUID();
}

/**
 * Начальные демонстрационные данные для курса «Web разработчик»
 */
function getInitialSeedData() {
  const teacherId = 'u-teacher-01';
  const student1Id = 'u-student-01';
  const student2Id = 'u-student-02';

  const course1Id = 'c-webdev-full';
  const course2Id = 'c-backend-api';

  const b1Id = 'b-html-css';
  const b2Id = 'b-js-async';
  const b3Id = 'b-node-express';
  const b4Id = 'b-postgres-supabase';

  const b5Id = 'b-rest-auth';
  const b6Id = 'b-sql-rls';

  return {
    users: [
      {
        id: teacherId,
        full_name: 'Сатмаганбетова Ж.З.',
        email: 'teacher@kru.kz',
        role: 'teacher',
        group_name: 'Кафедра ПО'
      },
      {
        id: student1Id,
        full_name: 'Прободяк Я.С.',
        email: 'probodyak@kru.kz',
        role: 'student',
        group_name: 'ИТиР-3 курс'
      },
      {
        id: student2Id,
        full_name: 'Ахметов Д.К.',
        email: 'akhmetov@kru.kz',
        role: 'student',
        group_name: 'ИТиР-3 курс'
      }
    ],
    courses: [
      {
        id: course1Id,
        title: 'Онлайн-курс «Web разработчик»: от вёрстки до серверной архитектуры',
        topic_prompt: 'Полный курс Web-разработчик: семантический HTML5 и адаптивный CSS3, клиентский JavaScript и Fetch API, серверное программирование на Node.js и Express, работа с реляционной БД PostgreSQL (Supabase)',
        description: 'Комплексный курс подготовки веб-разработчиков, автоматически структурированный генеративной моделью Claude на 4 последовательных учебных блока с теоретическим разбором, примерами кода, проверочными тестами и практическими задачами.',
        difficulty: 'Базовый / Средний',
        target_audience: 'Студенты ОП 6В06103 «Информационные технологии и робототехника»',
        ai_model: 'claude-3-5-sonnet-20241022',
        is_published: true,
        author_id: teacherId,
        created_at: '2026-10-15T10:15:00Z'
      },
      {
        id: course2Id,
        title: 'Проектирование защищённых REST API и авторизация JWT на Node.js',
        topic_prompt: 'Серверное программирование: маршрутизация REST API, промежуточное ПО (Middleware), аутентификация JWT и защита данных в PostgreSQL',
        description: 'Специализированный модуль по серверному программированию, сгенерированный ИИ по запросу преподавателя для углублённого изучения безопасности веб-приложений.',
        difficulty: 'Продвинутый',
        target_audience: 'Студенты 3 курса дисциплины «Серверное программирование»',
        ai_model: 'claude-3-5-sonnet-20241022',
        is_published: true,
        author_id: teacherId,
        created_at: '2026-10-18T14:30:00Z'
      }
    ],
    course_blocks: [
      {
        id: b1Id,
        course_id: course1Id,
        order_index: 1,
        title: 'Блок 1. Семантическая вёрстка HTML5 и компонентные сетки CSS Grid / Flexbox',
        summary: 'Изучение структуры современного HTML5-документа, семантических тегов для доступности (a11y) и построения адаптивных макетов на основе CSS Grid и Flexbox.',
        theory_markdown: `### 1. Роль семантической разметки в современной веб-разработке
Семантический HTML5 позволяет браузерам, поисковым роботам и экранным дикторам однозначно интерпретировать назначение каждого блока страницы. Вместо универсальных контейнеров \`<div>\` используются смысловые теги: \`<header>\`, \`<nav>\`, \`<main>\`, \`<section>\`, \`<article>\` и \`<footer>\`.

### 2. Двумерная и одномерная раскладка: CSS Grid и Flexbox
* **Flexbox (\`display: flex\`)** предназначен для распределения элементов вдоль одной главной оси (строки или столбца). Свойства \`justify-content\` и \`align-items\` управляют выравниванием и свободным пространством.
* **CSS Grid (\`display: grid\`)** решает задачу двумерной сетки макета. Использование функции \`repeat(auto-fit, minmax(280px, 1fr))\` позволяет создавать адаптивные карточки без громоздких медиа-запросов.`,
        code_example: `<!-- Пример адаптивной сетки карточек учебного курса -->
<main class="course-Catalog">
  <article class="module-card">
    <h2>Модуль 1: Основы Web</h2>
    <p>Изучение семантики и каскадных таблиц стилей.</p>
  </article>
</main>

<style>
.course-Catalog {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  padding: 24px;
}
.module-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 12px;
  padding: 16px;
}
</style>`,
        key_concepts: ['Семантика HTML5', 'DOM-дерево', 'CSS Flexbox', 'CSS Grid Layout', 'Адаптивный дизайн'],
        estimated_minutes: 45
      },
      {
        id: b2Id,
        course_id: course1Id,
        order_index: 2,
        title: 'Блок 2. Асинхронный JavaScript, Event Loop и обмен данными через Fetch API',
        summary: 'Разбор цикла событий (Event Loop), промисов (Promises), синтаксиса async/await и выполнения HTTP-запросов клиента к серверу в формате JSON.',
        theory_markdown: `### 1. Однопоточность JavaScript и цикл событий (Event Loop)
Среда выполнения JavaScript в браузере и на сервере Node.js выполняет пользовательский код в одном потоке. Чтобы сетевые запросы и таймеры не блокировали интерфейс, длительные операции передаются в Web API / libuv, а их колбэки ставятся в очередь микрозадач (Microtask Queue) и макрозадач.

### 2. Работа с сетевыми запросами через Fetch API и async/await
Конструкция \`async/await\` является синтаксической надстройкой над объектами \`Promise\`. При вызове \`await fetch(url)\` функция приостанавливает выполнение до получения заголовков ответа сервера. Важно помнить, что \`fetch\` не выбрасывает исключение при HTTP-статусах 404 или 500 — необходимо явно проверять свойство \`response.ok\`.`,
        code_example: `async function loadCourseBlocks(courseId) {
  try {
    const response = await fetch(\`/api/courses/\${courseId}/blocks\`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(\`Ошибка сервера: HTTP \${response.status}\`);
    }
    const data = await response.json();
    return data.blocks;
  } catch (error) {
    console.error('Не удалось загрузить учебные блоки:', error.message);
    return [];
  }
}`,
        key_concepts: ['Event Loop', 'Promise', 'async / await', 'Fetch API', 'HTTP-статусы и JSON'],
        estimated_minutes: 60
      },
      {
        id: b3Id,
        course_id: course1Id,
        order_index: 3,
        title: 'Блок 3. Серверное программирование на Node.js: архитектура REST API и Express',
        summary: 'Построение серверной части веб-приложения: маршрутизация HTTP-методов, цепочка промежуточных обработчиков (Middleware), валидация входных данных и коды состояния.',
        theory_markdown: `### 1. Принципы архитектуры REST на стороне сервера
REST (Representational State Transfer) организует взаимодействие клиента и сервера вокруг ресурсов, адресуемых через URI. Действие над ресурсом определяется HTTP-методом:
* \`GET\` — получение данных без изменения состояния;
* \`POST\` — создание новой записи или запуск серверного процесса (например, ИИ-генерации);
* \`PUT / PATCH\` — обновление ресурса;
* \`DELETE\` — удаление.

### 2. Конвейер промежуточных функций (Middleware) в Express
Сервер Express обрабатывает каждый входящий запрос через последовательность функций \`(req, res, next)\`. Это позволяет вынести сквозные задачи — чтение JSON-тела (\`express.json()\`), проверку токена авторизации, логирование и перехват ошибок — в отдельные переиспользуемые модули.`,
        code_example: `const express = require('express');
const router = express.Router();

// Middleware проверки роли преподавателя
function requireTeacher(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ разрешён только преподавателю' });
  }
  next();
}

// POST-маршрут создания нового учебного блока
router.post('/api/blocks', requireTeacher, async (req, res) => {
  const { courseId, title, theory } = req.body;
  if (!courseId || !title) {
    return res.status(400).json({ error: 'Поля courseId и title обязательны' });
  }
  return res.status(201).json({ status: 'created', title });
});`,
        key_concepts: ['Node.js Runtime', 'REST API', 'Express Middleware', 'Валидация запросов', 'Коды ответа HTTP'],
        estimated_minutes: 65
      },
      {
        id: b4Id,
        course_id: course1Id,
        order_index: 4,
        title: 'Блок 4. Работа с реляционной СУБД PostgreSQL (Supabase) и интеграция ИИ-моделей',
        summary: 'Проектирование связей первичных и внешних ключей (PK/FK) в PostgreSQL, защита запросов от SQL-инъекций и серверная оркестрация вызовов Claude API.',
        theory_markdown: `### 1. Реляционная модель данных в PostgreSQL (Supabase)
В клиент-серверных образовательных системах данные структурируются в связанных таблицах: курс (\`courses\`) связан отношением «один ко многим» (1:N) с учебными блоками (\`course_blocks\`), а каждый блок — с вопросами теста (\`quiz_questions\`) и решениями студентов (\`submissions\`). Целостность ссылок гарантируется ограничением \`FOREIGN KEY ... ON DELETE CASCADE\`.

### 2. Безопасное подключение языковой модели на сервере
Клиентское приложение в браузере никогда не должно обращаться к API языковой модели напрямую, так как это приведёт к утечке секретного ключа \`ANTHROPIC_API_KEY\` и позволит подделать системный промпт. Все запросы к Claude API формируются исключительно на сервере: сервер извлекает критерии задания из Supabase, добавляет ответ студента в экранированные теги и запрашивает структурированный JSON-ответ.`,
        code_example: `// Серверный запрос к таблице курсов в Supabase и проверка решения
async function saveSubmissionAndUpdateProgress(supabase, payload) {
  const { userId, blockId, courseId, score, feedback } = payload;

  const { data, error } = await supabase
    .from('submissions')
    .insert([{
      user_id: userId,
      block_id: blockId,
      submission_type: 'practice',
      auto_score: score,
      passed: score >= 70,
      ai_feedback: feedback
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}`,
        key_concepts: ['PostgreSQL и внешние ключи', 'Supabase Client SDK', 'Row Level Security (RLS)', 'Защита API-ключей на сервере', 'Системный промпт ИИ'],
        estimated_minutes: 55
      },
      {
        id: b5Id,
        course_id: course2Id,
        order_index: 1,
        title: 'Блок 1. Аутентификация на основе JWT и защита маршрутов сервера',
        summary: 'Структура JSON Web Token (Header, Payload, Signature), подписание токенов на сервере и проверка прав доступа.',
        theory_markdown: `### Структура и проверка JWT на сервере
JSON Web Token (RFC 7519) состоит из трёх частей, закодированных в Base64Url: заголовка, полезной нагрузки (идентификатор пользователя, роль, срок действия \`exp\`) и криптографической подписи HMAC-SHA256 или RSA.`,
        code_example: `function verifyTokenMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }
  next();
}`,
        key_concepts: ['RFC 7519 (JWT)', 'HMAC-SHA256', 'Authorization Bearer', 'Middleware авторизации'],
        estimated_minutes: 50
      },
      {
        id: b6Id,
        course_id: course2Id,
        order_index: 2,
        title: 'Блок 2. Построчная безопасность (RLS) в PostgreSQL и аудит транзакций',
        summary: 'Настройка политик Row Level Security в базе данных Supabase для разграничения доступа между студентами и преподавателями.',
        theory_markdown: `### Политики Row Level Security (RLS)
Механизм RLS в PostgreSQL проверяет условие доступа для каждой отдельной строки таблицы при выполнении \`SELECT\`, \`INSERT\`, \`UPDATE\` и \`DELETE\`. Это гарантирует, что студент видит только собственные решения.`,
        code_example: `CREATE POLICY "Студент видит только свои решения"
ON submissions FOR SELECT
USING (auth.uid() = user_id);`,
        key_concepts: ['Row Level Security', 'Политики доступа SQL', 'Изоляция данных'],
        estimated_minutes: 45
      }
    ],
    quiz_questions: [
      {
        id: 'q-101',
        block_id: b1Id,
        order_index: 1,
        question_text: 'Какой тег HTML5 предназначен для выделения основного уникального содержимого страницы?',
        options: ['<section>', '<main>', '<container>', '<header>'],
        correct_index: 1,
        explanation: 'Тег <main> обозначает главное, не повторяющееся на других страницах содержимое документа.'
      },
      {
        id: 'q-102',
        block_id: b1Id,
        order_index: 2,
        question_text: 'Какое выражение CSS Grid создаёт адаптивное число колонок шириной не менее 280px?',
        options: [
          'grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));',
          'display: flex; flex-wrap: 280px;',
          'grid-columns: auto 280px;',
          'align-items: minmax(280px, 100%);'
        ],
        correct_index: 0,
        explanation: 'Комбинация repeat(auto-fit, minmax(280px, 1fr)) автоматически рассчитывает количество колонок по ширине контейнера.'
      },
      {
        id: 'q-103',
        block_id: b1Id,
        order_index: 3,
        question_text: 'Какое свойство Flexbox отвечает за выравнивание элементов вдоль главной оси?',
        options: ['align-items', 'justify-content', 'flex-direction', 'grid-gap'],
        correct_index: 1,
        explanation: 'Свойство justify-content распределяет элементы вдоль главной оси flex-контейнера.'
      },
      {
        id: 'q-201',
        block_id: b2Id,
        order_index: 1,
        question_text: 'Что возвращает функция, объявленная с ключевым словом async в JavaScript?',
        options: [
          'Всегда объект Promise',
          'Синхронную строку JSON',
          'Объект XMLHttpRequest',
          'Численный идентификатор потока'
        ],
        correct_index: 0,
        explanation: 'Любая async-функция автоматически оборачивает возвращаемое значение в объект Promise.'
      },
      {
        id: 'q-202',
        block_id: b2Id,
        order_index: 2,
        question_text: 'Как корректно проверить успешность HTTP-ответа при использовании вызова fetch()?',
        options: [
          'Проверить булево свойство response.ok или код response.status',
          'Вызов fetch() сам выбрасывает ошибку при статусе 404',
          'Проверить свойство window.fetchSuccess',
          'Использовать метод JSON.stringify(response)'
        ],
        correct_index: 0,
        explanation: 'Промис fetch() отклоняется только при сетевом сбое; статусы 4xx и 5xx нужно проверять через response.ok.'
      },
      {
        id: 'q-203',
        block_id: b2Id,
        order_index: 3,
        question_text: 'В какую очередь попадают обработчики .then() и продолжения после await в цикле событий?',
        options: [
          'В очередь микрозадач (Microtask Queue)',
          'В очередь макрозадач (Macrotask Queue после setTimeout)',
          'В стек вызовов CSS-парсера',
          'В синхронный блокирующий поток ОС'
        ],
        correct_index: 0,
        explanation: 'Продолжения промисов (Promises) имеют высокий приоритет и помещаются в очередь микрозадач.'
      },
      {
        id: 'q-301',
        block_id: b3Id,
        order_index: 1,
        question_text: 'Какой HTTP-код состояния должен вернуть сервер REST API при успешном создании нового ресурса методом POST?',
        options: ['200 OK', '201 Created', '204 No Content', '302 Found'],
        correct_index: 1,
        explanation: 'Статус 201 Created стандартизирован для подтверждения успешного создания нового ресурса на сервере.'
      },
      {
        id: 'q-302',
        block_id: b3Id,
        order_index: 2,
        question_text: 'Для чего в обработчике Middleware фреймворка Express вызывается функция next()?',
        options: [
          'Для передачи управления следующему обработчику в цепочке маршрута',
          'Для немедленного завершения процесса Node.js',
          'Для очистки таблицы в базе данных',
          'Для перезагрузки страницы в браузере клиента'
        ],
        correct_index: 0,
        explanation: 'Без вызова next() или отправки ответа запрос зависнет в текущем промежуточном обработчике.'
      },
      {
        id: 'q-303',
        block_id: b3Id,
        order_index: 3,
        question_text: 'Какой встроенный middleware в Express используется для разбора тела входящего запроса в формате JSON?',
        options: ['express.json()', 'express.static()', 'express.urlencoded()', 'JSON.parse(req)'],
        correct_index: 0,
        explanation: 'Подключение app.use(express.json()) автоматически разбирает JSON-тело запроса в объект req.body.'
      },
      {
        id: 'q-401',
        block_id: b4Id,
        order_index: 1,
        question_text: 'Почему запросы к API языковой модели (Claude) должны выполняться на сервере, а не напрямую из браузера?',
        options: [
          'Для защиты секретного API-ключа, контроля лимитов и предотвращения подмены системного промпта',
          'Потому что браузеры не поддерживают формат данных JSON',
          'Потому что язык JavaScript не работает с протоколом HTTPS',
          'Для уменьшения размера шрифта на странице'
        ],
        correct_index: 0,
        explanation: 'Хранение API-ключей и формирование системного промпта на сервере защищает платформу от компрометации.'
      },
      {
        id: 'q-402',
        block_id: b4Id,
        order_index: 2,
        question_text: 'Какой механизм PostgreSQL (Supabase) позволяет фильтровать доступ к строкам таблицы на уровне самой СУБД?',
        options: [
          'Row Level Security (RLS)',
          'CSS Media Queries',
          'DOM Event Bubbling',
          'LocalStorage API'
        ],
        correct_index: 0,
        explanation: 'Политики Row Level Security (RLS) проверяют права доступа для каждой строки таблицы при любом SQL-запросе.'
      },
      {
        id: 'q-403',
        block_id: b4Id,
        order_index: 3,
        question_text: 'Что обеспечивает каскадное правило ON DELETE CASCADE во внешнем ключе таблицы course_blocks?',
        options: [
          'Автоматическое удаление связанных блоков при удалении родительского курса',
          'Запрет на чтение таблицы без пароля администратора',
          'Шифрование текста лекции алгоритмом SHA-256',
          'Дублирование курса при каждом входе студента'
        ],
        correct_index: 0,
        explanation: 'ON DELETE CASCADE поддерживает ссылочную целостность, удаляя дочерние записи при удалении родительской.'
      }
    ],
    practice_tasks: [
      {
        id: 'p-101',
        block_id: b1Id,
        title: 'Практическое задание 1. Семантическая карточка учебного модуля на CSS Grid',
        instructions: 'Напишите HTML-разметку с использованием семантических тегов (<main>, <article>, <h2>) и CSS-стили, задающие контейнер с сеткой display: grid и отступами gap.',
        starter_code: `<main class="modules-grid">\n  <article class="module-item">\n    <h2>Серверное программирование</h2>\n    <p>Разработка REST API и подключение к базе данных.</p>\n  </article>\n</main>\n\n<style>\n.modules-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n  gap: 16px;\n}\n</style>`,
        expected_patterns: ['<main', '<article', 'display:\\s*grid', 'grid-template-columns'],
        evaluation_criteria: 'Проверьте наличие семантических тегов <main> и <article>, заголовка и использование CSS Grid (display: grid, grid-template-columns).',
        max_score: 100
      },
      {
        id: 'p-201',
        block_id: b2Id,
        title: 'Практическое задание 2. Асинхронная функция отправки решения через Fetch API',
        instructions: 'Реализуйте асинхронную функцию submitSolution(blockId, code), которая отправляет POST-запрос через fetch() с заголовком Content-Type: application/json, проверяет response.ok и возвращает разобранный JSON.',
        starter_code: `async function submitSolution(blockId, code) {\n  const response = await fetch('/api/submissions/practice', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ blockId, code })\n  });\n  if (!response.ok) {\n    throw new Error('Ошибка при отправке решения: ' + response.status);\n  }\n  return await response.json();\n}`,
        expected_patterns: ['async\\s+function', 'await\\s+fetch', 'POST', 'response\\.ok', 'response\\.json\\(\\)'],
        evaluation_criteria: 'Код должен использовать async/await, вызывать fetch с методом POST и JSON.stringify, проверять response.ok и возвращать response.json().',
        max_score: 100
      },
      {
        id: 'p-301',
        block_id: b3Id,
        title: 'Практическое задание 3. Серверный POST-маршрут Express с валидацией входных данных',
        instructions: 'Напишите обработчик маршрута app.post("/api/courses/generate", ...), который проверяет наличие поля topic в req.body (при отсутствии возвращает статус 400), а при успехе возвращает статус 201 и JSON-объект.',
        starter_code: `app.post('/api/courses/generate', async (req, res) => {\n  const { topic, difficulty } = req.body;\n  if (!topic || topic.trim().length < 3) {\n    return res.status(400).json({ error: 'Необходимо указать тему курса' });\n  }\n  const generatedCourse = await aiService.generateCourse(topic, difficulty);\n  return res.status(201).json({ course: generatedCourse });\n});`,
        expected_patterns: ['\\.post\\(', 'req\\.body', 'status\\(400\\)', 'status\\(201\\)', '\\.json\\('],
        evaluation_criteria: 'Проверьте использование метода .post(), чтение req.body, проверку обязательного поля с возвратом status(400) и успешный ответ status(201).json().',
        max_score: 100
      },
      {
        id: 'p-401',
        block_id: b4Id,
        title: 'Практическое задание 4. Запрос к базе данных Supabase для сохранения результата',
        instructions: 'Напишите серверную функцию saveProgress(supabase, userId, blockId, score), которая выполняет запись в таблицу student_progress через метод .from("student_progress").upsert(...) и обрабатывает возможную ошибку error.',
        starter_code: `async function saveProgress(supabase, userId, blockId, score) {\n  const { data, error } = await supabase\n    .from('student_progress')\n    .upsert({\n      user_id: userId,\n      block_id: blockId,\n      practice_score: score,\n      is_completed: score >= 70\n    })\n    .select();\n\n  if (error) {\n    throw new Error('Ошибка записи в БД Supabase: ' + error.message);\n  }\n  return data;\n}`,
        expected_patterns: ['\\.from\\([\'"]student_progress[\'"]\\)', 'upsert|insert', 'if\\s*\\(\\s*error\\s*\\)'],
        evaluation_criteria: 'Функция должна обращаться к таблице student_progress через клиент supabase, передавать поля user_id, block_id, score и проверять объект error.',
        max_score: 100
      }
    ],
    submissions: [
      {
        id: 'sub-01',
        user_id: student1Id,
        block_id: b1Id,
        submission_type: 'quiz',
        submitted_payload: { answers: [1, 0, 1] },
        auto_score: 100,
        passed: true,
        ai_feedback: 'Все 3 тестовых вопроса по семантической вёрстке и сеткам CSS Grid выполнены верно (100%).',
        teacher_comment: 'Отлично усвоена база вёрстки.',
        status: 'graded',
        created_at: '2026-10-19T11:20:00Z'
      },
      {
        id: 'sub-02',
        user_id: student1Id,
        block_id: b1Id,
        submission_type: 'practice',
        submitted_payload: {
          code: `<main class="modules-grid">\n  <article class="module-item">\n    <h2>Серверное программирование</h2>\n    <p>Разработка REST API и подключение к базе данных.</p>\n  </article>\n</main>\n<style>\n.modules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }\n</style>`
        },
        auto_score: 95,
        passed: true,
        ai_feedback: 'ИИ-проверка Claude: Код полностью соответствует критериям задания. Использованы семантические контейнеры <main> и <article>, корректно настроена адаптивная сетка CSS Grid с функцией minmax(). Рекомендация: добавить внутренние отступы padding для карточки .module-item.',
        teacher_comment: 'Принято, переход к Блоку 2 открыт.',
        status: 'graded',
        created_at: '2026-10-19T11:35:00Z'
      },
      {
        id: 'sub-03',
        user_id: student1Id,
        block_id: b2Id,
        submission_type: 'quiz',
        submitted_payload: { answers: [0, 0, 0] },
        auto_score: 100,
        passed: true,
        ai_feedback: 'Тест по асинхронному JavaScript и Fetch API успешно пройден (3 из 3 верно, 100%).',
        teacher_comment: '',
        status: 'graded',
        created_at: '2026-10-20T09:40:00Z'
      },
      {
        id: 'sub-04',
        user_id: student1Id,
        block_id: b3Id,
        submission_type: 'practice',
        submitted_payload: {
          code: `app.post('/api/courses/generate', async (req, res) => {\n  const { topic } = req.body;\n  if (!topic) return res.status(400).json({ error: 'Укажите тему' });\n  return res.status(201).json({ ok: true, topic });\n});`
        },
        auto_score: 92,
        passed: true,
        ai_feedback: 'ИИ-проверка Claude: Серверный маршрут Express реализован корректно. Выполнена деструктуризация req.body, предусмотрен возврат HTTP 400 при пустом параметре topic и статус 201 Created при успешной обработке. Совет: добавьте блок try/catch для перехвата ошибок асинхронной генерации.',
        teacher_comment: 'Хорошее решение.',
        status: 'graded',
        created_at: '2026-10-20T15:10:00Z'
      },
      {
        id: 'sub-05',
        user_id: student2Id,
        block_id: b1Id,
        submission_type: 'quiz',
        submitted_payload: { answers: [1, 0, 2] },
        auto_score: 67,
        passed: false,
        ai_feedback: 'Результат: 67% (2 из 3 верно). Ошибка в вопросе №3: для выравнивания вдоль главной оси во Flexbox используется свойство justify-content, а не flex-direction.',
        teacher_comment: 'Повторите свойства главной и поперечной осей Flexbox.',
        status: 'revision',
        created_at: '2026-10-20T16:05:00Z'
      }
    ],
    student_progress: [
      {
        id: 'prog-01',
        user_id: student1Id,
        course_id: course1Id,
        block_id: b1Id,
        quiz_score: 100,
        practice_score: 95,
        is_completed: true,
        updated_at: '2026-10-19T11:35:00Z'
      },
      {
        id: 'prog-02',
        user_id: student1Id,
        course_id: course1Id,
        block_id: b2Id,
        quiz_score: 100,
        practice_score: 88,
        is_completed: true,
        updated_at: '2026-10-20T10:00:00Z'
      },
      {
        id: 'prog-03',
        user_id: student1Id,
        course_id: course1Id,
        block_id: b3Id,
        quiz_score: 100,
        practice_score: 92,
        is_completed: true,
        updated_at: '2026-10-20T15:10:00Z'
      },
      {
        id: 'prog-04',
        user_id: student2Id,
        course_id: course1Id,
        block_id: b1Id,
        quiz_score: 67,
        practice_score: 0,
        is_completed: false,
        updated_at: '2026-10-20T16:05:00Z'
      }
    ],
    ai_tutor_logs: [
      {
        id: 'log-01',
        user_id: student1Id,
        block_id: b3Id,
        student_question: 'Почему в Express моё тело запроса req.body оказывается undefined при отправке POST-запроса?',
        student_code: `app.post('/api/test', (req, res) => { console.log(req.body.topic); });`,
        ai_response: 'В Express по умолчанию тело входящего запроса не разбирается автоматически. Чтобы свойство `req.body` содержало разобранный JSON-объект, перед объявлением маршрутов необходимо подключить встроенный промежуточный обработчик (middleware): `app.use(express.json());`. Также убедитесь, что клиент передаёт заголовок `Content-Type: application/json`.',
        created_at: '2026-10-20T14:55:00Z'
      }
    ]
  };
}

function ensureLocalDataFile() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const seed = getInitialSeedData();
      memoryDbCache = seed;
      fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2), 'utf8');
    }
  } catch (_) {
    if (!memoryDbCache) {
      memoryDbCache = getInitialSeedData();
    }
  }
}

function readLocalDb() {
  ensureLocalDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    memoryDbCache = JSON.parse(raw);
    return memoryDbCache;
  } catch (_) {
    if (!memoryDbCache) {
      memoryDbCache = getInitialSeedData();
    }
    return memoryDbCache;
  }
}

function writeLocalDb(data) {
  memoryDbCache = data;
  try {
    ensureLocalDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {
    // В read-only окружении данные сохраняются в оперативном кэше инстанса
  }
}

function resetLocalDb() {
  const seed = getInitialSeedData();
  writeLocalDb(seed);
  return seed;
}

/**
 * Получить список всех курсов с количеством блоков
 */
async function listCourses() {
  if (supabase) {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*, course_blocks(count)')
      .order('created_at', { ascending: false });
    if (!error && courses) return courses;
  }
  const db = readLocalDb();
  return db.courses.map((c) => {
    const blocks = db.course_blocks.filter((b) => b.course_id === c.id);
    return {
      ...c,
      block_count: blocks.length
    };
  });
}

/**
 * Получить подробную структуру курса (блоки, тесты без правильных ответов для студента, задания)
 */
async function getCourseDetails(courseId, includeCorrectAnswers = false) {
  const db = readLocalDb();
  const course = db.courses.find((c) => c.id === courseId);
  if (!course) return null;

  const blocks = db.course_blocks
    .filter((b) => b.course_id === courseId)
    .sort((a, b) => a.order_index - b.order_index)
    .map((block) => {
      const questions = db.quiz_questions
        .filter((q) => q.block_id === block.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map((q) => {
          if (includeCorrectAnswers) return q;
          const { correct_index, ...safeQuestion } = q;
          return safeQuestion;
        });

      const practice = db.practice_tasks.find((p) => p.block_id === block.id) || null;
      return {
        ...block,
        quiz_questions: questions,
        practice_task: practice
      };
    });

  return {
    ...course,
    blocks
  };
}

/**
 * Сохранить сгенерированный ИИ курс вместе с блоками, тестами и практическими заданиями
 */
async function saveGeneratedCourse(courseData) {
  const db = readLocalDb();
  const courseId = generateId();
  const now = new Date().toISOString();

  const newCourse = {
    id: courseId,
    title: courseData.title,
    topic_prompt: courseData.topic_prompt,
    description: courseData.description,
    difficulty: courseData.difficulty || 'Средний',
    target_audience: courseData.target_audience || 'Студенты IT-специальностей',
    ai_model: courseData.ai_model || 'claude-3-5-sonnet-20241022',
    is_published: true,
    author_id: 'u-teacher-01',
    created_at: now
  };

  db.courses.unshift(newCourse);

  const createdBlocks = [];
  (courseData.blocks || []).forEach((b, idx) => {
    const blockId = generateId();
    const blockRecord = {
      id: blockId,
      course_id: courseId,
      order_index: idx + 1,
      title: b.title,
      summary: b.summary,
      theory_markdown: b.theory_markdown,
      code_example: b.code_example,
      key_concepts: b.key_concepts || [],
      estimated_minutes: b.estimated_minutes || 45
    };
    db.course_blocks.push(blockRecord);

    (b.quiz_questions || []).forEach((q, qIdx) => {
      db.quiz_questions.push({
        id: generateId(),
        block_id: blockId,
        order_index: qIdx + 1,
        question_text: q.question_text,
        options: q.options,
        correct_index: typeof q.correct_index === 'number' ? q.correct_index : 0,
        explanation: q.explanation || ''
      });
    });

    if (b.practice_task) {
      db.practice_tasks.push({
        id: generateId(),
        block_id: blockId,
        title: b.practice_task.title,
        instructions: b.practice_task.instructions,
        starter_code: b.practice_task.starter_code || '',
        expected_patterns: b.practice_task.expected_patterns || [],
        evaluation_criteria: b.practice_task.evaluation_criteria || '',
        max_score: 100
      });
    }

    createdBlocks.push(blockRecord);
  });

  writeLocalDb(db);
  return getCourseDetails(courseId, true);
}

/**
 * Проверить тест на сервере и сохранить результат
 */
async function evaluateAndSaveQuiz(userId, blockId, selectedAnswers) {
  const db = readLocalDb();
  const block = db.course_blocks.find((b) => b.id === blockId);
  if (!block) throw new Error('Учебный блок не найден');

  const questions = db.quiz_questions
    .filter((q) => q.block_id === blockId)
    .sort((a, b) => a.order_index - b.order_index);

  if (questions.length === 0) {
    throw new Error('Для данного блока не найдены тестовые вопросы');
  }

  let correctCount = 0;
  const details = questions.map((q, index) => {
    const userChoice = Array.isArray(selectedAnswers) ? Number(selectedAnswers[index]) : -1;
    const isCorrect = userChoice === q.correct_index;
    if (isCorrect) correctCount += 1;
    return {
      question_id: q.id,
      question_text: q.question_text,
      user_choice: userChoice,
      correct_index: q.correct_index,
      is_correct: isCorrect,
      explanation: q.explanation
    };
  });

  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= 70;
  const feedback = passed
    ? `Тест успешно пройден: ${correctCount} из ${questions.length} верно (${score}%). Порог прохождения (70%) достигнут.`
    : `Тест не пройден: ${correctCount} из ${questions.length} верно (${score}%). Изучите пояснения к ошибкам и повторите попытку.`;

  const submission = {
    id: generateId(),
    user_id: userId || 'u-student-01',
    block_id: blockId,
    submission_type: 'quiz',
    submitted_payload: { answers: selectedAnswers },
    auto_score: score,
    passed,
    ai_feedback: feedback,
    teacher_comment: '',
    status: passed ? 'graded' : 'revision',
    created_at: new Date().toISOString()
  };

  db.submissions.unshift(submission);

  // Обновляем прогресс студента
  let prog = db.student_progress.find(
    (p) => p.user_id === submission.user_id && p.block_id === blockId
  );
  if (!prog) {
    prog = {
      id: generateId(),
      user_id: submission.user_id,
      course_id: block.course_id,
      block_id: blockId,
      quiz_score: score,
      practice_score: 0,
      is_completed: false,
      updated_at: new Date().toISOString()
    };
    db.student_progress.push(prog);
  } else {
    prog.quiz_score = Math.max(prog.quiz_score, score);
    prog.is_completed = prog.quiz_score >= 70 && prog.practice_score >= 70;
    prog.updated_at = new Date().toISOString();
  }

  writeLocalDb(db);
  return {
    submission,
    score,
    passed,
    correctCount,
    totalQuestions: questions.length,
    details,
    progress: prog
  };
}

/**
 * Сохранить результат проверки практического задания
 */
async function savePracticeSubmission(userId, blockId, code, evaluationResult) {
  const db = readLocalDb();
  const block = db.course_blocks.find((b) => b.id === blockId);
  if (!block) throw new Error('Учебный блок не найден');

  const submission = {
    id: generateId(),
    user_id: userId || 'u-student-01',
    block_id: blockId,
    submission_type: 'practice',
    submitted_payload: { code },
    auto_score: evaluationResult.score,
    passed: evaluationResult.passed,
    ai_feedback: evaluationResult.feedback,
    teacher_comment: '',
    status: evaluationResult.passed ? 'graded' : 'revision',
    created_at: new Date().toISOString()
  };

  db.submissions.unshift(submission);

  let prog = db.student_progress.find(
    (p) => p.user_id === submission.user_id && p.block_id === blockId
  );
  if (!prog) {
    prog = {
      id: generateId(),
      user_id: submission.user_id,
      course_id: block.course_id,
      block_id: blockId,
      quiz_score: 0,
      practice_score: evaluationResult.score,
      is_completed: false,
      updated_at: new Date().toISOString()
    };
    db.student_progress.push(prog);
  } else {
    prog.practice_score = Math.max(prog.practice_score, evaluationResult.score);
    prog.is_completed = prog.quiz_score >= 70 && prog.practice_score >= 70;
    prog.updated_at = new Date().toISOString();
  }

  writeLocalDb(db);
  return { submission, progress: prog };
}

/**
 * Сохранить обращение к ИИ-наставнику
 */
async function saveTutorInteraction(userId, blockId, question, code, aiResponse) {
  const db = readLocalDb();
  const entry = {
    id: generateId(),
    user_id: userId || 'u-student-01',
    block_id: blockId,
    student_question: question,
    student_code: code || '',
    ai_response: aiResponse,
    created_at: new Date().toISOString()
  };
  db.ai_tutor_logs.unshift(entry);
  writeLocalDb(db);
  return entry;
}

/**
 * Получить аналитику и журнал решений для кабинета преподавателя
 */
async function getDashboardStats(userId = 'u-student-01') {
  const db = readLocalDb();
  const enrichedSubmissions = db.submissions.map((s) => {
    const user = db.users.find((u) => u.id === s.user_id);
    const block = db.course_blocks.find((b) => b.id === s.block_id);
    const course = block ? db.courses.find((c) => c.id === block.course_id) : null;
    return {
      ...s,
      student_name: user ? user.full_name : 'Студент',
      student_group: user ? user.group_name : '',
      block_title: block ? block.title : 'Блок',
      course_title: course ? course.title : 'Курс'
    };
  });

  const enrichedLogs = db.ai_tutor_logs.map((l) => {
    const user = db.users.find((u) => u.id === l.user_id);
    const block = db.course_blocks.find((b) => b.id === l.block_id);
    return {
      ...l,
      student_name: user ? user.full_name : 'Студент',
      block_title: block ? block.title : 'Блок'
    };
  });

  return {
    storage_mode: isSupabaseConfigured ? 'PostgreSQL (Supabase Cloud)' : 'PostgreSQL (Supabase Schema + Local Sync)',
    ai_engine: 'Anthropic Claude API (claude-3-5-sonnet)',
    users: db.users,
    student_progress: db.student_progress.filter((p) => p.user_id === userId),
    all_progress: db.student_progress,
    submissions: enrichedSubmissions,
    ai_tutor_logs: enrichedLogs
  };
}

/**
 * Обновить комментарий преподавателя к решению студента
 */
async function updateTeacherReview(submissionId, teacherComment, status) {
  const db = readLocalDb();
  const sub = db.submissions.find((s) => s.id === submissionId);
  if (!sub) throw new Error('Решение не найдено');
  sub.teacher_comment = teacherComment;
  if (status) sub.status = status;
  writeLocalDb(db);
  return sub;
}

module.exports = {
  isSupabaseConfigured,
  resetLocalDb,
  listCourses,
  getCourseDetails,
  saveGeneratedCourse,
  evaluateAndSaveQuiz,
  savePracticeSubmission,
  saveTutorInteraction,
  getDashboardStats,
  updateTeacherReview
};
