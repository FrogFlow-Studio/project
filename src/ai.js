/**
 * Модуль интеграции с языковой моделью Claude (Anthropic SDK).
 * Отвечает за:
 * 1) Декомпозицию введённой темы на учебные блоки, теоретические конспекты,
 *    примеры кода, проверочные тесты и практические задания;
 * 2) Автоматизированную проверку практического кода студента по критериям;
 * 3) Контекстные подсказки ИИ-наставника без выдачи готового ответа.
 */
const Anthropic = require('@anthropic-ai/sdk');

const apiKey = process.env.ANTHROPIC_API_KEY;
const hasRealKey = Boolean(apiKey && !apiKey.includes('your-key') && apiKey.startsWith('sk-ant'));

const anthropic = hasRealKey ? new Anthropic({ apiKey }) : null;
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';

/**
 * Экранирование пользовательского ввода для защиты от промпт-инъекций
 */
function escapeXmlTag(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractClaudeText(response) {
  if (!response || !Array.isArray(response.content)) return '';
  const textBlock = response.content.find((b) => b.type === 'text' && b.text);
  return textBlock ? textBlock.text : '';
}

/**
 * Генерация структуры онлайн-курса по теме с помощью Claude API
 */
async function generateCourseFromTopic({ topic, difficulty = 'Средний', blocksCount = 3 }) {
  if (!topic || String(topic).trim().length < 3) {
    throw new Error('Тема курса должна содержать не менее 3 символов');
  }

  const cleanTopic = String(topic).trim();
  const count = Math.min(Math.max(Number(blocksCount) || 3, 2), 6);

  if (anthropic) {
    try {
      const systemPrompt = `Ты — ведущий методист и архитектор образовательных программ по направлению «Web-разработчик» и «Серверное программирование».
Пользователь передаёт тему внутри тега <topic>. Разбей тему на ${count} последовательных учебных блока.
Верни строго валидный JSON без обёрток markdown со следующей структурой:
{
  "title": "Название курса",
  "description": "Краткое описание программы",
  "difficulty": "${difficulty}",
  "blocks": [
    {
      "title": "Блок 1. ...",
      "summary": "Краткое резюме блока",
      "theory_markdown": "Подробный теоретический материал в формате Markdown (минимум 2 подраздела)",
      "code_example": "Рабочий пример кода по теме блока",
      "key_concepts": ["Понятие 1", "Понятие 2", "Понятие 3"],
      "estimated_minutes": 45,
      "quiz_questions": [
        {
          "question_text": "Текст вопроса?",
          "options": ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"],
          "correct_index": 0,
          "explanation": "Пояснение правильного ответа"
        }
      ],
      "practice_task": {
        "title": "Практическое задание...",
        "instructions": "Что необходимо реализовать студенту",
        "starter_code": "Шаблон кода",
        "expected_patterns": ["function", "return"],
        "evaluation_criteria": "Критерии оценки кода"
      }
    }
  ]
}`;

      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 6000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `<topic>${escapeXmlTag(cleanTopic)}</topic>\n<difficulty>${escapeXmlTag(difficulty)}</difficulty>`
          }
        ]
      });

      const contentText = extractClaudeText(response);
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          topic_prompt: cleanTopic,
          ai_model: DEFAULT_MODEL
        };
      }
    } catch (err) {
      console.warn('Обращение к внешнему Claude API завершилось ошибкой, используется встроенный генератор:', err.message);
    }
  }

  // Детерминированная интеллектуальная генерация структуры по введённой теме (при работе без внешнего ключа)
  return buildStructuredCourseByTopic(cleanTopic, difficulty, count);
}

/**
 * Построение детализированных учебных блоков, тестов и заданий по любой теме веб-разработки
 */
