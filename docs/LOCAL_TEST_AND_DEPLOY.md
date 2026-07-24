# 로컬 테스트 및 배포 가이드

SOOSAN 시간외근무 ERP 프로젝트의 로컬 개발·테스트와 Replit 배포 절차를 정리한 문서입니다.

- **저장소**: https://github.com/plzkanu/ensworking
- **스택**: Next.js 16, Supabase (`ens_users`), Replit (Cloud Run)

---

## 목차

1. [사전 요구사항](#1-사전-요구사항)
2. [로컬 개발 환경 설정](#2-로컬-개발-환경-설정)
3. [Supabase 준비](#3-supabase-준비)
4. [로컬 테스트](#4-로컬-테스트)
5. [프로덕션 빌드 확인 (로컬)](#5-프로덕션-빌드-확인-로컬)
6. [Replit 배포](#6-replit-배포)
7. [코드 업데이트 워크플로우](#7-코드-업데이트-워크플로우)
8. [HTML 도구 업데이트](#8-html-도구-업데이트)
9. [환경 변수 참조](#9-환경-변수-참조)
10. [문제 해결](#10-문제-해결)

---

## 1. 사전 요구사항

| 항목 | 버전/설명 |
|------|-----------|
| Node.js | 22 권장 (Replit과 동일, `.replit` 기준) |
| npm | Node.js에 포함 |
| Git | GitHub 연동용 |
| Supabase 프로젝트 | `ens_users` 테이블용 |
| Replit 계정 | 프로덕션 배포용 |

---

## 2. 로컬 개발 환경 설정

### 2-1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/plzkanu/ensworking.git
cd ensworking
npm install
```

### 2-2. 환경 변수 파일 생성

```bash
cp .env.local.example .env.local
```

`.env.local`을 열어 아래 값을 설정합니다.

```env
AUTH_SECRET=랜덤-문자열-32자-이상-권장
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> `AUTH_SECRET`은 세션 쿠키 HMAC 서명에 사용됩니다. 로컬·배포 환경마다 동일한 값을 쓰면 세션이 호환되지만, 보안상 환경별로 다른 값을 쓰는 것을 권장합니다.

### 2-3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

---

## 3. Supabase 준비

### 3-1. 마이그레이션 실행

Supabase 대시보드 → **SQL Editor**에서 아래 파일 내용을 실행합니다.

```
supabase/migrations/001_ens_users.sql
```

`ens_users` 테이블이 생성되며, RLS(Row Level Security)는 비활성화됩니다.

### 3-2. 초기 관리자 계정

`ens_users` 테이블이 **비어 있으면**, 최초 로그인 시도 시 자동으로 관리자 계정이 생성됩니다.

| 항목 | 값 |
|------|-----|
| 아이디 | `admin` |
| 비밀번호 | `admin123` |

> 배포 후 반드시 비밀번호를 변경하세요.

### 3-3. Supabase 키 확인 위치

Supabase 대시보드 → **Project Settings** → **API**

- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `SUPABASE_SERVICE_ROLE_KEY` → `service_role` key (서버 전용, 클라이언트에 노출 금지)

---

## 4. 로컬 테스트

### 4-1. 기본 확인 체크리스트

| # | 확인 항목 | URL / 방법 |
|---|-----------|------------|
| 1 | 로그인 페이지 표시 | http://localhost:3000/login |
| 2 | 관리자 로그인 | `admin` / `admin123` |
| 3 | 대시보드 진입 | http://localhost:3000/dashboard |
| 4 | 시간외근무 (일반) | http://localhost:3000/dashboard/overtime/regular |
| 5 | 시간외근무 (유연) | http://localhost:3000/dashboard/overtime/flexible |
| 6 | 미인증 접근 차단 | `/overtime/*` 직접 접속 시 `/login`으로 리다이렉트 |
| 7 | 로그아웃 | 대시보드에서 로그아웃 후 세션 쿠키 삭제 확인 |

### 4-2. API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 현재 세션 사용자 조회 |

### 4-3. 린트

```bash
npm run lint
```

### 4-4. 회사 VPN/방화벽 TLS 오류 시

Supabase 연결 시 TLS 인증서 오류가 나면 `.env.local`에 아래를 추가한 뒤 개발 서버를 재시작합니다.

```env
SUPABASE_SSL_VERIFY=0
```

> 내부망·개발 환경에서만 사용하세요. 프로덕션에서는 TLS 검증을 유지하는 것이 안전합니다.

---

## 5. 프로덕션 빌드 확인 (로컬)

배포 전 로컬에서 프로덕션 빌드가 성공하는지 확인합니다.

```bash
npm run build
npm run start
```

- `npm run build` — Next.js 프로덕션 빌드 (`.next` 생성)
- `npm run start` — `scripts/start-production.mjs` 실행
  - `PORT` 환경 변수 사용 (기본값 `3000`)
  - `0.0.0.0`에 바인딩 (Replit/Cloud Run과 동일 동작)

로컬 확인: http://localhost:3000

---

## 6. Replit 배포

### 6-1. 최초 설정 (1회)

1. [Replit](https://replit.com) → **Create Repl** → **Import from GitHub**
2. 저장소: `plzkanu/ensworking`
3. Import 완료 후 **Secrets** 탭에서 환경 변수 등록 (아래 [환경 변수 참조](#9-환경-변수-참조) 참고)
4. Supabase SQL Editor에서 `001_ens_users.sql` 실행
5. **Deploy** → **Republish** 로 첫 배포

### 6-2. Replit 배포 설정 (`.replit`)

| 항목 | 값 |
|------|-----|
| 개발 실행 | `npm run dev` |
| 배포 빌드 | `npm run build` |
| 배포 실행 | `npm run start` |
| 배포 타겟 | Cloud Run |
| 포트 | 로컬 3000 → 외부 80 |

### 6-3. Replit Secrets (필수)

> **중요**: Replit **에디터 Secrets**와 **Publishing(배포) Secrets**는 별도입니다.  
> Preview(개발)에서는 되는데 배포 URL(`*.replit.app`)에서 500이 나면 Publishing Secrets를 확인하세요.

| Secret | 설명 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` key |
| `AUTH_SECRET` | 세션 쿠키 서명용 랜덤 문자열 |

### 6-4. Replit Secrets (선택)

| Secret | 값 | 용도 |
|--------|-----|------|
| `SUPABASE_SSL_VERIFY` | `0` | VPN/방화벽 TLS 오류 시 |

---

## 7. 코드 업데이트 워크플로우

### 7-1. 로컬 → GitHub

```bash
git add .
git commit -m "변경 내용 요약"
git push origin master
```

### 7-2. GitHub → Replit 반영 및 재배포

Replit Shell에서:

```bash
git fetch origin master && git reset --hard origin/master && npm install && npm run build
```

그다음 Replit UI에서 **Deploy → Republish**

### 7-3. 배포 후 확인

1. Replit 배포 URL 접속
2. 로그인 (`admin` / `admin123` 또는 등록된 계정)
3. 대시보드 및 시간외근무 도구 동작 확인
4. `/overtime/*` 미인증 접근 차단 확인

---

## 8. HTML 도구 업데이트

루트의 원본 HTML 파일을 수정한 경우, 레거시 도구에 반영하는 절차입니다.

### 8-1. 원본 파일

- `시간외근무_일반근무.html`
- `시간외근무_유연근무.html`

### 8-2. 추출 및 public 반영

```bash
npm run extract-html
```

위 명령은 HTML에서 CSS/JS를 분리해 `src/legacy/regular`, `src/legacy/flexible`에 저장합니다.

**Windows (PowerShell):**

```powershell
Copy-Item "시간외근무_일반근무.html" "public/overtime/regular/index.html" -Force
Copy-Item "시간외근무_유연근무.html" "public/overtime/flexible/index.html" -Force
```

**macOS / Linux:**

```bash
cp "시간외근무_일반근무.html" public/overtime/regular/index.html
cp "시간외근무_유연근무.html" public/overtime/flexible/index.html
```

### 8-3. 커밋 및 배포

변경된 `src/legacy/`, `public/overtime/` 파일을 커밋한 뒤 [7. 코드 업데이트 워크플로우](#7-코드-업데이트-워크플로우)를 따릅니다.

---

## 9. 환경 변수 참조

| 변수 | 필수 | 로컬 | Replit | 설명 |
|------|:----:|:----:|:------:|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `.env.local` | Secrets | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | `.env.local` | Secrets | 서버 전용 Supabase 키 |
| `AUTH_SECRET` | ✅ | `.env.local` | Secrets | HMAC 세션 서명 키 |
| `SUPABASE_SSL_VERIFY` | ❌ | `.env.local` | Secrets | `0`이면 TLS 검증 생략 |
| `PORT` | ❌ | 자동 | Replit 설정 | 서버 포트 (기본 `3000`) |
| `NODE_ENV` | ❌ | 자동 | 자동 | `production` 시 secure 쿠키 |

---

## 10. 문제 해결

### Supabase 연결 실패 / TLS 오류

**증상**: `fetch failed`, `UNABLE_TO_VERIFY_LEAF_SIGNATURE` 등

**해결**:
1. `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 값 확인
2. 회사 VPN/방화벽 환경이면 `SUPABASE_SSL_VERIFY=0` 추가 후 서버 재시작
3. Supabase 프로젝트가 일시 중지(paused) 상태가 아닌지 확인

### 로그인 실패 (테이블 없음)

**증상**: "Supabase가 설정되지 않았습니다" 또는 DB 오류

**해결**:
1. `001_ens_users.sql`이 Supabase SQL Editor에서 실행됐는지 확인
2. 환경 변수가 올바른 프로젝트를 가리키는지 확인

### `/overtime/*` 접근 시 로그인 페이지로 이동

**정상 동작**입니다. 미들웨어(`src/middleware.ts`)가 `/overtime/` 경로에 인증을 요구합니다. 먼저 `/login`에서 로그인하세요.

### Replit 배포 후 Internal Server Error (500)

**증상**: 배포 URL(`*.replit.app`) 접속 시 모든 페이지에서 `Internal Server Error`

**원인 (흔한 순서)**:
1. Replit **Publishing(배포) Secrets** 미등록 — 에디터 Secrets와 배포 Secrets는 **별도**입니다
2. Replit이 자동 생성한 `artifacts/` 폴더가 Next.js 빌드/실행과 충돌
3. Turbopack 프로덕션 빌드 산출물이 Replit Cloud Run에서 불안정

**해결**:

1. Replit → **Publishing(Deploy)** → **Secrets** 탭에서 아래 3개 등록:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AUTH_SECRET`

2. Replit Shell에서 클린 빌드:

```bash
rm -rf artifacts .next node_modules
npm install
npm run build
```

3. **Deploy → Republish**

4. 배포 후 헬스체크 확인:

```
https://<your-app>.replit.app/api/health
```

정상 응답 예:

```json
{"ok":true,"nodeEnv":"production","supabaseConfigured":true,"authSecretConfigured":true}
```

`supabaseConfigured` 또는 `authSecretConfigured`가 `false`이면 Publishing Secrets를 다시 확인하세요.

### Replit 배포 후 502 / 앱 미기동

**해결**:
1. Replit Shell에서 `npm run build` 오류 여부 확인
2. Secrets 3종(`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`) 등록 확인
3. **Deploy → Republish** 재실행

### 빌드 실패

```bash
npm run lint
npm run build
```

터미널 오류 메시지를 확인하고 TypeScript/ESLint 오류를 수정한 뒤 다시 빌드합니다.

---

## npm 스크립트 요약

| 명령 | 용도 |
|------|------|
| `npm run dev` | 로컬 개발 서버 (hot reload) |
| `npm run build` | 프로덕션 빌드 (Replit용 webpack) |
| `npm run start` | 프로덕션 서버 실행 (`0.0.0.0`, `PORT` 자동) |
| `npm run lint` | ESLint 검사 |
| `npm run extract-html` | HTML → legacy CSS/JS 추출 |

---

## 관련 파일

| 경로 | 설명 |
|------|------|
| `.env.local.example` | 환경 변수 템플릿 |
| `.replit` | Replit 실행·배포 설정 |
| `scripts/prebuild.mjs` | Replit `artifacts/` 폴더 제거 |
| `scripts/start-production.mjs` | (구버전) PORT + 0.0.0.0 바인딩 — `npm start`가 `next start` 직접 사용 |
| `scripts/extract-html.mjs` | HTML 도구 분리 스크립트 |
| `supabase/migrations/001_ens_users.sql` | 사용자 테이블 DDL |
| `src/middleware.ts` | `/overtime/*` 인증 미들웨어 |
