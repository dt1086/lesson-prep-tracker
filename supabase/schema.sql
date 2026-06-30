-- Lesson Prep Tracker schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  exam_type text,
  location text,
  parent_contact text,
  goals text,
  focus_areas text,
  watch_points text,
  strengths text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prep_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  calendar_event_id text not null,
  label text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists prep_tasks_calendar_event_id_idx on prep_tasks(calendar_event_id);
create index if not exists prep_tasks_student_id_idx on prep_tasks(student_id);

create table if not exists session_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  calendar_event_id text not null,
  session_date timestamptz not null,
  notes text not null,
  created_at timestamptz not null default now()
);

create index if not exists session_notes_student_id_idx on session_notes(student_id);
create unique index if not exists session_notes_calendar_event_id_idx on session_notes(calendar_event_id);

-- Single-row table holding the Google OAuth refresh token (server-side only, never exposed to the browser)
create table if not exists google_tokens (
  id boolean primary key default true,
  refresh_token text not null,
  updated_at timestamptz not null default now(),
  constraint google_tokens_singleton check (id)
);

-- Row Level Security: open for now (single-user app), tighten once auth is added
alter table students enable row level security;
alter table prep_tasks enable row level security;
alter table google_tokens enable row level security;
alter table session_notes enable row level security;

create policy "Allow all on students" on students for all using (true) with check (true);
create policy "Allow all on prep_tasks" on prep_tasks for all using (true) with check (true);
create policy "Allow all on session_notes" on session_notes for all using (true) with check (true);
-- No policy on google_tokens: only the service_role key (server-side) can access it; the browser's anon key is blocked by RLS.
