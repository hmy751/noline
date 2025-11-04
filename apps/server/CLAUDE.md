# 🚀 Noline Server Guide

> Express + TypeScript 백엔드 서버 API 구현 가이드

## 📚 Quick Navigation

**프로젝트 이해 (처음 읽을 때):**

- [Root CLAUDE.md](../../CLAUDE.md) - 프로젝트 정체성, 핵심 원칙, MVP vs Production 레벨
- [Schema CLAUDE.md](../../packages/schema/CLAUDE.md) - @repo/schema 타입 계약
- [Local Architecture](../../.claude/local-architecture.md) - Echo Protocol, sync_queue 상세

**서버 구현시 참조:**

- [API & Data Guide](../../.claude/api-data.md) - API 레이어 패턴
- [Error Handling](../../.claude/error-handling.md) - 에러 처리 패턴
- [TypeScript Guide](../../.claude/typescript.md) - TypeScript 규칙

## 🎯 Server-Specific Patterns

이 문서는 **서버 구현에 특화된 패턴**을 다룹니다. Echo Protocol과 @repo/schema는 Root/Schema CLAUDE.md를 참조하세요.

## 📁 Project Structure

```
apps/server/
├── src/
│   ├── index.ts              # Express 앱 진입점
│   ├── routes/               # API 라우트
│   │   ├── trips.ts
│   │   ├── expenses.ts
│   │   ├── schedules.ts
│   │   └── sync.ts          # 동기화 엔드포인트
│   ├── middleware/           # Express 미들웨어
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── db/                   # 데이터베이스
│   │   ├── index.ts         # Drizzle 인스턴스
│   │   └── schema/          # PostgreSQL 스키마
│   └── utils/                # 유틸리티
├── .env                      # 환경 변수
└── drizzle.config.ts        # Drizzle 설정
```

## 🕐 Time Management

> **상세 가이드**: [time.md](../../.claude/time.md)

**서버 핵심:**

- **PostgreSQL**: `timestamp with timezone` 타입 사용
- **Drizzle 옵션**: `{ withTimezone: true }`
- **자동 변환**: ISO 8601 문자열 ↔ PostgreSQL TIMESTAMPTZ

```typescript
// Drizzle 스키마 정의
export const trips = pgTable('trips', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  // ...
});
```

## 🗄 Database Schema (PostgreSQL)

### 테이블 구조

**Echo Protocol 필드 (모든 테이블):**

- `id`: text (ULID, 클라이언트 생성)
- `updatedAt`: timestamp with timezone
- `deletedAt`: timestamp with timezone (Soft Delete)
- `version`: integer (충돌 해결용)

**인덱스 전략:**

- 동기화용: `updated_at WHERE deleted_at IS NULL`
- 조회용: 외래키 필드들

## 🔌 API Endpoints

### 기본 CRUD 패턴

| Method | Path                  | 동작                      |
| ------ | --------------------- | ------------------------- |
| POST   | `/api/{resource}`     | 생성 (클라이언트 ID 수용) |
| GET    | `/api/{resource}/:id` | 조회                      |
| PUT    | `/api/{resource}/:id` | 수정 (version 증가)       |
| DELETE | `/api/{resource}/:id` | Soft Delete               |

### 동기화 엔드포인트

| Method | Path             | 동작                            |
| ------ | ---------------- | ------------------------------- |
| GET    | `/api/sync/pull` | lastSyncedAt 이후 변경사항 조회 |
| POST   | `/api/sync/push` | 배치 작업 처리 (트랜잭션)       |

## 🔐 Authentication & Authorization

### JWT 기반 인증 (구현 예정)

```typescript
// middleware/auth.ts
export async function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden' });
  }
}
```

## 🚨 Error Handling

### 에러 처리 계층화

**MVP Level:**

- 기본 try-catch
- console.error 로깅
- 500 에러 응답

**Production Level:**

- 커스텀 에러 클래스 체계 (AppError 상속)
- 에러 타입별 처리 (ValidationError, NotFoundError, ConflictError)
- Winston 로깅
- Sentry 연동

### 글로벌 에러 핸들러

**처리 순서:**

1. Zod 검증 에러 → 400 Bad Request
2. DB 제약 조건 위반 → 409 Conflict
3. 커스텀 에러 → 정의된 상태 코드
4. 기타 → 500 Internal Server Error

**에러 응답 형식:**

```json
{
  "error": "에러 타입",
  "message": "상세 메시지",
  "timestamp": "ISO 8601"
}
```

## 📋 개발 가이드라인

### 권장 패턴

- **ID 처리**: 클라이언트 ID 그대로 수용 (Echo Protocol)
- **트랜잭션**: 여러 테이블 작업시 트랜잭션 사용
- **삭제**: Soft Delete (`deletedAt` 필드)
- **검증**: @repo/schema로 입력 검증

### 주의 사항

- **ID 생성**: 서버에서 ID 생성 피함
- **삭제**: Hard Delete 피함 (데이터 복구 불가)
- **블로킹**: 동기 작업으로 서버 블로킹 피함

## 📊 Performance Optimization

### 성능 최적화 전략

1. **연결 풀**: 적절한 크기 설정 (기본 20)
2. **쿼리 최적화**: 필요한 필드만 선택, 배치 작업
3. **캐싱**: Redis 도입 검토 (구현 예정)
4. **인덱스**: updated_at, 외래키 필드

## 🔍 Monitoring & Logging

### 로깅 설정

```typescript
// utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 사용 예시
logger.info('Trip created', { tripId: id, userId });
logger.error('Sync failed', { error: err.message });
```

### 헬스 체크

```typescript
// GET /health
app.get('/health', async (req, res) => {
  try {
    // DB 연결 확인
    await db
      .select({ count: sql`1` })
      .from(trips)
      .limit(1);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

## 🚀 Deployment

### 환경 변수

```bash
# .env.example
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-app.com
```

### Docker 설정

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## 📚 Related Documents

**다른 Workspace:**

- [Client CLAUDE.md](../client/CLAUDE.md) - 클라이언트 구현 가이드
- [Schema CLAUDE.md](../../packages/schema/CLAUDE.md) - 타입 계약

**상세 구현 가이드:**

- [Local Architecture](../../.claude/local-architecture.md) - Echo Protocol, sync 엔드포인트 상세
- [API & Data Guide](../../.claude/api-data.md) - API 레이어 패턴
- [Error Handling](../../.claude/error-handling.md) - 에러 처리 시스템
