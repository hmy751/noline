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
│
├── 📁 apps/
│   ├── client/
│   │   └── 📄 CLAUDE.md - React Native 클라이언트 가이드
│   └── server/
│       └── 📄 CLAUDE.md - Express 서버 API 가이드
│
├── 📁 packages/
│   ├── schema/
│   │   └── 📄 CLAUDE.md - @repo/schema 타입 계약 가이드
│   └── ui/
│       └── 📄 CLAUDE.md - UI 컴포넌트 라이브러리 가이드
│
└── 📁 .claude/
    └── 📄 README.md - 상세 구현 가이드 인덱스
```

### 📖 Documentation Navigation

**CLAUDE.md 파일들** (Context - 빠른 참조):

| 파일                                            | 역할                       | 언제 읽기          |
| ----------------------------------------------- | -------------------------- | ------------------ |
| [Root CLAUDE.md](./CLAUDE.md)                   | 프로젝트 정체성, 핵심 원칙 | 🔥 제일 먼저       |
| [Client CLAUDE.md](./apps/client/CLAUDE.md)     | React Native 패턴          | Client 작업시      |
| [Server CLAUDE.md](./apps/server/CLAUDE.md)     | Express API 패턴           | Server 작업시      |
| [Schema CLAUDE.md](./packages/schema/CLAUDE.md) | @repo/schema 계약          | Entity 추가/변경시 |
| [UI CLAUDE.md](./packages/ui/CLAUDE.md)         | 컴포넌트 철학              | UI 작업시          |

**.claude/ 파일들** (Detail - 상세 가이드):

핵심 가이드 (core/):

- [typescript.md](./.claude/core/typescript.md) - TypeScript 전체 규칙
- [architecture.md](./.claude/core/architecture.md) - FSD 상세 구조
- [local-architecture.md](./.claude/core/local-architecture.md) - Local-First 완전 가이드
- [time.md](./.claude/core/time.md) - 시간 처리 완전 가이드
- [api-data.md](./.claude/core/api-data.md) - API 레이어 패턴
- [components.md](./.claude/core/components.md) - 컴포넌트 작성 규칙
- [error-handling.md](./.claude/core/error-handling.md) - 에러 처리 패턴

기능별 가이드 (features/):

- [features/activation-system.md](./.claude/features/activation-system.md) - 활성화 시스템 (오프라인 준비)
- [features/currency.md](./.claude/features/currency.md) - 통화 처리
- [features/form.md](./.claude/features/form.md) - 폼 패턴
- [features/local-first-impl.md](./.claude/features/local-first-impl.md) - Local-First 구현

참조 문서 (references/):

- [references/prd.md](./.claude/references/prd.md) - 제품 기획서
- [references/wireframe.md](./.claude/references/wireframe.md) - 디자인 스펙
- [references/images.md](./.claude/references/images.md) - 이미지 최적화

**전체 인덱스**: [.claude/README.md](./.claude/README.md)

### 🎯 태스크별 가이드

**"새 Entity 추가"**:

1. [Schema CLAUDE.md](./packages/schema/CLAUDE.md) - Entity 정의
2. [Client CLAUDE.md](./apps/client/CLAUDE.md) - 클라이언트 구현
3. [local-architecture.md](./.claude/core/local-architecture.md) - sync_queue 패턴

**"UI 컴포넌트 만들기"**:

1. [UI CLAUDE.md](./packages/ui/CLAUDE.md) - 컴포넌트 철학
2. [components.md](./.claude/core/components.md) - 상세 작성 규칙
3. [typescript.md](./.claude/core/typescript.md) - TypeScript 패턴

**"API 엔드포인트 추가"**:

1. [Server CLAUDE.md](./apps/server/CLAUDE.md) - API 구조
2. [Schema CLAUDE.md](./packages/schema/CLAUDE.md) - Request/Response 정의
3. [api-data.md](./.claude/core/api-data.md) - API 레이어 패턴

**"Sync 이슈 디버깅"**:

1. [local-architecture.md](./.claude/core/local-architecture.md) - 전체 흐름
2. [Client CLAUDE.md](./apps/client/CLAUDE.md) - withTransaction 패턴
3. [Server CLAUDE.md](./apps/server/CLAUDE.md) - sync 엔드포인트

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

| 영역              | 현재 선택                  | 이유                         | 대안                 |
| ----------------- | -------------------------- | ---------------------------- | -------------------- |
| **ID 생성**       | ULID@Client                | 오프라인 작동, 시간순 정렬   | UUID, 서버생성       |
| **로컬 DB**       | SQLite + Drizzle           | React Native 최적화          | Realm, WatermelonDB  |
| **동기화**        | sync_queue (Outbox)        | 트랜잭션 보장, MVP 단순성    | CRDT, Event Sourcing |
| **충돌 해결**     | Last-Write-Wins            | 초기 버전 단순성             | Vector Clock, CRDT   |
| **상태 관리**     | React Query                | 서버 상태 관리 최적화        | Zustand, Redux       |
| **활성화 시스템** | 선택적 활성화 (Activation) | 오프라인 지도 저장 공간 효율 | 전체 로컬, 개수 제한 |

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
  └── **정책**: schema만 export, 타입은 z.infer 사용
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

## ✅ 완료된 기능 (Completed Features)

### Offline 준비 시스템 (Offline-Prep)

**상태**: 핵심 구현 완료 (2025-11-16 ~ 2025-11-19, 22개 커밋)

**목적**: 오프라인 지도 통합을 위한 선택적 데이터 동기화

**핵심 철학**:

> "활성화 = 오프라인 보험, 비활성 = 온라인 전용"

**주요 특징**:

- **활성화된 여행**: 완전 오프라인 (Local-First 유지) - 최대 200MB
- **비활성 여행**: 온라인 전용 (Server-First) - 모든 Trip 메타데이터는 로컬
- **저장 공간 효율화**: 동시에 1개 여행만 활성화 가능
- **자동 관리**: 여행 종료 + 7일 후 자동 비활성화 (예정)

**아키텍처**:

```text
Entity Layer → Offline-Prep Router (4개 함수)
                ↓
    ┌───────────┴───────────┐
    │                       │