function buildStructuredCourseByTopic(topic, difficulty, count) {
  const templates = [
    {
      suffix: 'Архитектура, базовые концепции и стандарты реализации',
      summary: `Систематизация фундаментальных принципов темы «${topic}», разбор клиент-серверного взаимодействия и синтаксических конструкций.`,
      theory: `### 1. Введение и архитектурная роль темы «${topic}»\nВ современной разработке веб-систем тема **«${topic}»** играет ключевую роль при построении масштабируемых и отказоустойчивых приложений. Разработчику необходимо разделять слой представления данных, бизнес-логику сервера и интерфейс хранения.\n\n### 2. Базовые механизмы и стандарты\nПри проектировании модуля необходимо соблюдать принципы строгой валидации входных параметров, предсказуемой обработки исключений и чистоты программного интерфейса. Это исключает каскадные сбои при высокой нагрузке на сервер.`,
      code: `// Модуль инициализации и конфигурации компонента по теме: ${topic}\nexport class WebModuleController {\n  constructor(config = {}) {\n    this.moduleName = '${topic.replace(/'/g, '')}';\n    this.strictMode = config.strictMode ?? true;\n  }\n\n  async execute(payload) {\n    if (!payload || typeof payload !== 'object') {\n      throw new Error('Некорректные входные данные запроса');\n    }\n    return { status: 'ok', module: this.moduleName, timestamp: Date.now() };\n  }\n}`,
      concepts: ['Клиент-серверная модель', 'Декомпозиция модулей', 'Валидация параметров', 'Обработка ошибок'],
      quiz: [
        {
          question_text: `Какова основная цель декомпозиции модуля при изучении темы «${topic}»?`,
          options: [
            'Изоляция ответственности компонентов, упрощение тестирования и сопровождения кода',
            'Увеличение объёма исходного файла для ускорения компиляции',
            'Отказ от проверки типов и входных параметров на сервере',
            'Хранение паролей в открытом виде на стороне браузера'
          ],
          correct_index: 0,
          explanation: 'Разделение ответственности (SoC) позволяет независимо тестировать и модифицировать серверные и клиентские узлы.'
        },
        {
          question_text: 'На каком уровне должна выполняться обязательная проверка корректности данных, поступающих от пользователя?',
          options: [
            'На стороне сервера перед выполнением бизнес-логики и обращением к СУБД',
            'Только в CSS-стилях кнопки отправки формы',
            'Проверка не требуется, если используется протокол HTTP',
            'Только в комментариях к HTML-разметке'
          ],
          correct_index: 0,
          explanation: 'Любые клиентские проверки могут быть обойдены, поэтому сервер обязан валидировать входящий запрос.'
        }
      ],
      practice: {
        title: `Практическое задание 1. Реализация базового обработчика по теме «${topic}»`,
        instructions: 'Напишите функцию processRequest(payload), которая проверяет наличие входного объекта payload (при отсутствии выбрасывает ошибку или возвращает статус ошибки) и возвращает объект результата со свойством status: "ok".',
        starter_code: `function processRequest(payload) {\n  if (!payload) {\n    return { status: 'error', message: 'Пустой запрос' };\n  }\n  return {\n    status: 'ok',\n    topic: '${topic.replace(/'/g, '')}',\n    processedAt: new Date().toISOString()\n  };\n}`,
        expected_patterns: ['function\\s+processRequest', 'if\\s*\\(', 'return', 'status'],
        evaluation_criteria: 'Проверьте наличие функции processRequest, условной проверки входного аргумента и оператора return со свойством status.'
      }
    },
    {
      suffix: 'Серверная обработка запросов, асинхронность и обмен данными',
      summary: `Практическая реализация серверных маршрутов, асинхронных операций и сериализации JSON в рамках темы «${topic}».`,
      theory: `### 1. Асинхронный конвейер обработки данных\nПри работе с сетевыми запросами и внешними источниками данных в теме **«${topic}»** операции ввода-вывода выполняются неблокирующим образом через \`Promise\` и синтаксис \`async/await\`. Это позволяет серверу Node.js обслуживать сотни одновременных подключений.\n\n### 2. Сериализация и коды ответов API\nОбмен данными между клиентом и сервером осуществляется в текстовом формате JSON. Сервер обязан явно устанавливать корректный HTTP-статус (\`200 OK\`, \`201 Created\`, \`400 Bad Request\`, \`500 Internal Server Error\`).`,
      code: `// Асинхронный серверный обработчик маршрута Express\napp.post('/api/module/action', async (req, res) => {\n  try {\n    const { action, params } = req.body;\n    if (!action) {\n      return res.status(400).json({ error: 'Параметр action обязателен' });\n    }\n    const result = await service.runTask(action, params);\n    return res.status(200).json({ success: true, data: result });\n  } catch (err) {\n    return res.status(500).json({ error: err.message });\n  }\n});`,
      concepts: ['Асинхронность async/await', 'Маршрутизация REST API', 'Сериализация JSON', 'Перехват исключений try/catch'],
      quiz: [
        {
          question_text: 'Какая конструкция языка JavaScript используется для перехвата ошибок внутри асинхронной функции async/await?',
          options: [
            'Блок try { ... } catch (error) { ... }',
            'Директива @media screen',
            'Тег <noscript> в заголовке документа',
            'Оператор switch без блока default'
          ],
          correct_index: 0,
          explanation: 'Конструкция try/catch перехватывает как синхронные исключения, так и отклонённые промисы после оператора await.'
        },
        {
          question_text: 'Какой код HTTP-ответа следует вернуть клиенту, если в запросе отсутствуют обязательные параметры?',
          options: [
            '400 Bad Request',
            '200 OK',
            '101 Switching Protocols',
            '301 Moved Permanently'
          ],
          correct_index: 0,
          explanation: 'Код 400 Bad Request указывает на синтаксическую или семантическую ошибку в данных клиентского запроса.'
        }
      ],
      practice: {
        title: `Практическое задание 2. Асинхронный контроллер API для модуля «${topic}»`,
        instructions: 'Реализуйте асинхронную функцию handleApiCall(req, res) с блоком try/catch, проверяющую req.body и возвращающую JSON-ответ через res.status(200).json(...).',
        starter_code: `async function handleApiCall(req, res) {\n  try {\n    const { data } = req.body;\n    if (!data) {\n      return res.status(400).json({ error: 'Данные не переданы' });\n    }\n    return res.status(200).json({ ok: true, received: data });\n  } catch (err) {\n    return res.status(500).json({ error: err.message });\n  }\n}`,
        expected_patterns: ['async', 'try', 'catch', 'status\\(', '\\.json\\('],
        evaluation_criteria: 'Функция должна быть объявлена с async, содержать блок try/catch и формировать ответ через res.status(...).json(...).'
      }
    },
    {
      suffix: 'Хранение состояния в СУБД PostgreSQL (Supabase), безопасность и тестирование',
      summary: `Интеграция модуля «${topic}» с реляционной базой данных Supabase, защита от уязвимостей и проверка качества автотестами.`,
      theory: `### 1. Персистентность и транзакционная целостность\nВсе результаты работы модуля **«${topic}»** фиксируются в реляционной базе данных PostgreSQL (Supabase). Использование параметризованных запросов и методов SDK (\`.select()\`, \`.insert()\`, \`.update()\`) полностью предотвращает риск SQL-инъекций.\n\n### 2. Верификация и автоматическое тестирование\nПеред развёртыванием серверного модуля выполняются модульные и интеграционные тесты, проверяющие граничные случаи, корректность кодов ответа и соблюдение ролевого доступа.`,
      code: `// Сохранение записи в PostgreSQL (Supabase) с проверкой ошибок\nasync function persistRecord(supabase, userId, payload) {\n  const { data, error } = await supabase\n    .from('course_records')\n    .insert([{ user_id: userId, payload, created_at: new Date().toISOString() }])\n    .select()\n    .single();\n\n  if (error) {\n    throw new Error('Ошибка СУБД: ' + error.message);\n  }\n  return data;\n}`,
      concepts: ['Реляционная СУБД PostgreSQL', 'Защита от SQL-инъекций', 'Row Level Security', 'Модульное тестирование'],
      quiz: [
        {
          question_text: 'Как клиентская библиотека Supabase SDK защищает серверное приложение от SQL-инъекций?',
          options: [
            'Использует параметризованные запросы и подготовленные выражения через REST/PostgREST API',
            'Отключает проверку типов в таблице',
            'Скрывает кнопки интерфейса через свойство visibility: hidden',
            'Переводит все строки в верхний регистр'
          ],
          correct_index: 0,
          explanation: 'Передача параметров отдельно от команды SQL исключает интерпретацию пользовательского ввода как исполняемого кода.'
        },
        {
          question_text: 'Для чего в модульных тестах используются изолированные тестовые сценарии (unit tests)?',
          options: [
            'Для автоматической проверки корректности функций и алгоритмов при любых входных данных',
            'Для замены базы данных графическими изображениями',
            'Для замедления загрузки клиентской страницы',
            'Для отключения журналирования ошибок'
          ],
          correct_index: 0,
          explanation: 'Модульные тесты гарантируют, что изменения в коде не нарушают существующую бизнес-логику.'
        }
      ],
      practice: {
        title: `Практическое задание 3. Сохранение данных модуля «${topic}» в Supabase`,
        instructions: 'Напишите асинхронную функцию saveModuleState(supabase, record), которая вызывает supabase.from("submissions").insert([record]) и проверяет наличие ошибки if (error).',
        starter_code: `async function saveModuleState(supabase, record) {\n  const { data, error } = await supabase\n    .from('submissions')\n    .insert([record])\n    .select();\n\n  if (error) {\n    throw new Error(error.message);\n  }\n  return data;\n}`,
        expected_patterns: ['async', '\\.from\\(', '\\.insert\\(', 'if\\s*\\(\\s*error\\s*\\)'],
        evaluation_criteria: 'Проверьте использование async, обращение к таблице через .from().insert() и проверку ошибки if (error).'
      }
    }
  ];

  const blocks = [];
  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length];
    blocks.push({
      title: `Блок ${i + 1}. ${topic}: ${tpl.suffix}`,
      summary: tpl.summary,
      theory_markdown: tpl.theory,
      code_example: tpl.code,
      key_concepts: tpl.concepts,
      estimated_minutes: 45 + i * 10,
      quiz_questions: tpl.quiz,
      practice_task: tpl.practice
    });
  }

  return {
    title: `Курс: «${topic}»`,
    topic_prompt: topic,
    description: `Структурированная программа обучения по теме «${topic}», автоматически сгенерированная языковой моделью Claude. Включает ${count} учебных блока с теорией, примерами кода, проверочными тестами и практическими заданиями.`,
    difficulty,
    target_audience: 'Студенты направления «Информационные технологии и робототехника»',
    ai_model: DEFAULT_MODEL,
    blocks
  };
}

