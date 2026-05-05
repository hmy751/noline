---
alwaysApply: true
---

# 🧭 Noline App Architecture Rules

이 문서는 Noline 앱의 일관성, 확장성, 유지보수성을 위해 정의된 아키텍처 규칙입니다. 프로젝트는 유연한 Feature-Sliced Design (FSD) 원칙을 따릅니다.

## 📜 핵심 원칙

- **관심사의 분리 (Separation of Concerns)**: 라우팅, 화면 구성, 기능 구현, 비즈니스 엔티티, 공용 UI의 역할을 명확히 분리합니다.
- **계층 구조 (Layered Architecture)**: 코드는 `app`, `screens`, `features`, `entities`, `shared`, `@repo/ui` 등 명확한 계층으로 나뉩니다.
- **의존성 규칙 (Dependency Rule)**: 상위 계층은 하위 계층에 의존할 수 있지만, 그 반대는 불가능합니다. (예: `features`는 `entities`를 사용할 수 있지만, `entities`는 `features`를 알 수 없습니다.)
  ```
  @repo/ui → shared → entities → features → screens → app
  ```

## 📂 디렉토리별 역할과 책임

### 전체 구조 개요

```
noline/
├── apps/
│   ├── client/                  # React Native (Expo) 애플리케이션
│   │   ├── app/                 # 🔵 1. 라우팅 연결 (초인종과 주소패 🚪)
│   │   │   │                    #    - URL 경로와 실제 화면(screens)을 연결하는 진입점
│   │   │   │                    #    - 파일 구조를 통해 URL과 내비게이션 구조를 정의
│   │   │   └── ...
│   │   │
│   │   └── src/                 # ✨ 애플리케이션의 모든 소스코드
│   │       ├── screens/         # 🔵 2. 화면 조립 (인테리어 디자이너 🧑‍🎨)
│   │       │   │                #    - features, entities, shared 등 하위 레이어 컴포넌트들을 조립하여 하나의 완전한 화면을 구성
│   │       │   │                #    - 페이지의 전체적인 레이아웃과 구조를 결정
│   │       │   └── ...
│   │       │
│   │       ├── features/        # 🔵 3. 기능 구현 (가전제품 📺)
│   │       │   │                #    - 사용자의 상호작용과 관련된 기능 단위. (FSD의 feature + widget 역할)
│   │       │   │                #    - 자체적으로 상태 관리, 유효성 검사, API 호출 등의 로직을 처리
│   │       │   └── ...
│   │       │
│   │       ├── entities/        # 🔵 4. 비즈니스 핵심 (도메인 객체 🧠)
│   │       │   │                #    - Trip, User 등 핵심 비즈니스 데이터와 관련된 UI, 모델, API 함수를 관리
│   │       │   └── ...
│   │       │
│   │       └── shared/          # 🔵 5. 앱 공용 라이브러리 (미리 조립된 부품 ⚙️)
│   │           │                #    - 비즈니스와 무관하게 앱 전반에서 재사용되는 순수 UI 컴포넌트, 유틸리티 등
│   │           │                #    - @repo/ui의 컴포넌트를 조합하여 앱에 특화된 공용 컴포넌트 생성
│   │           └── ...
│   │
│   └── server/                  # 백엔드 서버
│
└── packages/                    # 🔵 6. 디자인 시스템 (레고 블록 🧱)
    ├── ui/                      # - 디자인 시스템의 원자 단위 (스타일링만 가진 순수 Button, Input, Card 셸 ...)
    ├── schema/                  # - Zod를 사용한 데이터 유효성 검사 스키마
    ├── db/                      # - Prisma 클라이언트 및 DB 스키마
    ├── typescript-config/       # - 공유 TypeScript 설정
    └── eslint-config/           # - 공유 ESLint 설정
```

### 1. @repo/ui (packages/ui) - 디자인 시스템 (레고 블록 🧱)

- **역할**: 조직의 모든 프로젝트에서 재사용 가능한 순수 UI 컴포넌트 라이브러리.
- **책임**:
  - 어플리케이션 비즈니스 로직을 포함하지 않습니다. "Trip", "User"가 무엇인지 모릅니다.
  - 스타일과 기본적인 인터랙션만 정의합니다.
  - 모든 프로젝트에서 일관된 디자인을 보장합니다.
- **좋은 예시**: `Button`, `Input`, `Card` (껍데기), `Spinner`, `Checkbox`

### 2. src/shared - 앱 공용 라이브러리 (미리 조립된 부품 ⚙️)

- **역할**: 현재 `client` 앱 내부에서만 공통으로 사용되며, **비즈니스 로직과 무관한** UI 컴포넌트, 유틸리티, 설정 등을 관리합니다.
- **책임**:
  - 여러 화면과 기능에서 재사용되는 요소를 배치합니다.
  - `@repo/ui`의 컴포넌트를 조합하여 앱에 특화된 공용 컴포넌트를 만듭니다.
  - **중요**: 특정 비즈니스 데이터와 강하게 결합된 컴포넌트(예: 여행 정보를 표시하는 카드)는 `entities` 레이어에서 관리합니다.