[활성화된 여행]        [비활성 여행]
    ↓                       ↓
Local SQLite          Remote Server
    ↓
Sync Engine (백그라운드)
```

**완료된 작업**:

- ✅ tripActivations 테이블 생성 (Single Source of Truth)
- ✅ Router 4개 함수 분리 (routeTripQuery/Mutation, routeChildQuery/Mutation)
- ✅ offline-prep 서비스 레이어 (router, metadata, errors)
- ✅ Entity Hooks 통합 (Trip, Schedule, Expense)
- ✅ UI 컴포넌트 (ActivationBadge, ProgressDrawer, TripCard)
- ✅ 활성화/비활성화 기능 (useActivateTrip, useDeactivateTrip)
- ✅ 오프라인 지도 연동
- ✅ 디버그 도구 추가
- ✅ 통화 자동 설정 (ISO 국가 코드 기반)
- ✅ trips.activated 필드 제거 (데이터 정합성 보장)

**아키텍처 확정 사항**:

- tripActivations 테이블을 활성화 상태의 단일 진실 공급원으로 사용
- Trip 작업 vs Child(Schedule/Expense) 작업의 의미적 분리
- Service 레이어 책임 명확화 (getTripActivationStatusDetail)

**남은 작업**:

- [ ] Pull 동기화 고도화 (현재 activate 시 1회만)
- [ ] 자동 비활성화 Background Job (여행 종료 + 7일)
- [ ] 활성화 진행률 실시간 업데이트
- [ ] 오프라인 지도 다운로드 재시도 로직

**관련 문서**:

- [Session: 아키텍처 설계](./.claude/sessions/2025-11-06-activation-architecture-design.md) - 설계 논의 전체 과정
- [Feature Guide: 활성화 시스템](./.claude/features/activation-system.md) - 구현 가이드
- [local-architecture.md](./.claude/core/local-architecture.md) - Local-First 가이드

---

## 🚧 작업 예정 (Planned Features)

---

## 📦 @repo/schema 계약 레벨

### 계약(Contract) 관점

| 레벨     | 스키마 타입       | 자유도       | 역할                          |
| -------- | ----------------- | ------------ | ----------------------------- |
| **필수** | Entity            | ❌ 변경 불가 | 도메인 모델, 모두가 준수      |
| **기본** | Request/Response  | ✅ 확장 가능 | 기본 구조 제공, 필요시 extend |
| **내부** | 각 앱 고유 스키마 | ✅ 완전 자유 | sync_queue 등 앱별 특화       |

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

### @repo/schema 사용 규칙

**정책: schema만 export, 타입은 z.infer 사용**

```typescript
// ❌ 잘못된 방법
import { type User } from '@repo/schema/entities/user';

