# 셋팅 가이드

새 환경에서 처음 시작하거나 Supabase 계정을 바꿀 때 순서대로 따라하세요.

---

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 로그인 → New Project
2. Settings → API에서 복사:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public key** (`eyJ...`)

---

## 2. 테이블 생성 및 RLS 설정

Supabase 대시보드 → SQL Editor에서 [supabase/migrations/001_init.sql](./supabase/migrations/001_init.sql) 내용을 붙여넣고 실행합니다.

---

## 3. 인증 설정

Authentication → Providers → Email:
- **Enable Email Provider**: ON
- **Confirm email**: OFF 권장 (가입 즉시 로그인)

---

## 4. 환경변수 설정

`.env.local.example`을 복사해서 값 입력:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 5. 로컬 실행 확인

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` → 로그인 페이지 하단 **회원가입** → 기본 컬럼 4개 자동 생성 확인.

> WSL 환경에서는 WSL 터미널에서 실행해야 합니다.

---

## 6. Vercel 배포

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

## 7. DB 정지 방지 (무료 플랜)

Supabase 무료 플랜은 일정 기간 비활성 시 DB가 일시정지됩니다.  
[cron-job.org](https://cron-job.org)에서 매일 1회 헬스체크 URL을 ping하여 방지합니다.

1. [cron-job.org](https://cron-job.org) 가입
2. CREATE CRONJOB → URL: `https://your-domain.com/api/health`
3. Schedule: Every day → Save

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
- [ ] cron-job.org 헬스체크 등록
