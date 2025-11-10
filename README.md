# Noline - 오프라인 우선 여행 관리 앱

<div align="center">

**"네트워크가 없어도 여행은 계속된다"**

불안정한 네트워크 환경에서도 완벽하게 작동하는 Local-First 여행 관리 모바일 애플리케이션

</div>

---

## 📖 목차

- [프로젝트 소개](#-프로젝트-소개)
- [핵심 가치](#-핵심-가치)
- [주요 기능](#-주요-기능)
- [기술 스택](#️-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [개발 가이드](#-개발-가이드)
- [아키텍처](#-아키텍처)

---

## 🌟 프로젝트 소개

**Noline**은 **No + Offline**을 결합한 이름으로, 해외 여행 중 불안정한 네트워크 환경에서도 안정적으로 여행 일정과 경비를 관리할 수 있는 React Native 기반 모바일 애플리케이션입니다.

### 해결하는 문제

1. **불안정한 네트워크 환경**: 해외에서 로밍 비용 부담, WiFi 부재로 인한 앱 사용 불가
2. **데이터 손실**: 네트워크 끊김 중 입력한 데이터가 사라지는 문제
3. **복잡한 여행 관리**: 일정, 경비, 지도를 여러 앱에서 따로 관리하는 불편함
4. **실시간 정보 접근**: 인터넷 없이는 다음 일정이나 경비 현황을 확인할 수 없음

### 차별점

| 기존 여행 앱                 | Noline                              |
| ---------------------------- | ----------------------------------- |
| 온라인 필수                  | **오프라인 우선**                   |
| 서버 응답 대기               | **즉각적인 UI 반응** (로컬 DB)      |
| 네트워크 끊김 시 데이터 손실 | **데이터 손실 0%** (Outbox Pattern) |
| 단순 캐싱                    | **활성화 기반 자동 동기화**         |
| UUID (서버 생성)             | **ULID** (클라이언트 생성)          |

---

## 💎 핵심 가치

### 1. **완전한 Local-First 경험**

- 모든 데이터는 로컬 SQLite DB가 **Single Source of Truth**
- UI는 서버를 전혀 알지 못하며, 오직 로컬 DB만 조회
- 네트워크 상태와 무관하게 즉각적인 반응성 보장

### 2. **오프라인 활성화 시스템**

- 단순 "다운로드"가 아닌 **"여행 활성화"** 개념 도입
- 여행 기간 동안 자동으로 서버에서 최신 데이터 Pull
- 한번 설정하면 여행 내내 자동으로 관리

### 3. **견고한 동기화 메커니즘**

- **Outbox Pattern**: 데이터 변경과 sync_queue를 원자적 트랜잭션으로 묶음
- **Axios Interceptor**: 네트워크 불안정 시 자동 재시도 (Exponential Backoff)
- **Last-Write-Wins**: 단순하고 안정적인 충돌 해결
- **Version 필드**: 향후 정교한 충돌 해결 로직으로 업그레이드 가능

### 4. **똑똑한 경비 관리**

- 일정별, 날짜별 경비 자동 분류
- 오프라인에서도 실시간 총 경비 현황 확인
- 영수증 사진 OCR 자동 금액 인식 (향후)

---

## ✨ 주요 기능

### 📍 여행 관리 (Trips)

- 여행 생성 및 관리 (목적지, 기간 설정)
- 여행 활성화 시스템 (자동 동기화)
- 여행별 일정/경비 그룹화
- 오프라인 완벽 지원

### 📅 일정 관리 (Schedules)

- 날짜별 상세 일정 생성 (제목, 시간, 장소)
- 지도 뷰와 리스트 뷰 전환
- 위도/경도 기반 위치 정보 저장
- 일정 순서 자동 정렬

### 💰 경비 관리 (Expenses)

- 경비 기록 (금액, 카테고리, 메모)
- 8가지 카테고리: 🍽️식비, 🚌교통, 🏨숙박, 🎫관광, 🛍️쇼핑, 💊의료, 📱통신, 🎉기타
- 날짜별 경비 그룹화 및 합계
- 오프라인 경비 추가 즉시 반영

### 🔄 오프라인 동기화

- 백그라운드 자동 동기화 (Push/Pull)
- 수동 동기화 (Pull-to-Refresh)
- 네트워크 상태 실시간 표시 (🟢온라인 / 🟡불안정 / 🔴오프라인)
- sync_queue 기반 데이터 손실 방지

---

## 🛠️ 기술 스택

### Frontend (React Native)

| 기술                                             | 용도                    | 버전   |
| ------------------------------------------------ | ----------------------- | ------ |
| [React Native](https://reactnative.dev/)         | 크로스 플랫폼 모바일 앱 | 0.74.5 |
| [Expo](https://expo.dev/)                        | 개발 및 빌드 환경       | ~51.0  |
| [TypeScript](https://www.typescriptlang.org/)    | 타입 안전성             | ~5.3   |
| [Expo Router](https://expo.github.io/router/)    | File-based 라우팅       | ~3.5   |
| [React Query](https://tanstack.com/query/latest) | 서버 상태 관리 & 캐싱   | ^5.90  |
| [Zustand](https://zustand-demo.pmnd.rs/)         | 클라이언트 상태 관리    | ^5.0   |
| [NativeWind](https://www.nativewind.dev/)        | Tailwind CSS for RN     | ^4.0   |
| [Drizzle ORM](https://orm.drizzle.team/)         | SQLite 타입 안전 쿼리   | ^0.30  |
| [Zod](https://zod.dev/)                          | 스키마 검증             | ^3.23  |
| [Axios](https://axios-http.com/)                 | HTTP 클라이언트         | ^1.12  |
| [React Hook Form](https://react-hook-form.com/)  | 폼 관리                 | ^7.65  |
| [Lucide Icons](https://lucide.dev/)              | 아이콘 라이브러리       | ^0.454 |

### Backend (Express)

| 기술                                          | 용도                | 버전  |
| --------------------------------------------- | ------------------- | ----- |
| [Node.js](https://nodejs.org/)                | 런타임 환경         | 20+   |
| [Express](https://expressjs.com/)             | 웹 프레임워크       | ^4.19 |
| [PostgreSQL](https://www.postgresql.org/)     | 관계형 데이터베이스 | 14+   |
| [Drizzle ORM](https://orm.drizzle.team/)      | 서버 DB ORM         | ^0.30 |
| [TypeScript](https://www.typescriptlang.org/) | 타입 안전성         | ^5.5  |
| [Zod](https://zod.dev/)                       | 스키마 검증         | ^3.23 |
| [tsup](https://tsup.egoist.dev/)              | 빌드 도구           | ^8.0  |

### Shared Packages

| 패키지                    | 설명                                 |
| ------------------------- | ------------------------------------ |
| `@repo/ui`                | shadcn/ui 기반 공유 디자인 시스템    |
| `@repo/schema`            | Zod 스키마 (클라이언트 ↔ 서버 공유) |
| `@repo/typescript-config` | 공유 TypeScript 설정                 |
| `@repo/eslint-config`     | 공유 ESLint 설정                     |

### DevOps

- **Monorepo**: PNPM Workspaces
- **Container**: Docker (PostgreSQL)
- **Build**: tsup (서버), Metro (클라이언트)

---

## 📂 프로젝트 구조

Noline은 **PNPM Workspaces** 기반 모노레포 구조를 따르며, 클라이언트 앱은 **유연한 FSD(Feature-Sliced Design)** 원칙을 적용했습니다.

```
noline/
├── apps/
│   ├── client/                     # React Native (Expo) 애플리케이션
│   │   ├── app/                    # 🚪 Routing (Expo Router file-based routing)
│   │   │   ├── _layout.tsx         # Root 레이아웃
│   │   │   ├── (tabs)/             # 탭 네비게이션 그룹
│   │   │   │   ├── _layout.tsx     # Tab 레이아웃
│   │   │   │   ├── index.tsx       # 홈 (여행 목록)
│   │   │   │   ├── schedules/      # 일정 탭
│   │   │   │   ├── expenses.tsx    # 경비 탭
│   │   │   │   └── profile.tsx     # 프로필 탭
│   │   │   ├── create-trip.tsx     # 여행 생성 모달
│   │   │   ├── create-schedule.tsx # 일정 생성 모달
│   │   │   └── create-expense.tsx  # 경비 생성 모달
│   │   │
│   │   └── src/                    # 모든 애플리케이션 소스 코드
│   │       ├── app/                # (라우팅은 루트 app/에 위치)
│   │       │
│   │       ├── screens/            # 🧑‍🎨 Screen Assembly (화면 조합)
│   │       │   ├── HomeScreen.tsx
│   │       │   ├── ScheduleScreen.tsx
│   │       │   └── ExpensesScreen.tsx
│   │       │
│   │       ├── features/           # 📺 Feature Implementation (기능 구현)
│   │       │   ├── trip/           # 여행 관련 기능
│   │       │   │   ├── create-trip-form/
│   │       │   │   ├── trip-list/
│   │       │   │   └── trip-card/
│   │       │   ├── schedule/       # 일정 관련 기능
│   │       │   └── expense/        # 경비 관련 기능
│   │       │
│   │       ├── entities/           # 🧠 Business Entities (비즈니스 엔티티)
│   │       │   ├── trip/
│   │       │   │   ├── api/        # API 함수 (fetchTrips, fetchTripById)
│   │       │   │   ├── data/       # React Query 훅 (useGetTrips, useCreateTrip)
│   │       │   │   ├── model/      # 타입 정의, 스키마
│   │       │   │   └── ui/         # 엔티티 UI 컴포넌트 (TripCard)
│   │       │   ├── schedule/
│   │       │   └── expense/
│   │       │
│   │       └── shared/             # ⚙️ Shared Library (공유 라이브러리)
│   │           ├── components/     # 공유 UI 컴포넌트 (@repo/ui 조합)
│   │           ├── hooks/          # 공통 훅 (useDebounce, useStep)
│   │           ├── utils/          # 유틸리티 함수
│   │           ├── api/            # fetcher 인스턴스, 공통 API 로직
│   │           ├── db/             # SQLite 클라이언트, Drizzle 스키마
│   │           └── services/       # 동기화 엔진, 에러 서비스
│   │
│   └── server/                     # Express 백엔드 서버
│       ├── src/
│       │   ├── config/             # 환경 변수 설정
│       │   ├── db/                 # Drizzle ORM, PostgreSQL 스키마
│       │   ├── middleware/         # Express 미들웨어
│       │   ├── routes/             # API 라우트
│       │   ├── app.ts              # Express 앱 설정
│       │   └── index.ts            # 서버 진입점
│       ├── drizzle/                # DB 마이그레이션 파일
│       ├── scripts/                # DB 관리 스크립트
│       └── docker-compose.yml      # PostgreSQL 컨테이너 설정
│
└── packages/                       # 🧱 Shared Packages
    ├── ui/                         # 디자인 시스템 (Button, Input, Card 등)
    │   ├── src/components/         # shadcn/ui 기반 컴포넌트
    │   └── styles/                 # Tailwind 테마 설정
    │
    ├── schema/                     # Zod 스키마 (클라이언트 ↔ 서버 공유)
    │   └── src/
    │       ├── trip.ts
    │       ├── schedule.ts
    │       ├── expense.ts
    │       └── sync-queue.ts
    │
    ├── typescript-config/          # 공유 TypeScript 설정
    └── eslint-config/              # 공유 ESLint 설정
```

### 의존성 규칙 (Dependency Flow)

```
@repo/ui → shared → entities → features → screens → app
```

- **상위 레이어는 하위 레이어에 의존 가능**
- **하위 레이어는 상위 레이어를 알지 못함**
- 예: `features`는 `entities`와 `shared`를 사용할 수 있지만, `entities`는 `features`를 알지 못함

---

## 🚀 시작하기

### 사전 요구사항

- [Node.js](https://nodejs.org/) v20 이상
- [pnpm](https://pnpm.io/installation) v9.6.0
- [Docker](https://www.docker.com/get-started) (PostgreSQL 컨테이너용)
- iOS 개발: [Xcode](https://developer.apple.com/xcode/) (macOS)
- Android 개발: [Android Studio](https://developer.android.com/studio)

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/noline.git
cd noline

# 의존성 설치 (루트에서 한 번만 실행)
pnpm install
```

### 2. 백엔드 서버 설정

#### 환경 변수 설정

```bash
cd apps/server

# 개발 환경 설정 파일 생성
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

#### PostgreSQL 실행 및 마이그레이션

```bash
# PostgreSQL 컨테이너 실행
pnpm docker:up

# 데이터베이스 스키마 적용
pnpm db:push

# 백엔드 서버 실행
pnpm dev
# ✅ 서버가 http://localhost:3000 에서 실행됩니다.
```

### 3. 클라이언트 앱 실행

```bash
cd apps/client

# 개발 서버 시작
pnpm start

# iOS 실행 (macOS만 가능)
pnpm ios
```

---

## 📖 개발 가이드

### 주요 NPM 스크립트

#### Monorepo Root

```bash
pnpm client [script]     # 클라이언트 앱 스크립트 실행
pnpm server [script]     # 서버 스크립트 실행
pnpm schema [script]     # 스키마 패키지 스크립트 실행
pnpm lint                # 전체 프로젝트 린트
pnpm format              # Prettier 포맷팅
```

#### Client (apps/client)

```bash
pnpm start               # Expo 개발 서버 시작
pnpm ios                 # iOS 시뮬레이터 실행
pnpm android             # Android 에뮬레이터 실행
pnpm lint                # ESLint 검사
```

#### Server (apps/server)

```bash
pnpm dev                 # 개발 서버 (hot reload)
pnpm build               # 프로덕션 빌드
pnpm start               # 프로덕션 서버 실행
pnpm db:generate         # 마이그레이션 파일 생성
pnpm db:push             # 스키마 데이터베이스 적용
pnpm db:studio           # Drizzle Studio 실행
pnpm docker:up           # PostgreSQL 컨테이너 시작
pnpm docker:down         # PostgreSQL 컨테이너 종료
```

<!--
### 새로운 기능 추가하기

`.cursor/rules`의 아키텍처 가이드를 따라 개발합니다. 예: **"사용자 프로필 수정" 기능 추가**

#### 1. Entity 정의 (필요한 경우)

```bash
# entities/user/ 디렉토리가 없다면 생성
apps/client/src/entities/user/
├── api/          # API 함수
├── data/         # React Query 훅
├── model/        # 타입, 스키마
└── ui/           # UserAvatar.tsx 등
```

#### 2. Feature 생성

```bash
apps/client/src/features/edit-profile-form/
└── EditProfileForm.tsx
```

- `entities/user/api`의 API 함수 사용
- `@repo/ui`의 `Button`, `Input` 컴포넌트 사용
- 상태 관리, 검증, API 호출 로직 포함

#### 3. Screen 생성

```bash
apps/client/src/screens/EditProfileScreen.tsx
```

- `shared/components`의 `MobileHeader` 사용
- `features/edit-profile-form` 컴포넌트 조합

#### 4. Route 연결

```bash
apps/client/app/profile/edit.tsx
```

```tsx
import EditProfileScreen from '@/screens/EditProfileScreen';

export default function EditProfileRoute() {
  return <EditProfileScreen />;
}
```

### API 호출 패턴

프로젝트는 **3-Layer 아키텍처**를 따릅니다:

```
Component → React Query Hook (data/) → API Function (api/) → fetcher
```

#### API 함수 작성 (entities/{entity}/api/)

```typescript
// entities/trip/api/trip.ts
import fetcher from '@/shared/api/fetcher';
import { CreateTripRequestSchema, TripResponseSchema } from '@repo/schema/trip';
import { z } from 'zod';

type CreateTripRequest = z.infer<typeof CreateTripRequestSchema>;
type TripResponse = z.infer<typeof TripResponseSchema>;

export const fetchCreateTrip = async (data: CreateTripRequest): Promise<TripResponse> => {
  return fetcher.post<TripResponse>('/api/trips', data);
};
```

#### React Query 훅 작성 (entities/{entity}/data/)

```typescript
// entities/trip/data/useCreateTrip.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCreateTrip } from '../api/trip';
import { tripQueryKeys } from './queryKeys';

export const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchCreateTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
    },
  });
};
```

#### Component에서 사용

```tsx
// features/create-trip-form/CreateTripForm.tsx
import { useCreateTrip } from '@/entities/trip/data/useCreateTrip';

function CreateTripForm() {
  const { mutate, isPending } = useCreateTrip();

  const handleSubmit = (data) => {
    mutate(data);
  };

  return (
    <Button onPress={handleSubmit} loading={isPending}>
      여행 생성
    </Button>
  );
}
```

### 에러 처리

프로젝트는 **레벨 기반 에러 처리**를 지원합니다:

- **MVP 레벨**: 기본 try-catch, console.error
- **Production 레벨**: 커스텀 에러 클래스, errorService, ErrorBoundary

자세한 내용은 `.cursor/rules/07-error-handling.md` 참조

### 코딩 규칙

주요 규칙은 `.cursor/rules/`에 정의되어 있습니다:

- **00-developer.md**: 전문 시니어 개발자 마인드셋, 작업 프로세스
- **01-project-architecture.md**: FSD 기반 아키텍처 규칙
- **02-components.md**: 컴포넌트 개발 프로토콜 (MVP vs Production)
- **03-backend-express-guide.md**: Express 백엔드 상세 가이드
- **04-api-data.md**: API 호출 및 데이터 페칭 3-Layer 아키텍처
- **05-typescript-guide.md**: TypeScript 스타일 가이드
- **06-design-guide.md**: Figma 디자인 스펙 (Forest Green Theme)
- **07-error-handling.md**: 에러 처리 상세 가이드

--- -->

## 🏗️ 아키텍처

### Local-First 아키텍처

Noline의 핵심은 **로컬 DB(SQLite)를 Single Source of Truth로 사용**하는 것입니다.

```
┌─────────────────────────────────────────────────────────┐
│                   UI Layer (React Native)               │
│         (React Query를 통해 오직 로컬 DB만 조회)          │
└────────────────────┬────────────────────────────────────┘
                     │ (로컬 DB 데이터)
                     ↓
┌─────────────────────────────────────────────────────────┐
│            Service Layer (Zod + Drizzle)                │
│   (로컬 DB 조회/쓰기, Zod 검증, sync_queue 기록)             │
└────────────────────┬────────────────────────────────────┘
                     │ (DB 쿼리)
                     ↓
┌─────────────────────────────────────────────────────────┐
│       Persistence Layer (SQLite + sync_queue)           │
│              (원자적 트랜잭션으로 데이터 안전성 보장)         │
└─────────────────────────────────────────────────────────┘
                     ↕ (백그라운드 동기화)
              ┌──────────────┐
              │ Sync Engine  │ ← Push: 로컬 변경사항 전송
              │ (Background) │ → Pull: 서버 최신 데이터 수신
              └──────────────┘
                     ↕
┌─────────────────────────────────────────────────────────┐
│              Server API (PostgreSQL)                    │
└─────────────────────────────────────────────────────────┘
```

### 핵심 정책

1. **클라이언트 ULID 생성**: 모든 ID는 클라이언트에서 ULID로 생성 → 오프라인 충돌 방지
2. **Outbox Pattern**: 데이터 변경 + sync_queue 기록을 원자적 트랜잭션으로 묶음
3. **React Query 진입점**: 모든 데이터 작업은 React Query를 통해 일관된 패턴 유지
4. **활성화 기반 동기화**: 여행 기간 동안 자동으로 서버에서 최신 데이터 Pull

### 동기화 메커니즘

#### 데이터 조회 (Read)

1. UI → React Query 훅 → **로컬 SQLite DB** 조회
2. 로컬 DB에 데이터 없으면 빈 상태 렌더링
3. Sync Engine이 백그라운드에서 서버 데이터 Pull → 로컬 DB 채움

#### 데이터 수정 (Create, Update, Delete)

1. UI → `useMutation` 실행
2. 서비스 계층에서 **원자적 트랜잭션**:
   - a. ULID 생성
   - b. Zod 스키마 검증
   - c. 데이터 테이블(예: expenses)에 저장
   - d. sync_queue에 PENDING 작업 기록
3. **낙관적 업데이트**: React Query가 즉시 UI 갱신
4. **백그라운드 Push**: 온라인 시 Sync Engine이 서버로 전송

#### Pull 동기화

1. Sync Engine이 주기적 또는 네트워크 복구 시 서버로 Pull 요청
2. `last_synced_at` 이후 변경된 데이터 조회
3. 로컬 DB에 Upsert (Update or Insert)
4. React Query 캐시 무효화 → UI 자동 갱신

### 데이터 스키마

#### 공통 필드 (모든 핵심 테이블)

- `id` (TEXT, Primary Key): 클라이언트 생성 **ULID**
- `updated_at` (TIMESTAMP): 마지막 수정 시간 (Pull 동기화 기준)
- `deleted_at` (TIMESTAMP, Nullable): 소프트 삭제 시간
- `version` (INTEGER, Default 1): 충돌 해결용 버전 필드

#### sync_queue 테이블

| 필드명        | 타입        | 설명                                     |
| ------------- | ----------- | ---------------------------------------- |
| `id`          | TEXT (ULID) | 작업 고유 ID                             |
| `table_name`  | TEXT        | 변경된 테이블 이름                       |
| `record_id`   | TEXT        | 변경된 레코드의 ID                       |
| `action`      | TEXT        | 작업 종류 (CREATE, UPDATE, DELETE)       |
| `payload`     | TEXT (JSON) | 서버로 보낼 데이터 본문                  |
| `status`      | TEXT        | 작업 상태 (PENDING, IN_PROGRESS, FAILED) |
| `retry_count` | INTEGER     | 실패 시 재시도 횟수                      |
| `created_at`  | TIMESTAMP   | 작업 생성 시간                           |

---