- **하위 디렉토리 구분**:
  - `lib/`: 순수 함수 + 범용 유틸리티
    - 예: `formatDate`, `formatCurrency`, `calculateDistance`
    - 특징: Side effect 없음, 입력 → 출력 변환만 수행
  - `services/`: Side effect OR 앱 특화 비즈니스 로직
    - 예: `sync` (동기화 엔진), `offline-prep` (활성화 시스템)
    - 특징: DB 접근, API 호출, 작업을 **수행**하는 로직
  - `store/`: 전역 상태 관리 (Zustand)
    - 예: `network` (네트워크 상태), `useTripStore` (선택된 여행 ID)
    - 특징: 런타임 상태를 **보유**하고 **변경**함
    - 구분: Services는 "로직 실행", Store는 "상태 보유"
  - `policy/`: 비즈니스 규칙 (독립 카테고리)
    - 예: `useAppPolicy` (CRUD 권한 정책)
    - 특징: 4-State Matrix 기반 권한 규칙 제공
    - 중요도: 충분히 중요하여 독립 카테고리로 존재
- **좋은 예시**:
  - `shared/components`: `MobileHeader`, `PageLayout`, `FormField`
  - `shared/lib`: `formatDate`와 같은 헬퍼 함수
  - `shared/services`: `sync/engine.ts`, `offline-prep/router.ts`
  - `shared/store`: `network.ts`, `useTripStore.ts`
  - `shared/policy`: `useAppPolicy.ts`, `constants.ts`
  - `shared/api`: `axios` 인스턴스 설정 (`fetcher`)

### 3. src/entities - 비즈니스 핵심 (도메인 객체 🧠)

- **역할**: `Trip`, `User`, `Expense` 등 애플리케이션의 핵심 비즈니스 도메인과 관련된 코드를 관리합니다.
- **책임**:
  - 해당 엔티티의 데이터를 표현하는 UI 컴포넌트를 포함합니다.
  - 엔티티의 데이터 모델, 타입, 유효성 검사 스키마 등을 관리합니다.
  - 해당 엔티티를 관리하기 위한 API 함수를 포함할 수 있습니다.
- **폴더 구조 (확장 가능)**:
  - `model/` - 데이터 모델, 타입 (z.infer로 @repo/schema에서 추출)
  - `api/` - Remote API 호출 함수 (Server 통신)
  - `lib/` - Local DataSource (SQLite 직접 접근, withTransaction 사용)
  - `repository/` - Router 패턴 (활성화 상태 기반 Local/Remote 분기)
  - `data/` - Query keys, React Query hooks (Repository 사용)
  - `ui/` - UI 컴포넌트 (예: TripCard.tsx)
  - `utils/` - 엔티티 전용 유틸리티 함수
  - 필요에 따라 추가 폴더 생성 가능
- **타입 흐름**:

  ```text
  @repo/schema (Zod) → model (z.infer) → repository → data hooks → components
  ```

- **좋은 예시**:
  - `entities/trip/model/index.ts` (타입 export)
  - `entities/trip/api/trips.ts` (fetchAllTrips, fetchCreateTrip 등)
  - `entities/trip/lib/trip-local.ts` (getTripsLocal, createTripLocal 등)
  - `entities/trip/repository/trip-repository.ts` (TripRepository.getAll 등)
  - `entities/trip/data/keys.ts` (Query Key Factory)
  - `entities/trip/data/useGetTrips.ts` (React Query hook)
  - `entities/trip/ui/TripCard.tsx` (@repo/ui의 Card를 셸로 사용)

### 4. src/features - 기능 구현 (가전제품 📺)

- **역할**: 사용자가 상호작용하여 특정 목표를 달성하는 기능 단위를 구현합니다. 실용적인 접근을 위해 FSD의 `features`(원자적 액션)와 `widgets`(기능 조합)의 역할을 통합합니다.
- **책임**:
  - 자체적으로 상태 관리, 유효성 검사, API 호출 등의 로직을 처리하며, 주로 `entities`와 `shared` 레이어의 함수들을 조합하여 구성합니다.
  - 간단한 액션(예: 삭제 버튼)부터 여러 요소가 조합된 복잡한 컴포넌트(예: 여행 생성 폼, 여행 목록)까지 포함할 수 있습니다.
- **좋은 예시**: `create-trip-form`, `delete-trip-button`, `trip-list`, `user-login-form`

### 5. src/screens - 화면 조립 (인테리어 디자이너 🧑‍🎨)

- **역할**: `features`, `entities`, `shared` 등의 하위 레이어 컴포넌트들을 조립하여 사용자에게 보여줄 하나의 완전한 화면을 구성합니다.
- **책임**:
  - 페이지의 전체적인 레이아웃과 구조를 결정합니다.
  - 자체적으로 복잡한 비즈니스 로직을 갖지 않고, 주로 `features`와 `entities`에 위임합니다.
