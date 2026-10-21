/**
 * Скрипт генерации архитектурных схем, ER-диаграммы, алгоритма
 * и реальных скриншотов веб-приложения для курсовой работы.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const http = require('http');

const ASSETS_DIR = path.join(__dirname, '..', 'docs_assets');

// 1. Архитектура: Клиент-серверное взаимодействие с авторизацией, Claude API и Supabase
const svgArchitecture = `
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="490" viewBox="0 0 980 490" style="font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
    </marker>
  </defs>

  <rect x="10" y="10" width="960" height="470" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="490" y="38" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">Клиент-серверная архитектура платформы онлайн-курса «Web разработчик» с применением ИИ</text>

  <!-- Клиентский уровень -->
  <rect x="60" y="60" width="390" height="82" rx="10" fill="#ffffff" stroke="#059669" stroke-width="2"/>
  <text x="255" y="86" text-anchor="middle" font-size="14.5" font-weight="700" fill="#065f46">Рабочее место Студента (SPA в браузере)</text>
  <text x="255" y="108" text-anchor="middle" font-size="12" fill="#475569">Ввод инвайт-кода, последовательное открытие блоков,</text>
  <text x="255" y="126" text-anchor="middle" font-size="12" fill="#475569">конспекты, тесты, редактор кода и чат с ИИ-наставником</text>

  <rect x="530" y="60" width="390" height="82" rx="10" fill="#ffffff" stroke="#7c3aed" stroke-width="2"/>
  <text x="725" y="86" text-anchor="middle" font-size="14.5" font-weight="700" fill="#5b21b6">Кабинет Преподавателя (SPA в браузере)</text>
  <text x="725" y="108" text-anchor="middle" font-size="12" fill="#475569">2-этапная ИИ-генерация курса по теме, инвайт-коды,</text>
  <text x="725" y="126" text-anchor="middle" font-size="12" fill="#475569">управление блоками и мониторинг успеваемости студентов</text>

  <line x1="255" y1="142" x2="255" y2="182" stroke="#334155" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)"/>
  <text x="265" y="167" font-size="11" fill="#64748b">HTTPS / JWT / JSON</text>
  <line x1="725" y1="142" x2="725" y2="182" stroke="#334155" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)"/>
  <text x="735" y="167" font-size="11" fill="#64748b">HTTPS / JWT / JSON</text>

  <!-- Серверный уровень Node.js / Express -->
  <rect x="60" y="184" width="860" height="152" rx="12" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
  <text x="490" y="210" text-anchor="middle" font-size="15" font-weight="700" fill="#1e40af">Сервер приложения Node.js + Express (Vercel Serverless / REST API)</text>

  <rect x="80" y="226" width="255" height="96" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="207" y="249" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">1. Модуль аутентификации</text>
  <text x="207" y="270" text-anchor="middle" font-size="11.5" fill="#475569">Supabase Auth (email/пароль),</text>
  <text x="207" y="288" text-anchor="middle" font-size="11.5" fill="#475569">роли student / teacher, защита</text>
  <text x="207" y="306" text-anchor="middle" font-size="11.5" fill="#475569">маршрутов requireRole</text>

  <rect x="362" y="226" width="255" height="96" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="490" y="249" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">2. Модуль Claude AI (src/ai.js)</text>
  <text x="490" y="270" text-anchor="middle" font-size="11.5" fill="#475569">Декомпозиция темы на блоки,</text>
  <text x="490" y="288" text-anchor="middle" font-size="11.5" fill="#475569">генерация конспекта, тестов, кода,</text>
  <text x="490" y="306" text-anchor="middle" font-size="11.5" fill="#475569">педагогический ИИ-наставник</text>

  <rect x="645" y="226" width="255" height="96" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="772" y="249" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">3. Бизнес-логика (src/logic.js)</text>
  <text x="772" y="270" text-anchor="middle" font-size="11.5" fill="#475569">Оценивание тестов (порог 70%),</text>
  <text x="772" y="288" text-anchor="middle" font-size="11.5" fill="#475569">контроль последовательного</text>
  <text x="772" y="306" text-anchor="middle" font-size="11.5" fill="#475569">открытия блоков курса</text>

  <line x1="260" y1="336" x2="260" y2="378" stroke="#334155" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)"/>
  <line x1="720" y1="336" x2="720" y2="378" stroke="#334155" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)"/>

  <!-- Уровень сервисов и БД -->
  <rect x="60" y="380" width="400" height="84" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
  <text x="260" y="406" text-anchor="middle" font-size="14.5" font-weight="700" fill="#14532d">Облачная СУБД Supabase (PostgreSQL 15)</text>
  <text x="260" y="428" text-anchor="middle" font-size="12" fill="#334155">9 связанных реляционных таблиц, service_role ключ,</text>
  <text x="260" y="446" text-anchor="middle" font-size="12" fill="#334155">надёжное сохранение курсов, решений и диалогов ИИ</text>

  <rect x="520" y="380" width="400" height="84" rx="10" fill="#fdf4ff" stroke="#a21caf" stroke-width="2"/>
  <text x="720" y="406" text-anchor="middle" font-size="14.5" font-weight="700" fill="#701a75">Модель ИИ Anthropic Claude (Claude API)</text>
  <text x="720" y="428" text-anchor="middle" font-size="12" fill="#334155">Структурированный Tool-use вызов, генерация тестов,</text>
  <text x="720" y="446" text-anchor="middle" font-size="12" fill="#334155">автоматическое ревью кода и контекстные подсказки</text>
</svg>
`;

// 2. ER-диаграмма: 9 таблиц Supabase PostgreSQL
const svgErDiagram = `
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="560" viewBox="0 0 980 560" style="font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff;">
  <rect x="10" y="10" width="960" height="540" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="490" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">Схема реляционной базы данных платформы в СУБД PostgreSQL (Supabase)</text>

  <!-- 1. profiles -->
  <g transform="translate(40, 56)">
    <rect width="260" height="120" rx="6" fill="#ffffff" stroke="#2563eb" stroke-width="1.8"/>
    <rect width="260" height="28" rx="6" fill="#2563eb"/>
    <text x="130" y="19" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">profiles (Профили пользователей)</text>
    <text x="12" y="46" font-size="11.5" font-weight="700" fill="#1e40af">PK id: UUID (auth.users)</text>
    <text x="12" y="66" font-size="11" fill="#334155">full_name: TEXT NOT NULL</text>
    <text x="12" y="86" font-size="11" fill="#334155">role: TEXT ('teacher' | 'student')</text>
    <text x="12" y="106" font-size="11" fill="#64748b">created_at: TIMESTAMPTZ</text>
  </g>

  <!-- 2. courses -->
  <g transform="translate(360, 56)">
    <rect width="260" height="146" rx="6" fill="#ffffff" stroke="#7c3aed" stroke-width="1.8"/>
    <rect width="260" height="28" rx="6" fill="#7c3aed"/>
    <text x="130" y="19" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">courses (Паспорта курсов)</text>
    <text x="12" y="46" font-size="11.5" font-weight="700" fill="#5b21b6">PK id: UUID</text>
    <text x="12" y="65" font-size="11" fill="#475569">FK teacher_id → profiles.id</text>
    <text x="12" y="83" font-size="11" fill="#334155">title, topic, description</text>
    <text x="12" y="101" font-size="11" fill="#334155">difficulty, status ('draft'|'published')</text>
    <text x="12" y="119" font-size="11" font-weight="700" fill="#b45309">invite_code: TEXT (6 символов)</text>
    <text x="12" y="137" font-size="11" fill="#64748b">ai_model, created_at, published_at</text>
  </g>

  <!-- 3. enrollments -->
  <g transform="translate(680, 56)">
    <rect width="260" height="110" rx="6" fill="#ffffff" stroke="#059669" stroke-width="1.8"/>
    <rect width="260" height="28" rx="6" fill="#059669"/>
    <text x="130" y="19" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">enrollments (Записи на курсы)</text>
    <text x="12" y="46" font-size="11.5" font-weight="700" fill="#065f46">PK id: UUID</text>
    <text x="12" y="66" font-size="11" fill="#475569">FK course_id → courses.id</text>
    <text x="12" y="84" font-size="11" fill="#475569">FK student_id → profiles.id</text>
    <text x="12" y="102" font-size="11" fill="#64748b">joined_at: TIMESTAMPTZ</text>
  </g>

  <!-- 4. course_blocks -->
  <g transform="translate(360, 226)">
    <rect width="260" height="152" rx="6" fill="#ffffff" stroke="#d97706" stroke-width="1.8"/>
    <rect width="260" height="28" rx="6" fill="#d97706"/>
    <text x="130" y="19" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">course_blocks (Блоки курса)</text>
    <text x="12" y="46" font-size="11.5" font-weight="700" fill="#b45309">PK id: UUID</text>
    <text x="12" y="65" font-size="11" fill="#475569">FK course_id → courses.id</text>
    <text x="12" y="83" font-size="11" fill="#334155">position: INT, title: TEXT</text>
    <text x="12" y="101" font-size="11" fill="#334155">content_status ('outline'|'generated')</text>
    <text x="12" y="119" font-size="11" fill="#334155">theory_markdown, code_example</text>
    <text x="12" y="137" font-size="11" fill="#64748b">key_concepts, estimated_minutes</text>
  </g>

  <!-- 5. quiz_questions -->
  <g transform="translate(40, 226)">
    <rect width="260" height="136" rx="6" fill="#ffffff" stroke="#dc2626" stroke-width="1.8"/>
    <rect width="260" height="28" rx="6" fill="#dc2626"/>
    <text x="130" y="19" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">quiz_questions (Тестовые вопросы)</text>
    <text x="12" y="46" font-size="11.5" font-weight="700" fill="#991b1b">PK id: UUID</text>
    <text x="12" y="65" font-size="11" fill="#475569">FK block_id → course_blocks.id</text>
    <text x="12" y="83" font-size="11" fill="#334155">position: INT, question_text: TEXT</text>
    <text x="12" y="101" font-size="11" fill="#334155">options: JSONB (варианты)</text>
    <text x="12" y="119" font-size="11" font-weight="700" fill="#dc2626">correct_index: INT (скрыт от студента)</text>
  </g>

  <!-- 6. practice_tasks -->
  <g transform="translate(680, 226)">
    <rect width="260" height="136" rx="6" fill="#ffffff" stroke="#0891b2" stroke-width="1.8"/>
    <rect width="260" height="28" rx="6" fill="#0891b2"/>
    <text x="130" y="19" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">practice_tasks (Практика)</text>
    <text x="12" y="46" font-size="11.5" font-weight="700" fill="#155e75">PK id: UUID</text>
    <text x="12" y="65" font-size="11" fill="#475569">FK block_id → course_blocks.id</text>
    <text x="12" y="83" font-size="11" fill="#334155">title, instructions: TEXT</text>
    <text x="12" y="101" font-size="11" fill="#334155">starter_code, evaluation_criteria</text>
    <text x="12" y="119" font-size="11" font-weight="700" fill="#0e7490">pass_score: INT (по умолчанию 70)</text>
  </g>

  <!-- 7. quiz_attempts -->
  <g transform="translate(40, 400)">
    <rect width="260" height="130" rx="6" fill="#ffffff" stroke="#475569" stroke-width="1.8"/>
    <rect width="260" height="28" rx="6" fill="#475569"/>
    <text x="130" y="19" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">quiz_attempts (Попытки тестов)</text>
    <text x="12" y="46" font-size="11.5" font-weight="700" fill="#1e293b">PK id: UUID</text>
    <text x="12" y="65" font-size="11" fill="#475569">FK block_id, FK student_id</text>
    <text x="12" y="83" font-size="11" fill="#334155">answers: JSONB, score: INT (0-100)</text>
    <text x="12" y="101" font-size="11" font-weight="700" fill="#059669">passed: BOOLEAN (score ≥ 70%)</text>
    <text x="12" y="119" font-size="11" fill="#64748b">created_at: TIMESTAMPTZ</text>
  </g>

  <!-- 8. practice_submissions -->
  <g transform="translate(360, 400)">
    <rect width="260" height="130" rx="6" fill="#ffffff" stroke="#475569" stroke-width="1.8"/>
    <rect width="260" height="28" rx="6" fill="#475569"/>
    <text x="130" y="19" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">practice_submissions (Решения)</text>
    <text x="12" y="46" font-size="11.5" font-weight="700" fill="#1e293b">PK id: UUID</text>
    <text x="12" y="65" font-size="11" fill="#475569">FK block_id, FK student_id</text>
    <text x="12" y="83" font-size="11" fill="#334155">code, score, passed, ai_feedback</text>
    <text x="12" y="101" font-size="11" fill="#334155">teacher_comment: TEXT</text>
    <text x="12" y="119" font-size="11" fill="#64748b">created_at: TIMESTAMPTZ</text>
  </g>

  <!-- 9. tutor_messages -->
  <g transform="translate(680, 400)">
    <rect width="260" height="130" rx="6" fill="#ffffff" stroke="#475569" stroke-width="1.8"/>
    <rect width="260" height="28" rx="6" fill="#475569"/>
    <text x="130" y="19" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">tutor_messages (Диалоги с ИИ)</text>
    <text x="12" y="46" font-size="11.5" font-weight="700" fill="#1e293b">PK id: UUID</text>
    <text x="12" y="65" font-size="11" fill="#475569">FK block_id, FK student_id</text>
    <text x="12" y="83" font-size="11" fill="#334155">question: TEXT, code: TEXT</text>
    <text x="12" y="101" font-size="11" fill="#334155">answer: TEXT (подсказка без решения)</text>
    <text x="12" y="119" font-size="11" fill="#64748b">created_at: TIMESTAMPTZ</text>
  </g>
</svg>
`;

// 3. Алгоритм: 2-этапная генерация курса преподавателем и последовательное прохождение студентом
const svgAlgorithm = `
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="480" viewBox="0 0 980 480" style="font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff;">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
    </marker>
  </defs>

  <rect x="10" y="10" width="960" height="460" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="490" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">Алгоритм 2-этапной генерации курса и последовательного прохождения блоков</text>

  <!-- Слева: Ветка преподавателя (Генерация курса) -->
  <rect x="40" y="55" width="425" height="395" rx="10" fill="#faf5ff" stroke="#a855f7" stroke-width="1.8"/>
  <text x="252" y="80" text-anchor="middle" font-size="14.5" font-weight="700" fill="#6b21a8">Ветка Преподавателя (Генерация и публикация)</text>

  <!-- Шаг 1 -->
  <rect x="65" y="95" width="375" height="48" rx="6" fill="#ffffff" stroke="#c084fc"/>
  <text x="252" y="116" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f172a">1. Ввод темы курса и параметров</text>
  <text x="252" y="133" text-anchor="middle" font-size="11" fill="#64748b">Тема, сложность, желаемое количество учебных блоков</text>

  <line x1="252" y1="143" x2="252" y2="160" stroke="#334155" stroke-width="1.5" marker-end="url(#arr)"/>

  <!-- Шаг 2 -->
  <rect x="65" y="162" width="375" height="48" rx="6" fill="#ffffff" stroke="#c084fc"/>
  <text x="252" y="183" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f172a">2. ИИ-генерация плана блоков (Этап 1)</text>
  <text x="252" y="200" text-anchor="middle" font-size="11" fill="#64748b">Claude API формирует список тем и целей блоков</text>

  <line x1="252" y1="210" x2="252" y2="227" stroke="#334155" stroke-width="1.5" marker-end="url(#arr)"/>

  <!-- Шаг 3 -->
  <rect x="65" y="229" width="375" height="48" rx="6" fill="#ffffff" stroke="#c084fc"/>
  <text x="252" y="250" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f172a">3. Рецензирование и правка плана преподавателем</text>
  <text x="252" y="267" text-anchor="middle" font-size="11" fill="#64748b">Возможность добавить/удалить/изменить названия блоков</text>

  <line x1="252" y1="277" x2="252" y2="294" stroke="#334155" stroke-width="1.5" marker-end="url(#arr)"/>

  <!-- Шаг 4 -->
  <rect x="65" y="296" width="375" height="48" rx="6" fill="#ffffff" stroke="#c084fc"/>
  <text x="252" y="317" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f172a">4. ИИ-генерация контента каждого блока (Этап 2)</text>
  <text x="252" y="334" text-anchor="middle" font-size="11" fill="#64748b">Конспект, код, тесты (correct_index) и практическое задание</text>

  <line x1="252" y1="344" x2="252" y2="361" stroke="#334155" stroke-width="1.5" marker-end="url(#arr)"/>

  <!-- Шаг 5 -->
  <rect x="65" y="363" width="375" height="65" rx="6" fill="#f3e8ff" stroke="#7e22ce" stroke-width="2"/>
  <text x="252" y="386" text-anchor="middle" font-size="13" font-weight="700" fill="#581c87">5. Публикация курса и выдача инвайт-кода</text>
  <text x="252" y="405" text-anchor="middle" font-size="11.5" font-weight="700" fill="#7e22ce">Генерация уникального 6-значного кода (напр. 7K2B9X)</text>
  <text x="252" y="420" text-anchor="middle" font-size="11" fill="#64748b">Преподаватель передаёт инвайт-код студентам группы</text>

  <!-- Справа: Ветка студента (Последовательное обучение) -->
  <rect x="515" y="55" width="425" height="395" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.8"/>
  <text x="727" y="80" text-anchor="middle" font-size="14.5" font-weight="700" fill="#14532d">Ветка Студента (Последовательное прохождение)</text>

  <!-- Шаг С1 -->
  <rect x="540" y="95" width="375" height="48" rx="6" fill="#ffffff" stroke="#86efac"/>
  <text x="727" y="116" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f172a">1. Ввод инвайт-кода курса</text>
  <text x="727" y="133" text-anchor="middle" font-size="11" fill="#64748b">Запись в enrollments. Блок 1 открыт, блоки 2..N закрыты 🔒</text>

  <line x1="727" y1="143" x2="727" y2="160" stroke="#334155" stroke-width="1.5" marker-end="url(#arr)"/>

  <!-- Шаг С2 -->
  <rect x="540" y="162" width="375" height="48" rx="6" fill="#ffffff" stroke="#86efac"/>
  <text x="727" y="183" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f172a">2. Изучение теории и примеров кода блока</text>
  <text x="727" y="200" text-anchor="middle" font-size="11" fill="#64748b">Теоретический конспект и запуск демонстрационного кода</text>

  <line x1="727" y1="210" x2="727" y2="227" stroke="#334155" stroke-width="1.5" marker-end="url(#arr)"/>

  <!-- Шаг С3 -->
  <rect x="540" y="229" width="375" height="52" rx="6" fill="#ffffff" stroke="#86efac"/>
  <text x="727" y="249" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f172a">3. Прохождение теста и отправка практики</text>
  <text x="727" y="267" text-anchor="middle" font-size="11" fill="#64748b">Серверный подсчёт баллов; ИИ-ревью кода практической задачи</text>

  <line x1="727" y1="281" x2="727" y2="298" stroke="#334155" stroke-width="1.5" marker-end="url(#arr)"/>

  <!-- Шаг С4: Условие зачёта -->
  <polygon points="727,300 870,332 727,364 584,332" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.8"/>
  <text x="727" y="328" text-anchor="middle" font-size="11.5" font-weight="700" fill="#78350f">Тест ≥ 70 % И</text>
  <text x="727" y="344" text-anchor="middle" font-size="11.5" font-weight="700" fill="#78350f">практика зачтена?</text>

  <!-- Нет -> Подсказка ИИ -->
  <line x1="584" y1="332" x2="550" y2="332" stroke="#ef4444" stroke-width="1.5"/>
  <line x1="550" y1="332" x2="550" y2="186" stroke="#ef4444" stroke-width="1.5"/>
  <line x1="550" y1="186" x2="538" y2="186" stroke="#ef4444" stroke-width="1.5" marker-end="url(#arr)"/>
  <text x="500" y="250" font-size="11" font-weight="700" fill="#b91c1c" transform="rotate(-90 500 250)">Нет: помощь ИИ-наставника</text>

  <!-- Да -> Открытие следующего блока -->
  <line x1="727" y1="364" x2="727" y2="385" stroke="#16a34a" stroke-width="1.8" marker-end="url(#arr)"/>
  <text x="740" y="377" font-size="11" font-weight="700" fill="#15803d">Да</text>

  <rect x="540" y="387" width="375" height="48" rx="6" fill="#dcfce7" stroke="#15803d" stroke-width="2"/>
  <text x="727" y="407" text-anchor="middle" font-size="12.5" font-weight="700" fill="#14532d">4. Блок засчитан → Следующий блок разблокирован 🔓</text>
  <text x="727" y="424" text-anchor="middle" font-size="11" fill="#166534">Обновление шкалы общего прогресса курса в БД</text>
</svg>
`;

async function run() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Создаём легковесный локальный мок-сервер для снятия красивых скриншотов веб-интерфейса
  const mockServer = http.createServer((req, res) => {
    const url = req.url.split('?')[0];

    // Mock API
    if (url === '/api/auth/me') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ user: null }));
    }

    // Раздаём статику
    let filePath = path.join(__dirname, '..', 'public', url === '/' ? 'index.html' : url);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript',
        '.css': 'text/css'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      return fs.createReadStream(filePath).pipe(res);
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  await new Promise((resolve) => mockServer.listen(0, resolve));
  const port = mockServer.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log('Сервер моков запущен для скриншотов на:', baseUrl);

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (_) {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch (e) {
      browser = await chromium.launch({ headless: true });
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1360, height: 880 },
    deviceScaleFactor: 1.5
  });
  const page = await context.newPage();

  // 1. Рендерим схемы 1, 2, 3
  const diagrams = [
    { name: 'fig1_architecture.png', svg: svgArchitecture, w: 980, h: 490 },
    { name: 'fig2_er_schema.png', svg: svgErDiagram, w: 980, h: 560 },
    { name: 'fig3_algorithm.png', svg: svgAlgorithm, w: 980, h: 480 }
  ];

  for (const d of diagrams) {
    await page.setViewportSize({ width: d.w, height: d.h });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fff;">${d.svg}</body></html>`);
    await page.screenshot({ path: path.join(ASSETS_DIR, d.name) });
    console.log('Сохранена векторная схема:', d.name);
  }

  // 2. Скриншот fig5_ai_generator.png: Интерфейс 2-этапной генерации курса и блоков преподавателем
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // Внедряем состояние преподавателя в DOM
  await page.evaluate(() => {
    state.user = { id: 'prof-satmaganbetova', full_name: 'Сатмаганбетова Ж.З.', role: 'teacher' };
    state.token = 'mock-jwt-token';
    render();

    // Открываем вкладку создания курса с заполненной темой и параметрами
    switchTeacherTab('create');
    document.getElementById('courseTopic').value = 'Разработка REST API на Node.js и баз данных PostgreSQL с авторизацией JWT';
    document.getElementById('courseDifficulty').value = 'Средний';
    document.getElementById('courseBlocksCount').value = '4';
  });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(ASSETS_DIR, 'fig5_ai_generator.png'),
    fullPage: false
  });
  console.log('Сохранён скриншот fig5_ai_generator.png');

  // 3. Скриншот fig6_teacher_dashboard.png: Кабинет преподавателя с инвайт-кодом, списком блоков и студентами
  await page.evaluate(() => {
    switchTeacherTab('courses');
    const course = {
      id: 'c-rest-api',
      title: 'Разработка REST API на Node.js и PostgreSQL',
      topic: 'Разработка REST API на Node.js и PostgreSQL',
      description: 'Курс по созданию защищённых серверных веб-сервисов и баз данных',
      difficulty: 'Средний',
      status: 'published',
      invite_code: '7K2B9X'
    };
    const blocks = [
      { id: 'b1', position: 1, title: 'Архитектура REST и каркас Express', goal: 'Освоить создание веб-сервера и JSON-маршрутов', content_status: 'generated', quiz_questions: [1, 2, 3], practice_task: true },
      { id: 'b2', position: 2, title: 'Маршрутизация и Middleware в Node.js', goal: 'Понять конвейер обработки HTTP-запросов', content_status: 'generated', quiz_questions: [1, 2], practice_task: true },
      { id: 'b3', position: 3, title: 'Аутентификация с помощью JWT токенов', goal: 'Реализовать регистрацию, хеширование паролей и токены', content_status: 'generated', quiz_questions: [1, 2, 3], practice_task: true },
      { id: 'b4', position: 4, title: 'Интеграция с PostgreSQL и Supabase', goal: 'Настроить реляционную БД и SQL-запросы', content_status: 'outline', quiz_questions: [], practice_task: false }
    ];
    state.currentTeacherCourse = { course, blocks };
    document.getElementById('teacherCoursesTab').classList.add('hidden');
    document.getElementById('teacherCourseDetail').classList.remove('hidden');
    renderTeacherCourseDetail();

    // Заполняем таблицу аналитики студентов
    document.getElementById('tStudentsList').innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:0.9rem; margin-top:8px;">
        <thead>
          <tr style="border-bottom:1px solid #334155; color:#94a3b8; text-align:left;">
            <th style="padding:8px;">Студент</th>
            <th style="padding:8px;">Прогресс курса</th>
            <th style="padding:8px;">Пройдено блоков</th>
            <th style="padding:8px;">Средний балл тестов</th>
            <th style="padding:8px;">Статус практики</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #1e293b;">
            <td style="padding:10px 8px; font-weight:600;">Прободяк Я. С.</td>
            <td style="padding:10px 8px;">
              <div style="background:#334155; border-radius:4px; height:8px; width:120px; overflow:hidden; display:inline-block; vertical-align:middle; margin-right:8px;">
                <div style="background:#10b981; height:100%; width:75%;"></div>
              </div>
              <span style="color:#34d399; font-weight:600;">75 %</span>
            </td>
            <td style="padding:10px 8px;">3 из 4 блоков</td>
            <td style="padding:10px 8px; color:#38bdf8; font-weight:600;">92 %</td>
            <td style="padding:10px 8px;"><span class="status-pill status-passed">Зачтено (Claude AI)</span></td>
          </tr>
          <tr style="border-bottom:1px solid #1e293b;">
            <td style="padding:10px 8px; font-weight:600;">Иванов А. В.</td>
            <td style="padding:10px 8px;">
              <div style="background:#334155; border-radius:4px; height:8px; width:120px; overflow:hidden; display:inline-block; vertical-align:middle; margin-right:8px;">
                <div style="background:#10b981; height:100%; width:50%;"></div>
              </div>
              <span style="color:#34d399; font-weight:600;">50 %</span>
            </td>
            <td style="padding:10px 8px;">2 из 4 блоков</td>
            <td style="padding:10px 8px; color:#38bdf8; font-weight:600;">85 %</td>
            <td style="padding:10px 8px;"><span class="status-pill status-passed">Зачтено (Claude AI)</span></td>
          </tr>
        </tbody>
      </table>
    `;
  });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(ASSETS_DIR, 'fig6_teacher_dashboard.png'),
    fullPage: false
  });
  console.log('Сохранён скриншот fig6_teacher_dashboard.png');

  // 4. Скриншот fig4_student_workspace.png: Рабочее место студента с теорией, тестом, редактором и подсказкой ИИ
  await page.evaluate(() => {
    state.user = { id: 'stud-probodyak', full_name: 'Прободяк Я. С.', role: 'student' };
    state.token = 'mock-jwt-token';
    render();

    document.getElementById('teacherView').classList.add('hidden');
    document.getElementById('studentView').classList.remove('hidden');
    document.getElementById('studentCoursesSection').classList.add('hidden');
    document.getElementById('studentCourseDetail').classList.add('hidden');
    document.getElementById('studentBlockWorkspace').classList.remove('hidden');

    // Наполняем контентом блок 1
    document.getElementById('sbTitle').textContent = 'Блок 1. Архитектура REST API и каркас Express';
    document.getElementById('sbTime').textContent = '45 мин.';
    document.getElementById('sbSummary').textContent = 'Изучение клиент-серверной архитектуры REST, обработки JSON-запросов и создания веб-сервера на Express.';
    document.getElementById('sbConcepts').innerHTML = `
      <span class="status-pill status-outline" style="margin-right:6px;">REST API</span>
      <span class="status-pill status-outline" style="margin-right:6px;">Express Framework</span>
      <span class="status-pill status-outline" style="margin-right:6px;">HTTP Methods</span>
      <span class="status-pill status-outline" style="margin-right:6px;">JSON Endpoints</span>
    `;
    document.getElementById('sbTheory').innerHTML = `
      <h3 style="margin:16px 0 8px; color:#38bdf8;">Архитектура REST API</h3>
      <p style="margin-bottom:8px;">REST (Representational State Transfer) — архитектурный стиль взаимодействия компонентов распределенного приложения по протоколу HTTP.</p>
      <p style="margin-bottom:8px;">Основные принципы REST:</p>
      <li style="margin-left:20px;"><strong>Клиент-серверное разделение:</strong> пользовательский интерфейс независим от хранения данных;</li>
      <li style="margin-left:20px;"><strong>Отсутствие состояния (Stateless):</strong> сервер не хранит сессионное состояние между независимыми запросами;</li>
      <li style="margin-left:20px;"><strong>Стандартизированные коды ответов:</strong> 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 500 Server Error.</li>
    `;
    document.getElementById('sbCodeExample').textContent = 
      "const express = require('express');\\nconst app = express();\\napp.use(express.json());\\n\\napp.get('/api/health', (req, res) => {\\n  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });\\n});\\n\\napp.listen(3000, () => console.log('Server started on port 3000'));";

    document.getElementById('sbQuizQuestions').innerHTML = `
      <div style="margin-bottom:12px;">
        <p style="font-weight:600; margin-bottom:6px;">1. Какой HTTP-статус должен вернуть REST API при успешном создании нового ресурса?</p>
        <label class="quiz-option"><input type="radio" name="q_0" value="0" /> 200 OK</label>
        <label class="quiz-option" style="border-color:#10b981;"><input type="radio" name="q_0" value="1" checked /> 201 Created (верно)</label>
        <label class="quiz-option"><input type="radio" name="q_0" value="2" /> 204 No Content</label>
      </div>
    `;

    document.getElementById('sbTaskInstructions').textContent = 'Напишите обработчик маршрута GET /api/ping на Express, возвращающий JSON-объект { "status": "pong" } и код ответа 200.';
    document.getElementById('sbPracticeCode').value = 
      "const express = require('express');\\nconst router = express.Router();\\n\\n// Практическое задание: GET /api/ping\\nrouter.get('/api/ping', (req, res) => {\\n  res.status(200).json({ status: 'pong' });\\n});\\n\\nmodule.exports = router;";

    // Показываем зачтённый результат практики
    const practiceRes = document.getElementById('sbPracticeResult');
    practiceRes.classList.remove('hidden');
    practiceRes.className = 'quiz-result pass';
    practiceRes.innerHTML = `
      <div style="font-weight:700; font-size:1rem; margin-bottom:4px;">Результат проверки: 100 / 100 баллов (Зачтено Claude AI)</div>
      <div>Решение соответствует всем критериям: обработчик GET /api/ping реализован корректно, возвращён код 200 и ожидаемый JSON-объект.</div>
    `;

    // ИИ-наставник
    document.getElementById('sbTutorQuestion').value = 'Как в Express объединить вызов статуса ответа и отправку JSON?';
    const tutorAns = document.getElementById('sbTutorAnswer');
    tutorAns.classList.remove('hidden');
    tutorAns.innerHTML = `
      <div style="color:#6ee7b7; font-weight:700; font-size:0.85rem; margin-bottom:4px;">ИИ-наставник урока (Claude AI):</div>
      <div style="line-height:1.5; font-size:0.9rem;">В Express методы объекта <code>res</code> поддерживают вызов цепочкой (chaining): вы можете вызвать <code>res.status(200).json({ status: 'ok' })</code>. Метод <code>.status()</code> задаёт HTTP-код, а метод <code>.json()</code> сериализует объект и проставляет заголовок Content-Type: application/json.</div>
    `;
  });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(ASSETS_DIR, 'fig4_student_workspace.png'),
    fullPage: false
  });
  console.log('Сохранён скриншот fig4_student_workspace.png');

  await browser.close();
  mockServer.close();
  console.log('Все схемы и скриншоты успешно обновлены в docs_assets/');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
