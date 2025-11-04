# 🧭 Noline Project Guide

> **Noline**: 네트워크가 없어도 여행은 계속된다 - Local-First 여행 관리 앱

## 📌 Project Identity

**Noline**은 오프라인 환경에서도 완벽하게 작동하는 여행 관리 모바일 앱입니다.

- **Local-First Architecture**: 모든 데이터는 로컬 SQLite가 진실의 원천
- **Echo Protocol**: 클라이언트가 ID (ULID) 생성하고 서버는 그대로 수용
- **@repo/schema**: 클라이언트-서버 공유 타입 계약 (Source of Truth)
- **Offline Subscription**: 여행 기간 동안 자동 동기화

## 🗺 Navigation Map

```
📁 Project Structure & Guides
├── 📄 CLAUDE.md (현재 파일) - 프로젝트 전체 가이드
├── 📁 apps/
│   ├── client/
│   │   └── 📄 CLAUDE.md - React Native 클라이언트 가이드
│   └── server/
│       └── 📄 CLAUDE.md - Express 서버 API 가이드
└── 📁 packages/
    └── ui/
        └── 📄 CLAUDE.md - UI 컴포넌트 라이브러리 가이드
```

## 🎯 Development Principles

### 1. 개발 워크플로우

- **[사고 단계]** 요구사항 받으면 먼저 단계별 의사코드(pseudocode) 작성
- **[확인 단계]** 수립된 계획에 대해 사용자 확인 요청
- **[실행 단계]** 확인된 계획에 따라 코드 구현
- **[유연성]** cursor rules와 충돌시 → 이유 설명 → 대안 제시 → 확인 후 진행

### 2. 구현 레벨 (MVP vs Production)

#### 🟢 MVP Level (기본값)

- **목표**: 빠른 구현, 작동하는 코드
- **원칙**: 기존 구조 있으면 따르고, 없으면 유연하게
- **사용시**: 사용자가 별도 명시 없을 때

#### 🔴 Production Level

- **목표**: 완전한 베스트 프랙티스, 확장 가능한 코드
- **원칙**: 없으면 만들어서라도 완벽하게
- **사용시**: "production 레벨로" 명시할 때

### 3. 코드 품질

- **완성도**: TODO 없이 100% 구현
- **가독성**: 명확하고 이해하기 쉬운 코드
- **확장성**: 재사용성과 유지보수성 고려
- **타입 안전성**: any 사용 금지, 타입 가드 활용

### 4. 커뮤니케이션

- **간결함**: 핵심만 전달
- **정직함**: 모르는 것은 명확히 표현
- **유연성**: 더 나은 방법이 있다면 제안

## 🏗 Architecture Decisions

| 영역          | 현재 선택           | 이유                       | 대안                 |
| ------------- | ------------------- | -------------------------- | -------------------- |
| **ID 생성**   | ULID@Client         | 오프라인 작동, 시간순 정렬 | UUID, 서버생성       |
| **로컬 DB**   | SQLite + Drizzle    | React Native 최적화        | Realm, WatermelonDB  |
| **동기화**    | sync_queue (Outbox) | 트랜잭션 보장, MVP 단순성  | CRDT, Event Sourcing |
| **충돌 해결** | Last-Write-Wins     | 초기 버전 단순성           | Vector Clock, CRDT   |
| **상태 관리** | React Query         | 서버 상태 관리 최적화      | Zustand, Redux       |

## 🛠 Tech Stack

### Frontend (React Native + Expo)

```typescript
// 클라이언트 핵심 스택
- React Native + Expo (SDK 51)
- TypeScript
- React Query (서버 상태)
- Drizzle ORM + SQLite (로컬 DB)
- React Hook Form + Zod (폼 검증)
- Expo Router (파일 기반 라우팅)
```

### Backend (Node.js + Express)

```typescript
// 서버 핵심 스택
- Express + TypeScript
- PostgreSQL (Neon)
- Drizzle ORM
- Zod (검증)
```

### Shared Packages

```typescript
// 공유 패키지 - 모노레포 구조
- @repo/schema - Zod 스키마 (Source of Truth) ⭐
  └── 클라이언트-서버 공유 타입 계약
  └── 런타임 검증 + 타입 안전성
  └── 구조:
      ├── entities/   - 도메인 모델 (강제 계약)
      ├── requests/   - API 요청 (확장 가능)
      ├── responses/  - API 응답 (확장 가능)
      ├── sync/       - 동기화 관련 스키마
      └── shared/     - 공통 필드, Enum, 유틸
- @repo/ui - shadcn/ui 기반 컴포넌트
  └── 순수 UI, 비즈니스 로직 없음
- @repo/db - Prisma 스키마
  └── 데이터베이스 스키마 정의
```