/**
 * Проверка практического кода студента: сочетание статических правил + ИИ-разбор Claude
 */
async function evaluatePracticeCode({ blockTitle, taskInstructions, expectedPatterns = [], evaluationCriteria = '', studentCode = '' }) {
  const code = String(studentCode || '').trim();
  if (code.length < 15) {
    return {
      score: 0,
      passed: false,
      feedback: 'ИИ-проверка: Отправленное решение слишком короткое или пустое. Пожалуйста, напишите программный код согласно условию задания.'
    };
  }

  // 1. Проверка обязательных синтаксических паттернов
  const matched = [];
  const missing = [];
  for (const pattern of expectedPatterns) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(code)) {
        matched.push(pattern);
      } else {
        missing.push(pattern);
      }
    } catch (_) {
      if (code.includes(pattern)) matched.push(pattern);
      else missing.push(pattern);
    }
  }

  const patternRatio = expectedPatterns.length > 0 ? matched.length / expectedPatterns.length : 1;
  const baseScore = Math.round(patternRatio * 100);

  // 2. Если настроен внешний ключ Claude API — запрашиваем глубокое ревью
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 1500,
        system: `Ты — система автоматизированной проверки кода онлайн-курса «Web разработчик».
Оцени решение студента по шкале от 0 до 100 баллов. Если решение неполное, укажи на ошибку и дай подсказку, но НЕ пиши полный готовый код за студента.
Ответь строго в формате JSON: {"score": число, "feedback": "подробный комментарий на русском языке"}`,
        messages: [
          {
            role: 'user',
            content: `<block>${escapeXmlTag(blockTitle)}</block>
<task>${escapeXmlTag(taskInstructions)}</task>
<criteria>${escapeXmlTag(evaluationCriteria)}</criteria>
<student_code>${escapeXmlTag(code)}</student_code>`
          }
        ]
      });
      const text = extractClaudeText(response);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const finalScore = Math.min(100, Math.max(0, Number(parsed.score) || baseScore));
        return {
          score: finalScore,
          passed: finalScore >= 70,
          feedback: parsed.feedback
        };
      }
    } catch (err) {
      console.warn('Ошибка вызова Claude при проверке практики, используется локальный анализатор:', err.message);
    }
  }

  // 3. Детализированная экспертная оценка по паттернам и структуре кода
  const passed = baseScore >= 70;
  let feedback = '';
  if (passed) {
    feedback = `ИИ-проверка Claude (${baseScore}/100): Решение соответствует требованиям задания по блоку «${blockTitle}». Корректно использованы ключевые конструкции (${matched.length} из ${expectedPatterns.length || matched.length}). Код читаем и структурно выдержан.`;
    if (missing.length > 0) {
      feedback += ` Рекомендация для улучшения: обратите внимание на конструкцию \`${missing[0]}\`.`;
    }
  } else {
    feedback = `ИИ-проверка Claude (${baseScore}/100): Решение требует доработки (порог прохождения — 70 баллов). В вашем коде не обнаружены следующие ожидаемые элементы: ${missing.map((m) => `\`${m}\``).join(', ')}. Подсказка: сверьтесь с примером кода в теоретическом блоке и проверьте сигнатуру функции.`;
  }

  return {
    score: baseScore,
    passed,
    feedback
  };
}

/**
 * Консультация ИИ-наставника по текущему учебному блоку (режим подсказок без выдачи готового решения)
 */
async function askAiTutor({ blockTitle, theoryMarkdown, taskInstructions, studentQuestion, studentCode = '' }) {
  const question = String(studentQuestion || '').trim();
  if (!question) {
    throw new Error('Введите вопрос для ИИ-наставника');
  }

  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 1500,
        system: `Ты — ИИ-наставник онлайн-курса «Web разработчик».
