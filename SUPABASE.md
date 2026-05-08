# Supabase 설정 가이드

계정을 바꾸거나 새 프로젝트에 배포할 때 참고하세요.

## 1. 프로젝트 생성

1. [supabase.com](https://supabase.com) 로그인
2. New Project 생성
3. Project URL과 anon public key 복사

## 2. 환경변수 설정

`.env.local` 파일 생성:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 3. 테이블 생성

Supabase 대시보드 → SQL Editor에서 아래 SQL 실행:

```sql
-- tasks
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

-- columns
create table columns (
  id uuid primary key,
  user_id uuid references auth.users not null,
  name text not null,
  "order" int not null default 0,
  is_completed_column boolean not null default false,
  filter_type text,
  filter_days int
);

-- calendar_events
create table calendar_events (
  id uuid primary key,
  user_id uuid references auth.users not null,
  date date not null,
  type text not null,
  name text,
  created_at timestamptz not null default now()
);
```

## 4. RLS(Row Level Security) 설정

```sql
-- tasks RLS
alter table tasks enable row level security;

create policy "tasks: 본인 데이터만"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- columns RLS
alter table columns enable row level security;

create policy "columns: 본인 데이터만"
  on columns for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- calendar_events RLS
alter table calendar_events enable row level security;

create policy "calendar_events: 본인 데이터만"
  on calendar_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## 5. 인증 설정

Supabase 대시보드 → Authentication → Providers:

- **Email** 활성화
- Confirm email: 필요에 따라 on/off (off 권장 — 바로 로그인)

배포 도메인이 있다면 Authentication → URL Configuration:
- Site URL: `https://your-domain.com`
- Redirect URLs에 `https://your-domain.com/**` 추가

## 계정 전환 시 체크리스트

- [ ] 새 프로젝트 생성
- [ ] `.env.local` URL·Key 교체
- [ ] SQL 실행 (테이블 3개)
- [ ] RLS 정책 설정
- [ ] 인증 설정 확인
- [ ] `npm run dev` 후 회원가입 → 기본 컬럼 자동 생성 확인