## 📋 Quick Commands

```bash
# 개발 환경
pnpm dev          # 전체 개발 서버 실행
pnpm dev:client   # 클라이언트만 실행
pnpm dev:server   # 서버만 실행

# 데이터베이스
pnpm db:push      # DB 스키마 푸시
pnpm db:studio    # Prisma Studio 실행
pnpm db:generate  # Prisma Client 생성

# 빌드 & 배포
pnpm build        # 전체 빌드
pnpm typecheck    # 타입 체크
```

## 🕐 Time Management

### 핵심 원칙: ISO 8601 with Timezone

모든 시간 데이터는 **ISO 8601 형식**으로 통일:

- 형식: `"2024-03-15T14:30:00.000Z"`
- SQLite: TEXT 타입으로 저장
- PostgreSQL: TIMESTAMPTZ 타입
- 장점: 타임존 정보 포함, JSON 직렬화 안전, Zod 검증 가능

## 📦 @repo/schema 계약 레벨

### 계약(Contract) 관점

| 레벨 | 스키마 타입 | 자유도 | 역할 |
|------|------------|--------|------|
| **필수** | Entity | ❌ 변경 불가 | 도메인 모델, 모두가 준수 |
| **기본** | Request/Response | ✅ 확장 가능 | 기본 구조 제공, 필요시 extend |
| **내부** | 각 앱 고유 스키마 | ✅ 완전 자유 | sync_queue 등 앱별 특화 |

### 사용 예시

```typescript
// @repo/schema에서 import
import { tripEntity, baseTripRequest } from '@repo/schema';

// Entity는 그대로 사용 (계약 준수)
export { tripEntity };

// Request는 필요시 확장
export const createTripRequest = baseTripRequest.extend({
  localField: z.string(), // 앱 특화 필드 추가
});
```

## 📋 개발 가이드라인

### 권장 패턴 (현재 아키텍처 기준)

| 영역 | 권장 방식 | 이유 |
|------|-----------|------|
| **트랜잭션** | `withTransaction()` 사용 | DB와 sync_queue 원자성 보장 |
| **ID 생성** | 클라이언트에서 ULID | 오프라인 작동 |
| **데이터 조회** | React Query + 로컬 DB | 오프라인 우선 |
| **검증** | `@repo/schema` Zod 스키마 | 타입 안전성 |
| **캐시 키** | Query Key Factory 패턴 | 일관성 |
| **시간 형식** | ISO 8601 | 표준화 |
| **삭제** | Soft Delete (`deletedAt`) | 복구 가능 |
| **버전 관리** | Version 필드 | 충돌 해결 대비 |

### 주의 사항

| 패턴 | 현재 제약 | 이유 |
|------|-----------|------|
| **UI 업데이트** | 서버 응답 대기 피함 | 로컬 우선 UX |
| **API 호출** | sync_queue 경유 | 오프라인 보장 |
| **ID 생성** | 서버 생성 피함 | Echo Protocol |
| **타입 처리** | `as` 대신 타입 가드 | 타입 안전성 |
| **컴포넌트** | 외부 margin 피함 | 재사용성 |

## 🔍 Implementation Status

### ✅ 완료된 기능

- [x] Local-First 아키텍처 구현
- [x] Echo Protocol (클라이언트 ID 생성)
- [x] Push 동기화 (로컬 → 서버)
- [x] 여행/일정/경비 CRUD
- [x] 오프라인 작동

### 🚧 진행중

- [ ] Pull 동기화 (서버 → 로컬)
- [ ] 충돌 해결 고도화
- [ ] 오프라인 구독 시스템

### 📅 예정

- [ ] 실시간 협업
- [ ] 영수증 OCR
- [ ] 푸시 알림

## 📚 Related Documents

- [PRD](/Users/hammyeong-yeon/Desktop/noline/.cursor/rules/PRD.md) - 제품 기획서
- [Local Architecture Guide](/Users/hammyeong-yeon/Desktop/noline/.cursor/rules/LOCAL_ARCHITECTURE_GUIDE.md) - Local-First 상세 가이드
- [Time Architecture Guide](/Users/hammyeong-yeon/Desktop/noline/.cursor/rules/TIME_ARCHITECTURE_GUIDE.md) - 시간 관리 가이드

## 🤝 Development Guidelines

이 문서는 AI 어시스턴트가 프로젝트를 이해하고 일관된 코드를 생성하도록 돕는 가이드입니다.

- cursor rules는 가이드이며, 더 나은 방법이 있다면 제안해주세요
- 불확실한 부분은 추측하지 말고 명확히 질문해주세요
- 코드 작성 전 계획을 먼저 공유하고 확인받아주세요