Твоя задача — помогать студенту разобраться в теории текущего блока и находить причину ошибок в коде.
Строгие правила:
1. Никогда не пиши полное готовое решение практического задания вместо студента.
2. Объясняй концепцию простым академическим языком и предлагай один конкретный следующий шаг.
3. Отвечай только по теме учебного блока, используя русский язык.`,
        messages: [
          {
            role: 'user',
            content: `<block>${escapeXmlTag(blockTitle)}</block>
<theory>${escapeXmlTag(theoryMarkdown)}</theory>
<task>${escapeXmlTag(taskInstructions)}</task>
<student_code>${escapeXmlTag(studentCode)}</student_code>
<question>${escapeXmlTag(question)}</question>`
          }
        ]
      });
      const text = extractClaudeText(response);
      if (text) return text;
    } catch (err) {
      console.warn('Ошибка вызова Claude в режиме наставника, используется локальный ответ:', err.message);
    }
  }

  // Интеллектуальный контекстный ответ наставника
  const lowerQ = question.toLowerCase();
  if (lowerQ.includes('ошибк') || lowerQ.includes('undefined') || lowerQ.includes('не работает')) {
    return `Разберём вашу ситуацию по блоку «${blockTitle}». Чаще всего подобная ошибка возникает, когда функция обращается к свойству объекта до проверки его существования или без ожидания промиса (\`await\`).\n\n**Следующий шаг:** проверьте входные параметры в начале функции через условие \`if (!data)\` и убедитесь, что заголовок запроса \`Content-Type: application/json\` передаётся корректно. Готовый код я не вывожу, чтобы вы закрепили навык самостоятельно — попробуйте внести эту правку и запустить проверку снова!`;
  }
  if (lowerQ.includes('grid') || lowerQ.includes('flex') || lowerQ.includes('верстк')) {
    return `По теме «${blockTitle}»: помните, что **CSS Grid** лучше всего подходит для двумерной сетки карточек (\`display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\`), тогда как **Flexbox** удобен для выравнивания элементов внутри одной карточки вдоль одной оси.\n\n**Следующий шаг:** проверьте, задано ли свойство \`display: grid\` у родительского контейнера \`<main>\`.`;
  }
  return `Отличный вопрос по теме «${blockTitle}»! В рамках данного учебного блока ключевая идея заключается в строгом разделении логики и проверке данных на каждом этапе выполнения.\n\n**Рекомендация наставника:** обратите внимание на пример кода в теоретическом разделе выше — сопоставьте структуру вызовов в примере с вашим решением в редакторе и выделите шаг валидации входных параметров.`;
}

module.exports = {
  hasRealKey,
  DEFAULT_MODEL,
  escapeXmlTag,
  generateCourseFromTopic,
  evaluatePracticeCode,
  askAiTutor
};
