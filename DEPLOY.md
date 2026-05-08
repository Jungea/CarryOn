# 배포 가이드

초기 셋팅은 [SETUP.md](./SETUP.md)를 먼저 완료하세요.

---

## Vercel

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

## 계정 북마크릿 (빠른 로그인)

여러 계정을 PC 북마크로 저장해두고 클릭 한 번에 로그인할 수 있습니다.

### 만드는 방법

1. 브라우저 북마크 추가 (Ctrl+D 또는 북마크바 우클릭 → 페이지 추가)
2. 이름: `CarryOn - 계정1` 등 원하는 이름
3. URL 칸에 아래 코드 붙여넣기 (이메일·비밀번호 부분만 수정):

```
javascript:(function(){var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;var e=document.querySelector('input[type="email"]');var p=document.querySelector('input[type="password"]');s.call(e,'계정@email.com');e.dispatchEvent(new Event('input',{bubbles:true}));s.call(p,'비밀번호');p.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('button[type="submit"]').click();})()
```

### 사용 방법

1. 로그인 페이지 접속
2. 원하는 계정 북마크 클릭 → 자동 입력 후 로그인

> 비밀번호는 브라우저 북마크 매니저에만 저장되며 URL이나 서버 로그에 남지 않습니다.
