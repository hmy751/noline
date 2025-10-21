# Noline Server

Express + Drizzle ORM + TypeScript 기반 여행 경비 관리 API 서버

## 🛠️ 기술 스택

- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Language**: TypeScript (ESM)
- **Build**: tsup (프로덕션), tsx (개발)
- **Validation**: Zod

## 📦 설치 및 실행

### 1. 환경 변수 설정

환경별 `.env` 파일을 생성하세요:

#### 개발 환경 (`.env.development`)

```bash
# Development Environment
NODE_ENV=development
PORT=3000
HOST=localhost

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/noline_dev

# JWT
JWT_SECRET=dev-secret-key-not-for-production
JWT_ISSUER=noline-api
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:8081
```

#### 프로덕션 환경 (`.env.production`)

```bash
# Production Environment
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@db.example.com:5432/noline_prod

# JWT
JWT_SECRET=CHANGE_THIS_IN_PRODUCTION
JWT_ISSUER=noline-api
JWT_EXPIRES_IN=7d

# CORS (프로덕션 도메인)
CORS_ORIGIN=https://yourdomain.com
```

**자동 로딩:**

- `pnpm dev` → `.env.development` 로드
- `pnpm start` → `.env.production` 로드

**빠른 설정:**

```bash
cd apps/server

# 개발 환경 파일 생성
cat > .env.development << 'EOF'
NODE_ENV=development
PORT=3000
HOST=localhost
DATABASE_URL=postgresql://postgres:password@localhost:5432/noline_dev
JWT_SECRET=dev-secret-key-not-for-production
JWT_ISSUER=noline-api
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8081
EOF
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 데이터베이스 설정

PostgreSQL이 실행 중이어야 합니다.

```bash
# 마이그레이션 파일 생성
pnpm db:generate

# 데이터베이스에 스키마 적용
pnpm db:push

# Drizzle Studio 실행 (선택 사항)
pnpm db:studio
```

### 4. 서버 실행

```bash
# 개발 모드 (hot reload)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

## 📁 프로젝트 구조

```
apps/server/
├── src/
│   ├── config/          # 환경 변수 설정
│   │   └── index.ts
│   ├── db/              # Drizzle ORM
│   │   ├── schema.ts    # 데이터베이스 스키마
│   │   └── index.ts     # DB 인스턴스
│   ├── middleware/      # Express 미들웨어
│   │   ├── errorHandler.ts
│   │   └── notFound.ts
│   ├── routes/          # API 라우트
│   │   └── index.ts
│   ├── app.ts           # Express 앱 설정
│   └── index.ts         # 서버 진입점
├── drizzle.config.ts    # Drizzle 설정
├── tsconfig.json        # TypeScript 설정
├── tsup.config.ts       # 빌드 설정
└── package.json
```

## 🗄️ 데이터베이스 스키마

### Users

- `id`: 사용자 ID (Primary Key)
- `email`: 이메일 (Unique)
- `password`: 비밀번호 (해시)
- `name`: 이름
- `profileImageUrl`: 프로필 이미지 URL

### Trips

- `id`: 여행 ID (Primary Key)
- `userId`: 사용자 ID (Foreign Key)
- `name`: 여행 이름
- `destination`: 목적지
- `startDate`: 시작일
- `endDate`: 종료일

### Schedules

- `id`: 일정 ID (Primary Key)
- `tripId`: 여행 ID (Foreign Key)
- `title`: 일정 제목
- `location`: 위치
- `startTime`: 시작 시간
- `endTime`: 종료 시간
- `order`: 순서
- `memo`: 메모

### Expenses

- `id`: 경비 ID (Primary Key)
- `tripId`: 여행 ID (Foreign Key)
- `scheduleId`: 일정 ID (Foreign Key, nullable)
- `title`: 경비 제목
- `amount`: 금액
- `currency`: 통화
- `category`: 카테고리 (Enum)
- `date`: 날짜
- `memo`: 메모
- `isSynced`: 동기화 상태

## 🔌 API 엔드포인트

### Health Check

```
GET /api/health
```

**Response:**

```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2025-10-21T..."
}
```

### API Info

```
GET /api
```

**Response:**

```json
{
  "name": "Noline API",
  "version": "1.0.0",
  "description": "Travel expense tracking API"
}
```

## 🚀 NPM Scripts

| 명령어             | 설명                       |
| ------------------ | -------------------------- |
| `pnpm dev`         | 개발 서버 실행 (tsx watch) |
| `pnpm build`       | 프로덕션 빌드 (tsup)       |
| `pnpm start`       | 프로덕션 서버 실행         |
| `pnpm typecheck`   | 타입 체크                  |
| `pnpm clean`       | 빌드 파일 삭제             |
| `pnpm db:generate` | 마이그레이션 파일 생성     |
| `pnpm db:push`     | 데이터베이스에 스키마 적용 |
| `pnpm db:studio`   | Drizzle Studio 실행        |

## 🔧 개발 가이드

### 새로운 라우트 추가

1. `src/routes/` 에 라우터 파일 생성
2. `src/routes/index.ts` 에서 라우터 import 및 등록

### 데이터베이스 스키마 변경

1. `src/db/schema.ts` 수정
2. `pnpm db:generate` 실행 (마이그레이션 파일 생성)
3. `pnpm db:push` 실행 (스키마 적용)

### 환경 변수 추가

1. `.env` 파일에 변수 추가
2. `src/config/index.ts` 에서 타입 정의 및 로드

## 📝 코딩 규칙

- **모든 async 함수는 try-catch 필수**
- **Zod로 요청 검증 필수**
- **Early Return 패턴 사용**
- **res 후에는 명시적 return**
- **민감 정보 로깅 금지**

자세한 내용은 프로젝트 rules 참고:

- `03-backend-express-guide.md`
- `05-typescript-guide.md`
- `07-error-handling.md`

## 🐛 문제 해결

### Database connection error

PostgreSQL이 실행 중인지 확인하세요:

```bash
# macOS (Homebrew)
brew services start postgresql@14

# Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

### Port already in use

`.env` 파일에서 PORT를 변경하세요.

## 📄 라이센스

ISC
