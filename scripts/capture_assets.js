/**
 * Скрипт генерации архитектурных схем, ER-диаграммы, алгоритма декомпозиции
 * и создания реальных скриншотов работающего веб-приложения для курсовой работы.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const app = require('../src/server');
const db = require('../src/db');

const ASSETS_DIR = path.join(__dirname, '..', 'docs_assets');

const svgArchitecture = `
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="480" viewBox="0 0 980 480" style="font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
    </marker>
  </defs>

  <rect x="10" y="10" width="960" height="460" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="490" y="42" text-anchor="middle" font-size="17" font-weight="700" fill="#0f172a">Клиент-серверная архитектура платформы онлайн-курса «Web разработчик» с ИИ</text>

  <!-- Клиентский уровень -->
  <rect x="60" y="68" width="380" height="76" rx="10" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
  <text x="250" y="96" text-anchor="middle" font-size="15" font-weight="700" fill="#1e3a8a">Клиентское приложение Студента (Браузер)</text>
  <text x="250" y="120" text-anchor="middle" font-size="12.5" fill="#475569">Изучение блоков, тесты, редактор кода, чат с ИИ-наставником</text>

  <rect x="540" y="68" width="380" height="76" rx="10" fill="#ffffff" stroke="#0d9488" stroke-width="2"/>
  <text x="730" y="96" text-anchor="middle" font-size="15" font-weight="700" fill="#115e59">Кабинет Преподавателя (Браузер)</text>
  <text x="730" y="120" text-anchor="middle" font-size="12.5" fill="#475569">Ввод темы курса для ИИ-разбора, контроль прогресса и решений</text>

  <!-- Стрелки к серверу -->
  <line x1="250" y1="144" x2="250" y2="188" stroke="#475569" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)"/>
  <line x1="730" y1="144" x2="730" y2="188" stroke="#475569" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)"/>

  <!-- Серверный уровень -->
  <rect x="60" y="190" width="860" height="145" rx="12" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2"/>
  <text x="490" y="216" text-anchor="middle" font-size="15.5" font-weight="700" fill="#1e3a8a">Сервер приложения Node.js + Express (REST API и бизнес-логика)</text>

  <!-- 3 внутренних модуля сервера -->
  <rect x="82" y="232" width="258" height="86" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="211" y="256" text-anchor="middle" font-size="13.5" font-weight="700" fill="#0f172a">1. ИИ-декомпозиция темы</text>
  <text x="211" y="277" text-anchor="middle" font-size="12" fill="#475569">Разбивка темы на учебные блоки,</text>
  <text x="211" y="295" text-anchor="middle" font-size="12" fill="#475569">генерация теории, тестов и задач</text>

  <rect x="361" y="232" width="258" height="86" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="490" y="256" text-anchor="middle" font-size="13.5" font-weight="700" fill="#0f172a">2. Модуль проверки решений</text>
  <text x="490" y="277" text-anchor="middle" font-size="12" fill="#475569">Серверная оценка тестов (70%)</text>
  <text x="490" y="295" text-anchor="middle" font-size="12" fill="#475569">и статический + ИИ-анализ кода</text>

  <rect x="640" y="232" width="258" height="86" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="769" y="256" text-anchor="middle" font-size="13.5" font-weight="700" fill="#0f172a">3. ИИ-наставник и доступ</text>
  <text x="769" y="277" text-anchor="middle" font-size="12" fill="#475569">Формирование подсказок без</text>
  <text x="769" y="295" text-anchor="middle" font-size="12" fill="#475569">готового ответа, учёт прогресса</text>

  <!-- Стрелки к БД и ИИ -->
  <line x1="280" y1="335" x2="280" y2="378" stroke="#475569" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)"/>
  <line x1="700" y1="335" x2="700" y2="378" stroke="#475569" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)"/>

  <!-- Уровень данных и внешних сервисов -->
  <rect x="60" y="380" width="430" height="72" rx="10" fill="#f0fdf4" stroke="#15803d" stroke-width="2"/>
  <text x="275" y="408" text-anchor="middle" font-size="15" font-weight="700" fill="#14532d">СУБД PostgreSQL (Платформа Supabase)</text>
  <text x="275" y="430" text-anchor="middle" font-size="12.5" fill="#166534">Таблицы: users, courses, course_blocks, quiz_questions, submissions</text>

  <rect x="530" y="380" width="390" height="72" rx="10" fill="#fffbeb" stroke="#b45309" stroke-width="2"/>
  <text x="725" y="408" text-anchor="middle" font-size="15" font-weight="700" fill="#78350f">Языковая модель Claude API (Anthropic SDK)</text>
  <text x="725" y="430" text-anchor="middle" font-size="12.5" fill="#92400e">Генерация JSON-структуры блоков, ревью кода и подсказки</text>
</svg>
`;

const svgErDiagram = `
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="540" viewBox="0 0 980 540" style="font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff;">
  <rect x="10" y="10" width="960" height="520" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="490" y="38" text-anchor="middle" font-size="17" font-weight="700" fill="#0f172a">Схема реляционной базы данных платформы в PostgreSQL (Supabase)</text>

  <!-- Таблица users -->
  <rect x="35" y="60" width="250" height="145" rx="8" fill="#ffffff" stroke="#1d4ed8" stroke-width="2"/>
  <rect x="35" y="60" width="250" height="32" rx="8" fill="#1d4ed8"/>
  <text x="160" y="81" text-anchor="middle" font-size="13.5" font-weight="700" fill="#ffffff">users (Пользователи)</text>
  <text x="48" y="110" font-size="12" fill="#0f172a">PK  id : UUID</text>
  <text x="48" y="130" font-size="12" fill="#334155">    full_name : VARCHAR(150)</text>
  <text x="48" y="150" font-size="12" fill="#334155">    email : VARCHAR(150)</text>
  <text x="48" y="170" font-size="12" fill="#334155">    role : VARCHAR ('student'|'teacher')</text>
  <text x="48" y="190" font-size="12" fill="#334155">    group_name : VARCHAR(50)</text>

  <!-- Таблица courses -->
  <rect x="365" y="60" width="260" height="145" rx="8" fill="#ffffff" stroke="#1d4ed8" stroke-width="2"/>
  <rect x="365" y="60" width="260" height="32" rx="8" fill="#1d4ed8"/>
  <text x="495" y="81" text-anchor="middle" font-size="13.5" font-weight="700" fill="#ffffff">courses (Онлайн-курсы)</text>
  <text x="378" y="110" font-size="12" fill="#0f172a">PK  id : UUID</text>
  <text x="378" y="130" font-size="12" fill="#334155">    title : VARCHAR(250)</text>
  <text x="378" y="150" font-size="12" fill="#334155">    topic_prompt : TEXT</text>
  <text x="378" y="170" font-size="12" fill="#334155">    difficulty : VARCHAR(30)</text>
  <text x="378" y="190" font-size="12" fill="#334155">FK  author_id : UUID → users.id</text>

  <!-- Таблица course_blocks -->
  <rect x="690" y="60" width="255" height="165" rx="8" fill="#ffffff" stroke="#0d9488" stroke-width="2"/>
  <rect x="690" y="60" width="255" height="32" rx="8" fill="#0d9488"/>
  <text x="817" y="81" text-anchor="middle" font-size="13.5" font-weight="700" fill="#ffffff">course_blocks (Учебные блоки)</text>
  <text x="703" y="110" font-size="12" fill="#0f172a">PK  id : UUID</text>
  <text x="703" y="130" font-size="12" fill="#334155">FK  course_id : UUID → courses.id</text>
  <text x="703" y="150" font-size="12" fill="#334155">    order_index : INTEGER</text>
  <text x="703" y="170" font-size="12" fill="#334155">    title : VARCHAR(250)</text>
  <text x="703" y="190" font-size="12" fill="#334155">    theory_markdown : TEXT</text>
  <text x="703" y="210" font-size="12" fill="#334155">    code_example : TEXT</text>

  <!-- Таблица student_progress -->
  <rect x="35" y="260" width="250" height="145" rx="8" fill="#ffffff" stroke="#475569" stroke-width="1.8"/>
  <rect x="35" y="260" width="250" height="32" rx="8" fill="#334155"/>
  <text x="160" y="281" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">student_progress (Прогресс)</text>
  <text x="48" y="310" font-size="12" fill="#0f172a">PK  id : UUID</text>
  <text x="48" y="330" font-size="12" fill="#334155">FK  user_id : UUID → users.id</text>
  <text x="48" y="350" font-size="12" fill="#334155">FK  block_id : UUID → course_blocks.id</text>
  <text x="48" y="370" font-size="12" fill="#334155">    quiz_score, practice_score : INT</text>
  <text x="48" y="390" font-size="12" fill="#334155">    is_completed : BOOLEAN</text>

  <!-- Таблица submissions -->
  <rect x="365" y="260" width="260" height="165" rx="8" fill="#ffffff" stroke="#15803d" stroke-width="2"/>
  <rect x="365" y="260" width="260" height="32" rx="8" fill="#15803d"/>
  <text x="495" y="281" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">submissions (Решения и оценки)</text>
  <text x="378" y="310" font-size="12" fill="#0f172a">PK  id : UUID</text>
  <text x="378" y="330" font-size="12" fill="#334155">FK  user_id : UUID → users.id</text>
  <text x="378" y="350" font-size="12" fill="#334155">FK  block_id : UUID → course_blocks.id</text>
  <text x="378" y="370" font-size="12" fill="#334155">    submission_type : ('quiz'|'practice')</text>
  <text x="378" y="390" font-size="12" fill="#334155">    auto_score : INT (0..100)</text>
  <text x="378" y="410" font-size="12" fill="#334155">    ai_feedback, teacher_comment : TEXT</text>

  <!-- Таблица quiz_questions -->
  <rect x="690" y="260" width="255" height="125" rx="8" fill="#ffffff" stroke="#b45309" stroke-width="1.8"/>
  <rect x="690" y="260" width="255" height="32" rx="8" fill="#b45309"/>
  <text x="817" y="281" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">quiz_questions (Тесты блока)</text>
  <text x="703" y="310" font-size="12" fill="#0f172a">PK  id : UUID</text>
  <text x="703" y="330" font-size="12" fill="#334155">FK  block_id : UUID → course_blocks.id</text>
  <text x="703" y="350" font-size="12" fill="#334155">    question_text : TEXT, options : JSONB</text>
  <text x="703" y="370" font-size="12" fill="#334155">    correct_index : INT (только сервер)</text>

  <!-- Таблица practice_tasks -->
  <rect x="690" y="400" width="255" height="115" rx="8" fill="#ffffff" stroke="#b45309" stroke-width="1.8"/>
  <rect x="690" y="400" width="255" height="30" rx="8" fill="#b45309"/>
  <text x="817" y="420" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">practice_tasks (Практика кода)</text>
  <text x="703" y="446" font-size="12" fill="#0f172a">PK  id : UUID, FK block_id : UUID</text>
  <text x="703" y="466" font-size="12" fill="#334155">    instructions, starter_code : TEXT</text>
  <text x="703" y="486" font-size="12" fill="#334155">    expected_patterns : JSONB</text>
  <text x="703" y="504" font-size="12" fill="#334155">    evaluation_criteria : TEXT</text>

  <!-- Таблица ai_tutor_logs -->
  <rect x="35" y="425" width="590" height="90" rx="8" fill="#ffffff" stroke="#475569" stroke-width="1.8"/>
  <rect x="35" y="425" width="590" height="28" rx="8" fill="#475569"/>
  <text x="330" y="444" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">ai_tutor_logs (Журнал диалогов студента с ИИ-наставником по блоку)</text>
  <text x="48" y="472" font-size="12" fill="#0f172a">PK id : UUID   |   FK user_id → users.id   |   FK block_id → course_blocks.id</text>
  <text x="48" y="494" font-size="12" fill="#334155">student_question : TEXT   |   student_code : TEXT   |   ai_response : TEXT   |   created_at : TIMESTAMPTZ</text>

  <!-- Линии связей -->
  <line x1="285" y1="130" x2="365" y2="130" stroke="#1d4ed8" stroke-width="2"/>
  <text x="325" y="122" text-anchor="middle" font-size="11.5" font-weight="700" fill="#1d4ed8">1 : N</text>

  <line x1="625" y1="130" x2="690" y2="130" stroke="#0d9488" stroke-width="2"/>
  <text x="657" y="122" text-anchor="middle" font-size="11.5" font-weight="700" fill="#0d9488">1 : N</text>

  <line x1="160" y1="205" x2="160" y2="260" stroke="#334155" stroke-width="2"/>
  <text x="178" y="238" font-size="11.5" font-weight="700" fill="#334155">1 : N</text>

  <line x1="285" y1="180" x2="365" y2="310" stroke="#15803d" stroke-width="1.8"/>
  <line x1="690" y1="190" x2="625" y2="310" stroke="#15803d" stroke-width="1.8"/>

  <line x1="817" y1="225" x2="817" y2="260" stroke="#b45309" stroke-width="2"/>
  <text x="838" y="247" font-size="11.5" font-weight="700" fill="#b45309">1 : N</text>
</svg>
`;

const svgAlgorithm = `
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="470" viewBox="0 0 980 470" style="font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff;">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
    </marker>
  </defs>
  <rect x="10" y="10" width="960" height="450" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="490" y="40" text-anchor="middle" font-size="16.5" font-weight="700" fill="#0f172a">Алгоритм ИИ-декомпозиции темы курса, прохождения блоков и проверки решений</text>

  <!-- Левая ветка: Генерация курса -->
  <rect x="45" y="70" width="380" height="58" rx="8" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2"/>
  <text x="235" y="95" text-anchor="middle" font-size="13" font-weight="700" fill="#1e3a8a">Шаг 1. Ввод темы курса преподавателем</text>
  <text x="235" y="114" text-anchor="middle" font-size="11.5" fill="#475569">Тема, уровень сложности и число блоков (POST /api/courses/generate)</text>

  <line x1="235" y1="128" x2="235" y2="162" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>

  <rect x="45" y="164" width="380" height="68" rx="8" fill="#fffbeb" stroke="#b45309" stroke-width="2"/>
  <text x="235" y="189" text-anchor="middle" font-size="13" font-weight="700" fill="#78350f">Шаг 2. Декомпозиция темы моделью Claude API</text>
  <text x="235" y="208" text-anchor="middle" font-size="11.5" fill="#92400e">Формирование JSON: блоки → теория → примеры кода →</text>
  <text x="235" y="223" text-anchor="middle" font-size="11.5" fill="#92400e">тестовые вопросы → критерии практических заданий</text>

  <line x1="235" y1="232" x2="235" y2="266" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>

  <rect x="45" y="268" width="380" height="62" rx="8" fill="#f0fdf4" stroke="#15803d" stroke-width="2"/>
  <text x="235" y="293" text-anchor="middle" font-size="13" font-weight="700" fill="#14532d">Шаг 3. Запись структуры в БД Supabase (PostgreSQL)</text>
  <text x="235" y="313" text-anchor="middle" font-size="11.5" fill="#166534">Сохранение в courses, course_blocks, quiz_questions, practice_tasks</text>

  <line x1="235" y1="330" x2="235" y2="365" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>

  <rect x="45" y="367" width="380" height="62" rx="8" fill="#ffffff" stroke="#334155" stroke-width="2"/>
  <text x="235" y="392" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">Шаг 4. Изучение блока студентом в браузере</text>
  <text x="235" y="412" text-anchor="middle" font-size="11.5" fill="#475569">Выдача конспекта и тестов без правильных ответов (correct_index скрыт)</text>

  <!-- Переход к правой ветке -->
  <path d="M 425 398 L 480 398 L 480 98 L 535 98" fill="none" stroke="#1d4ed8" stroke-width="2" marker-end="url(#arr)"/>

  <!-- Правая ветка: Проверка и ИИ-наставник -->
  <rect x="540" y="70" width="390" height="58" rx="8" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2"/>
  <text x="735" y="95" text-anchor="middle" font-size="13" font-weight="700" fill="#1e3a8a">Шаг 5. Отправка ответов теста и кода практики</text>
  <text x="735" y="114" text-anchor="middle" font-size="11.5" fill="#475569">Серверная сверка индексов теста + анализ кода по паттернам и Claude</text>

  <line x1="735" y1="128" x2="735" y2="162" stroke="#334155" stroke-width="2" marker-end="url(#arr)"/>

  <!-- Условие: Порог >= 70% -->
  <polygon points="735,164 890,210 735,256 580,210" fill="#ffffff" stroke="#0d9488" stroke-width="2"/>
  <text x="735" y="206" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">Балл проверки ≥ 70%?</text>
  <text x="735" y="224" text-anchor="middle" font-size="11.5" fill="#475569">(тест и практика)</text>

  <!-- Нет: подсказка ИИ -->
  <line x1="735" y1="256" x2="735" y2="294" stroke="#b45309" stroke-width="2" marker-end="url(#arr)"/>
  <text x="758" y="280" font-size="12" font-weight="700" fill="#b45309">Нет (&lt; 70%)</text>

  <rect x="540" y="296" width="390" height="60" rx="8" fill="#fffbeb" stroke="#b45309" stroke-width="2"/>
  <text x="735" y="320" text-anchor="middle" font-size="13" font-weight="700" fill="#78350f">Шаг 6а. Разбор ошибки ИИ-наставником (без ответа)</text>
  <text x="735" y="340" text-anchor="middle" font-size="11.5" fill="#92400e">Подсказка следующего шага, запись в ai_tutor_logs, повторная сдача</text>

  <!-- Да: Зачёт блока -->
  <path d="M 890 210 L 945 210 L 945 398 L 932 398" fill="none" stroke="#15803d" stroke-width="2" marker-end="url(#arr)"/>
  <text x="915" y="198" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">Да (≥ 70%)</text>

  <rect x="540" y="367" width="390" height="62" rx="8" fill="#f0fdf4" stroke="#15803d" stroke-width="2"/>
  <text x="735" y="392" text-anchor="middle" font-size="13" font-weight="700" fill="#14532d">Шаг 6б. Зачёт учебного блока и обновление прогресса</text>
  <text x="735" y="412" text-anchor="middle" font-size="11.5" fill="#166534">Запись в submissions и student_progress, контроль преподавателем</text>
</svg>
`;

async function run() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  db.resetLocalDb();

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log('Временный сервер для рендеринга запущен:', baseUrl);

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge' });
  } catch (_) {
    try {
      browser = await chromium.launch({ channel: 'chrome' });
    } catch (e) {
      browser = await chromium.launch();
    }
  }
  const context = await browser.newContext({
    viewport: { width: 1360, height: 880 },
    deviceScaleFactor: 1.5
  });
  const page = await context.newPage();

  // 1. Рендерим 3 архитектурные/алгоритмические диаграммы в PNG
  const diagrams = [
    { name: 'fig1_architecture.png', svg: svgArchitecture, w: 980, h: 480 },
    { name: 'fig2_er_schema.png', svg: svgErDiagram, w: 980, h: 540 },
    { name: 'fig3_algorithm.png', svg: svgAlgorithm, w: 980, h: 470 }
  ];

  for (const d of diagrams) {
    await page.setViewportSize({ width: d.w, height: d.h });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fff;">${d.svg}</body></html>`);
    await page.screenshot({ path: path.join(ASSETS_DIR, d.name) });
    console.log('Сохранена схема:', d.name);
  }

  // 2. Делаем реальные скриншоты работающего веб-приложения
  await page.setViewportSize({ width: 1380, height: 920 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // Скриншот А: Режим студента — изучение Блока 1, прохождение теста и проверка практического кода
  await page.click('#submitQuizBtn');
  await page.waitForTimeout(300);
  await page.click('#submitPracticeBtn');
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(ASSETS_DIR, 'fig4_student_workspace.png'),
    fullPage: true
  });
  console.log('Сохранён скриншот интерфейса студента: fig4_student_workspace.png');

  // Скриншот Б: ИИ-генератор курса и блоков по теме (Режим преподавателя)
  await page.click('#roleTeacherBtn');
  await page.click('#tabGenerator');
  await page.waitForTimeout(300);
  await page.click('#generateCourseBtn');
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ASSETS_DIR, 'fig5_ai_generator.png'),
    fullPage: true
  });
  console.log('Сохранён скриншот ИИ-генератора курса: fig5_ai_generator.png');

  // Скриншот В: Кабинет преподавателя — мониторинг прогресса, решений и журнала ИИ-наставника
  await page.click('#tabMonitor');
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(ASSETS_DIR, 'fig6_teacher_dashboard.png'),
    fullPage: true
  });
  console.log('Сохранён скриншот кабинета преподавателя: fig6_teacher_dashboard.png');

  await browser.close();
  server.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
