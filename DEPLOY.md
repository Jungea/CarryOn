# 배포 가이드

## Supabase

### 프로젝트 설정
- 대시보드: https://supabase.com/dashboard
- Project URL / anon key: Settings → API

### 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

### 인증 설정
- Authentication → Providers → Email: **Enable Sign Ups OFF** (초대된 유저만 로그인)
- Authentication → Users: 여기서 유저 직접 추가/비밀번호 변경

### RLS (Row Level Security)
모든 테이블에 RLS 적용됨. 각 테이블의 Policy:
- `tasks`, `columns`, `calendar_events` 모두 `auth.uid() = user_id` 조건으로 본인 데이터만 접근 가능

### 테이블 구조
| 테이블 | 주요 컬럼 |
|---|---|
| tasks | id, title, memo, column_id, due_date, created_at, completed_at, order, user_id |
| columns | id, name, order, is_completed_column, user_id |
| calendar_events | id, date, type, name, user_id |

---

## Vercel

### 배포
- GitHub 연동 후 main 브랜치 push 시 자동 배포
- 대시보드: https://vercel.com/dashboard

### 환경 변수 설정
Vercel 프로젝트 → Settings → Environment Variables에 추가:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 커스텀 도메인
Vercel 프로젝트 → Settings → Domains → 도메인 추가  
DNS에서 CNAME을 `cname.vercel-dns.com`으로 설정

---

## 로컬 개발

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.example .env.local  # 값 직접 입력

# 개발 서버 실행
npm run dev
```

WSL 환경에서는 `/mnt/d/` 경로 핫리로드가 느릴 수 있음 → polling 방식으로 설정되어 있음 (`next.config.ts`)
