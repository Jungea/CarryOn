# 셋팅 가이드

새 환경에서 처음 시작하거나 Supabase 계정을 바꿀 때 순서대로 따라하세요.

---

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 로그인 → New Project
2. Settings → API에서 복사:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public key** (`eyJ...`)

---

## 2. 테이블 생성

Supabase 대시보드 → SQL Editor에서 실행:

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

---

## 3. RLS 설정

이어서 SQL Editor에서 실행:

```sql
alter table tasks enable row level security;
create policy "tasks: 본인 데이터만" on tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table columns enable row level security;
create policy "columns: 본인 데이터만" on columns for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table calendar_events enable row level security;
create policy "calendar_events: 본인 데이터만" on calendar_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

---

## 4. 인증 설정

Authentication → Providers → Email:
- **Enable Email Provider**: ON
- **Confirm email**: OFF 권장 (가입 즉시 로그인)

Authentication → Users에서 유저 직접 추가/비밀번호 변경 가능.

---

## 5. 환경변수 설정 (로컬)

`.env.local` 파일 생성:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 6. 로컬 실행 확인

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` → 회원가입 → 기본 컬럼 4개 자동 생성 확인.

> WSL 환경(`/mnt/d/`)에서는 Windows CMD/PowerShell이 아닌 WSL 터미널에서 실행해야 합니다.

---

## 7. Vercel 배포

1. [vercel.com](https://vercel.com) → New Project → GitHub 레포 연결
2. Framework Preset: **Next.js** (자동 감지)
3. Environment Variables 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### 커스텀 도메인

Vercel 프로젝트 → Settings → Domains → 도메인 추가  
DNS에서 CNAME을 `cname.vercel-dns.com`으로 설정

도메인 확정 후 Supabase → Authentication → URL Configuration에도 등록.

---

## 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] 테이블 생성 SQL 실행
- [ ] RLS SQL 실행
- [ ] 인증 설정 (Email ON, Confirm OFF)
- [ ] `.env.local` 작성
- [ ] 로컬 실행 확인 (기본 컬럼 4개)
- [ ] Vercel 배포 (환경변수 포함)
- [ ] 커스텀 도메인 설정 (선택)
