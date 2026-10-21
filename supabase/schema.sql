-- ============================================================================
-- Схема базы данных PostgreSQL (Supabase)
-- Онлайн-платформа дистанционного обучения «Web разработчик» с применением ИИ
-- ============================================================================

-- 1. Таблица пользователей (студенты и преподаватели)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher')),
    group_name VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Таблица курсов (сгенерированных ИИ или созданных преподавателем)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(250) NOT NULL,
    topic_prompt TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(30) NOT NULL DEFAULT 'intermediate',
    target_audience VARCHAR(150) DEFAULT 'Студенты IT-направлений',
    ai_model VARCHAR(80) NOT NULL DEFAULT 'claude-3-5-sonnet-latest',
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Таблица учебных блоков (модулей/уроков курса, разбитых ИИ)
CREATE TABLE IF NOT EXISTS course_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    title VARCHAR(250) NOT NULL,
    summary TEXT NOT NULL,
    theory_markdown TEXT NOT NULL,
    code_example TEXT NOT NULL,
    key_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_minutes INTEGER NOT NULL DEFAULT 45,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (course_id, order_index)
);

-- 4. Таблица тестовых вопросов для автоматической проверки по каждому блоку
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID NOT NULL REFERENCES course_blocks(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 1,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- массив вариантов ответа (строки)
    correct_index INTEGER NOT NULL, -- хранится и проверяется только на сервере
    explanation TEXT NOT NULL
);

-- 5. Таблица практических заданий по программированию к каждому блоку
CREATE TABLE IF NOT EXISTS practice_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID NOT NULL REFERENCES course_blocks(id) ON DELETE CASCADE,
    title VARCHAR(250) NOT NULL,
    instructions TEXT NOT NULL,
    starter_code TEXT NOT NULL,
    expected_patterns JSONB NOT NULL DEFAULT '[]'::jsonb, -- массив правил/регулярных выражений для автопроверки
    evaluation_criteria TEXT NOT NULL, -- критерии для семантического разбора через Claude API
    max_score INTEGER NOT NULL DEFAULT 100
);

-- 6. Таблица отправленных решений и результатов проверки (тесты + практика)
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES course_blocks(id) ON DELETE CASCADE,
    submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('quiz', 'practice')),
    submitted_payload JSONB NOT NULL, -- выбранные ответы или исходный код студента
    auto_score INTEGER NOT NULL CHECK (auto_score BETWEEN 0 AND 100),
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    ai_feedback TEXT,
    teacher_comment TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'graded' CHECK (status IN ('pending', 'graded', 'revision')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Таблица прогресса изучения блоков студентами
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES course_blocks(id) ON DELETE CASCADE,
    quiz_score INTEGER DEFAULT 0,
    practice_score INTEGER DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, block_id)
);

-- 8. Таблица журнала диалогов с ИИ-наставником по учебным блокам
CREATE TABLE IF NOT EXISTS ai_tutor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES course_blocks(id) ON DELETE CASCADE,
    student_question TEXT NOT NULL,
    student_code TEXT,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для ускорения выборок на сервере
CREATE INDEX IF NOT EXISTS idx_blocks_course ON course_blocks(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_block ON quiz_questions(block_id);
CREATE INDEX IF NOT EXISTS idx_practice_block ON practice_tasks(block_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_block ON submissions(user_id, block_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_course ON student_progress(user_id, course_id);

-- Политики построчной безопасности (Row Level Security) для Supabase
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
