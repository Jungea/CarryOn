-- ============================================================
-- 테이블 생성
-- ============================================================

create table tasks (
  id uuid primary key,
  user_id uuid references auth.users not null,
  title text not null default '',
  memo text not null default '',
  column_id uuid not null,
  "order" int not null default 0,
  due_date date,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table columns (
  id uuid primary key,
  user_id uuid references auth.users not null,
  name text not null,
  "order" int not null default 0,
  is_completed_column boolean not null default false,
  filter_type text,
  filter_days int
);

create table calendar_events (
  id uuid primary key,
  user_id uuid references auth.users not null,
  date date not null,
  type text not null,
  name text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS 설정
-- ============================================================

alter table tasks enable row level security;
create policy "tasks: 본인 데이터만" on tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table columns enable row level security;
create policy "columns: 본인 데이터만" on columns for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table calendar_events enable row level security;
create policy "calendar_events: 본인 데이터만" on calendar_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
