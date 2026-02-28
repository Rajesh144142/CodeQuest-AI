create extension if not exists pgcrypto;

create table if not exists public.generated_questions (
  id uuid primary key default gen_random_uuid(),
  language text not null check (language in ('cpp', 'python')),
  step_number int not null check (step_number between 1 and 3),
  prompt text not null,
  options jsonb not null,
  answer_index int not null check (answer_index between 0 and 3),
  answer_text text not null,
  boilerplate_code text not null,
  explanation text not null,
  points int not null check (points between 1 and 100),
  source_ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_generated_questions_language on public.generated_questions(language);
create index if not exists idx_generated_questions_step_number on public.generated_questions(step_number);
create index if not exists idx_generated_questions_source_ip on public.generated_questions(source_ip);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.api_daily_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  source_ip text not null,
  endpoint text not null,
  usage_date date not null,
  hit_count int not null default 0 check (hit_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_api_daily_usage_user_ip_endpoint_date
  on public.api_daily_usage(user_id, source_ip, endpoint, usage_date);
