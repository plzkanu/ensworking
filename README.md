# SOOSAN 시간외근무 ERP

로컬 HTML 도구(일반근무 / 유연근무)를 Next.js 웹 앱으로 배포하기 위한 프로젝트입니다.

**GitHub**: https://github.com/plzkanu/ensworking

## 기능

- 로그인 (Supabase `ens_users` + HMAC 세션 쿠키)
- 대시보드 + 사이드바 내비게이션
- **시간외근무 (일반)** — HWP 파싱, 검증, ERP 양식 다운로드
- **시간외근무 (유연)** — 유연근무 시간대 변환 포함
- `/overtime/*` 정적 도구 경로 미들웨어 인증

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local
# .env.local 에 Supabase URL, Service Role Key, AUTH_SECRET 설정

# Supabase SQL Editor에서 실행
# supabase/migrations/001_ens_users.sql

npm run dev
```

브라우저: http://localhost:3000

최초 로그인 (테이블이 비어 있으면 자동 생성):

| 아이디 | 비밀번호 |
|--------|----------|
| admin  | admin123 |

## GitHub → Replit 배포

### 1. Replit에서 GitHub Import

1. [Replit](https://replit.com) → **Create Repl** → **Import from GitHub**
2. 저장소: `plzkanu/ensworking`
3. Import 완료 후 **Secrets** 탭에서 환경 변수 등록

### 2. Replit Secrets (필수)

| Secret | 설명 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `AUTH_SECRET` | 세션 쿠키 서명용 랜덤 문자열 |

선택 (VPN/방화벽 TLS 오류 시):

| Secret | 값 |
|--------|-----|
| `SUPABASE_SSL_VERIFY` | `0` |

### 3. Supabase 준비

SQL Editor에서 `supabase/migrations/001_ens_users.sql` 실행

### 4. Replit 배포 절차

코드 업데이트 후 Replit Shell:

```bash
git fetch origin master && git reset --hard origin/master && npm install && npm run build
```

그다음 **Deploy → Republish**

### 5. 로컬 → GitHub 푸시

```bash
git add .
git commit -m "변경 내용"
git push origin master
```

## HTML 도구 업데이트

루트 HTML 파일 수정 후 public에 반영:

```bash
npm run extract-html
Copy-Item "시간외근무_일반근무.html" "public/overtime/regular/index.html" -Force
Copy-Item "시간외근무_유연근무.html" "public/overtime/flexible/index.html" -Force
```

## 프로젝트 구조

```
src/
  app/
    login/              # 로그인
    dashboard/          # 인증 후 메인
      overtime/
        regular/        # 일반근무 iframe 페이지
        flexible/       # 유연근무 iframe 페이지
    api/auth/           # login, logout, me
  components/           # 사이드바, 로그인 폼, iframe 래퍼
  lib/                  # auth, supabase, users
public/overtime/        # 레거시 HTML 도구 (인증 필요)
supabase/migrations/    # ens_users 테이블
.replit                 # Replit 배포 설정
```
