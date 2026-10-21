-- Схема базы данных платформы «Web разработчик» (PostgreSQL / Supabase)
-- Пользователи хранятся в auth.users (Supabase Auth), здесь хранится профиль с ролью.
-- Сервер работает через service_role и сам проверяет права, поэтому RLS включён
-- без публичных политик: напрямую из браузера к таблицам доступа нет.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('teacher', 'student')),
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  topic text not null,
  description text not null default '',
  difficulty text not null default 'Средний',
  status text not null default 'draft' check (status in ('draft', 'published')),
  invite_code text unique,
  ai_model text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists course_blocks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  position integer not null,
  title text not null,
  goal text not null default '',
  content_status text not null default 'outline' check (content_status in ('outline', 'generated')),
  summary text,
  theory_markdown text,
  code_example text,
  key_concepts jsonb not null default '[]'::jsonb,
  estimated_minutes integer,
  generated_at timestamptz
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references course_blocks(id) on delete cascade,
  position integer not null,
  question_text text not null,
  options jsonb not null,
  correct_index integer not null,
  explanation text not null default ''
);

create table if not exists practice_tasks (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null unique references course_blocks(id) on delete cascade,
  title text not null,
  instructions text not null,
  starter_code text not null default '',
  evaluation_criteria text not null,
  pass_score integer not null default 70
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (course_id, student_id)
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references course_blocks(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  answers jsonb not null,
  score integer not null check (score between 0 and 100),
  passed boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists practice_submissions (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references course_blocks(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  code text not null,
  score integer not null check (score between 0 and 100),
  passed boolean not null,
  ai_feedback text not null,
  teacher_comment text,
  created_at timestamptz not null default now()
);

create table if not exists tutor_messages (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references course_blocks(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  question text not null,
  code text,
  answer text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_courses_teacher on courses(teacher_id);
create index if not exists idx_blocks_course on course_blocks(course_id, position);
create index if not exists idx_quiz_block on quiz_questions(block_id, position);
create index if not exists idx_enrollments_student on enrollments(student_id);
create index if not exists idx_quiz_attempts_student on quiz_attempts(student_id, block_id);
create index if not exists idx_practice_student on practice_submissions(student_id, block_id);
create index if not exists idx_tutor_student on tutor_messages(student_id, block_id);

alter table profiles enable row level security;
alter table courses enable row level security;
alter table course_blocks enable row level security;
alter table quiz_questions enable row level security;
alter table practice_tasks enable row level security;
alter table enrollments enable row level security;
alter table quiz_attempts enable row level security;
alter table practice_submissions enable row level security;
alter table tutor_messages enable row level security;

notify pgrst, 'reload schema';
