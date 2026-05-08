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

## 6. Vercel 배포

1. [vercel.com](https://vercel.com) → New Project → GitHub 레포 연결
2. Framework Preset: **Next.js** (자동 감지)
3. Environment Variables 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

배포 후 도메인(`https://xxxx.vercel.app`)을 Supabase에 등록:
- Authentication → URL Configuration → Site URL 업데이트
- Redirect URLs에 `https://xxxx.vercel.app/**` 추가

커스텀 도메인이 있다면 Vercel → Project → Settings → Domains에서 추가 후 동일하게 Supabase에도 등록.

---

## 계정/프로젝트 전환 시 체크리스트

- [ ] Supabase 새 프로젝트 생성
- [ ] SQL 실행 (테이블 3개 + RLS)
- [ ] 인증 설정 (Email 활성화, Confirm email off)
- [ ] `.env.local` URL·Key 교체 (로컬 개발용)
- [ ] Vercel 환경변수 교체 → Redeploy
- [ ] Supabase Redirect URLs에 도메인 등록
- [ ] 회원가입 후 기본 컬럼 4개 자동 생성 확인