- **좋은 예시**: `HomeScreen`, `AddTripScreen`, `ExpensesScreen`

### 6. app/ - 라우팅 연결 (초인종과 주소패 🚪)

- **역할**: URL 경로와 실제 화면(`screens`)을 연결하는 진입점(Entrypoint).
- **책임**:
  - 파일 구조를 통해 URL과 내비게이션 구조를 정의합니다.
  - 파일 내 코드는 최소화하여, 해당하는 `screens` 컴포넌트를 렌더링하는 역할만 수행합니다.
  - `Stack`, `Tabs` 등 내비게이터의 옵션을 설정합니다.
- **좋은 예시**: `app/(tabs)/home.tsx`, `app/add-trip.tsx`

## 🗺️ 라우팅 규칙

- `app` 디렉토리는 라우팅 전용입니다.
- `app` 내부 파일에는 비즈니스 로직이나 복잡한 UI를 두지 않습니다. `screens`에 있는 컴포넌트를 불러와 `export`하는 것이 주된 역할입니다.
- 파일 구조가 URL과 레이아웃을 결정합니다.
  - 파일 및 폴더 계층은 URL 세그먼트와 직접 매핑됩니다.
- 공통 레이아웃은 그룹 `(group)`을 사용합니다.
  - 탭 바처럼 여러 화면이 공유하는 UI 셸은 `(tabs)`와 같은 경로 그룹과 `_layout.tsx` 파일을 통해 구현합니다.
- 모달 및 전체 화면 페이지는 루트(`app/`)에 배치합니다.
  - 탭 바 등 특정 레이아웃에서 벗어나야 하는 화면은 해당 그룹 폴더 바깥(주로 `app/` 바로 아래)에 라우트 파일을 생성합니다.

## 🚀 Walkthrough: '여행 생성' 흐름 확인하기

1. **Entity 정의 (필요시)**:
   - `src/entities/trip`에 `Trip` 엔티티 관련 코드가 정의되어 있는지 확인합니다. 여기에는 `model/`의 타입, `api/`의 원격 함수, `lib/`의 로컬 datasource, `repository/`, `data/` hook이 포함될 수 있습니다.

2. **Feature 생성**:
   - `src/features/trip/create-trip` 아래에서 여행 생성 폼과 관련 로직을 확인하거나 확장합니다.
   - 폼은 `entities/trip/data` hook, `@repo/schema`, `@repo/ui` 또는 `shared/components`의 UI 컴포넌트를 조합합니다.

3. **Screen 생성**:
   - `src/screens/CreateTripScreen.tsx`에서 `MobileHeader`와 `create-trip` 피처를 페이지 레이아웃에 맞게 배치합니다.

4. **Route 생성**:
   - `app/create-trip.tsx`에서 3번의 Screen을 `import` 하여 `return` 합니다.

   ```typescript
   // app/create-trip.tsx
   import CreateTripScreen from '@/screens/CreateTripScreen';

   export default function CreateTrip() {
     return <CreateTripScreen />;
   }
   ```

## 개발 워크플로우

1. **새 기능 개발 시**:

새로운 기능 개발 전 다음 순서로 확인합니다:

- [ ] `packages/` 디렉토리에서 유사한 기능 검색
- [ ] 발견 시, 다음 질문으로 재사용 가능성 평가:
  - 핵심 기능이 이미 구현되어 있는가?
  - 추가/수정할 코드가 새로 만드는 것보다 적은가?
  - 기존 코드의 품질이 프로젝트 표준을 만족하는가?
- [ ] 재사용 판단 기준:
  - ✅ 주요 로직이 동일하고 일부 옵션만 다른 경우 → 기존 패키지 확장
  - ✅ API 인터페이스가 명확하고 확장 가능한 경우 → 기존 패키지 확장
  - ❌ 기존 코드를 크게 수정해야 하는 경우 → 새로 작성 고려
  - ❌ 기존 코드의 품질이 낮은 경우 → 새로 작성 고려
- [ ] 새로 작성이 필요한 경우, 다른 앱에서도 활용 가능한지 검토
- [ ] 해당 앱에만 고유한 기능인 경우에만 앱 전용 코드 작성

2. **커밋 전 확인**:
   - `pnpm lint` 통과
   - Zod 스키마로 타입 검증 완료

## 패키지 의존성 원칙

- pnpm 기반의 모노레포 구조에서 안전한 의존성 관리를 위해, 공통 의존성을 루트의 `package.json`에 설치하는 것을 지양합니다.
- `typescript`와 같이 모든 프로젝트에서 보편적으로 사용되는 경우만 루트에 설치합니다.
- 따로 설치하더라도 최대한 버전을 맞춰서 설치합니다. 단, 무조건 같은 버전을 쓰는 게 아니라 해당 레포에서 주변 라이브러리와의 호환성을 고려해서 버전을 맞춥니다.