// ✅ 올바른 방법
import { userEntity } from '@repo/schema/entities/user';
import { z } from 'zod';

type User = z.infer<typeof userEntity>;
```

**이유**:

- Schema가 Single Source of Truth (유일한 타입의 출처)
- Schema와 타입의 완벽한 동기화 보장
- 런타임 검증과 타입이 항상 일치

**적용 범위**: entities, requests, responses, sync 모든 스키마

### 권장 패턴 (현재 아키텍처 기준)

| 영역            | 권장 방식                 | 이유                        |
| --------------- | ------------------------- | --------------------------- |
| **트랜잭션**    | `withTransaction()` 사용  | DB와 sync_queue 원자성 보장 |
| **ID 생성**     | 클라이언트에서 ULID       | 오프라인 작동               |
| **데이터 조회** | React Query + 로컬 DB     | 오프라인 우선               |
| **검증**        | `@repo/schema` Zod 스키마 | 타입 안전성                 |
| **캐시 키**     | Query Key Factory 패턴    | 일관성                      |
| **시간 형식**   | ISO 8601                  | 표준화                      |
| **삭제**        | Soft Delete (`deletedAt`) | 복구 가능                   |
| **버전 관리**   | Version 필드              | 충돌 해결 대비              |

### 주의 사항

| 패턴            | 현재 제약           | 이유          |
| --------------- | ------------------- | ------------- |
| **UI 업데이트** | 서버 응답 대기 피함 | 로컬 우선 UX  |
| **API 호출**    | sync_queue 경유     | 오프라인 보장 |
| **ID 생성**     | 서버 생성 피함      | Echo Protocol |
| **타입 처리**   | `as` 대신 타입 가드 | 타입 안전성   |
| **컴포넌트**    | 외부 margin 피함    | 재사용성      |

## 🔍 Implementation Status

### ✅ 완료된 기능

- [x] Local-First 아키텍처 구현
- [x] Echo Protocol (클라이언트 ID 생성)
- [x] Push 동기화 (로컬 → 서버)
- [x] 여행/일정/경비 CRUD
- [x] 오프라인 작동
- [x] 오프라인 활성화 시스템 (핵심 구현 완료)
- [x] Pull 동기화 (activate 시 1회)

### 🚧 진행중

- [ ] Pull 동기화 고도화 (백그라운드 자동 동기화)
- [ ] 충돌 해결 고도화
- [ ] 자동 비활성화 Background Job

### 📅 예정

- [ ] 실시간 협업
- [ ] 영수증 OCR
- [ ] 푸시 알림

## 📚 Related Documents

### Core Architecture

- [Local Architecture Guide](./.claude/core/local-architecture.md) - Local-First 완전 가이드
- [Time Architecture Guide](./.claude/core/time.md) - 시간 관리 완전 가이드
- [FSD Architecture](./.claude/core/architecture.md) - 프로젝트 구조 상세

### Implementation Guides

- [TypeScript Guide](./.claude/core/typescript.md) - TypeScript 규칙
- [API & Data Guide](./.claude/core/api-data.md) - API 레이어 패턴
- [Components Guide](./.claude/core/components.md) - 컴포넌트 작성 규칙
- [Error Handling](./.claude/core/error-handling.md) - 에러 처리 패턴

### Feature Guides

- [Activation System](./.claude/features/activation-system.md) - 오프라인 활성화 시스템 (선택적 동기화)
- [Currency Policy](./.claude/features/currency.md) - 통화 처리 정책
- [Form Patterns](./.claude/features/form.md) - 폼 구현 패턴
- [Local-First Implementation](./.claude/features/local-first-impl.md) - Local-First 구현 디테일

### References

- [PRD](./.claude/references/prd.md) - 제품 기획서
- [Wireframe](./.claude/references/wireframe.md) - 디자인 스펙
- [Image Best Practices](./.claude/references/images.md) - 이미지 최적화

### Complete Index

- [.claude/README.md](./.claude/README.md) - 전체 가이드 인덱스 및 태스크별 맵

## 🤝 Development Guidelines

이 문서는 AI 어시스턴트가 프로젝트를 이해하고 일관된 코드를 생성하도록 돕는 가이드입니다.

- cursor rules는 가이드이며, 더 나은 방법이 있다면 제안해주세요
- 불확실한 부분은 추측하지 말고 명확히 질문해주세요
- 코드 작성 전 계획을 먼저 공유하고 확인받아주세요
