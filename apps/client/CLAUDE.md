# 📱 Noline Client Guide

> React Native (Expo) 클라이언트 애플리케이션 가이드

## 📊 구현 레벨 가이드 (MVP vs Production)

### 🟢 MVP Level (기본값)

**목표**: 빠른 구현, 작동하는 코드

- 기존 구조 있으면 → 따른다
- 기존 구조 없으면 → 유연하게 (스키마 skip 가능)
- 기본 에러 처리 (try-catch, console.error)

### 🔴 Production Level

**목표**: 완전한 베스트 프랙티스

- 없으면 만들어서라도 완벽하게
- @repo/schema 정의 필수
- 완전한 에러 처리 시스템
- JSDoc 문서화

## 🎯 @repo/schema - Source of Truth

### 핵심: 모든 타입의 중심

```
packages/schema/src/
├── trip.ts      # 여행 스키마
├── expense.ts   # 경비 스키마
├── schedule.ts  # 일정 스키마
├── user.ts      # 유저 스키마
└── index.ts     # 통합 export
```

### 5가지 스키마 타입

| 타입         | 용도             | 특징                                                  |
| ------------ | ---------------- | ----------------------------------------------------- |
| **Base**     | 전체 필드 정의   | 모든 필드 포함 (id, updatedAt, deletedAt, version 등) |
| **Insert**   | 생성시 필요 필드 | 클라이언트가 ID 포함하여 생성                         |
| **Update**   | 수정 가능 필드   | ID 제외, partial                                      |
| **Request**  | API 요청 형식    | Insert와 동일 (Echo Protocol)                         |
| **Response** | API 응답 형식    | `{ success, data }` 구조                              |

## 🏗 FSD Architecture

프로젝트는 Feature-Sliced Design 원칙을 따르며, 계층별 역할이 명확히 구분됩니다.

### 계층 구조 및 의존성 규칙

```
@repo/ui → shared → entities → features → screens → app
(하위 계층은 상위 계층에 의존할 수 없음)
```

### 📁 디렉토리별 역할

```
src/
├── app/                 # 🔵 라우팅 연결층
│   │                    # Expo Router 파일 기반 라우팅
│   └── (tabs)/          # 탭 네비게이션 구조
│
├── screens/             # 🔵 화면 조립층
│   │                    # features를 조합하여 완전한 화면 구성
│   ├── home/
│   ├── trips/
│   └── settings/
│
├── features/            # 🔵 기능 구현층
│   │                    # 사용자 상호작용 단위
│   ├── create-trip/     # 여행 생성 기능
│   ├── expense-form/    # 경비 입력 기능
│   └── schedule-list/   # 일정 목록 기능
│
├── entities/            # 🔵 비즈니스 핵심층
│   │                    # Trip, User, Expense 등 도메인 객체
│   ├── trip/
│   │   ├── ui/         # TripCard, TripList
│   │   ├── model/      # types, schemas
│   │   └── api/        # getTripById, updateTrip
│   └── expense/
│
└── shared/              # 🔵 공용 라이브러리층
    ├── components/      # 공용 UI (Header, Layout)
    ├── db/             # SQLite + Drizzle 설정
    ├── services/       # id 생성, sync 엔진
    └── hooks/          # 공용 hooks
```

## 🔄 Local-First Implementation

### 핵심 원칙: Echo Protocol

**데이터 흐름:**

1. **ID 생성**: 클라이언트가 ULID 생성
2. **로컬 저장**: withTransaction()으로 DB와 sync_queue 원자적 처리
3. **UI 업데이트**: React Query 캐시 무효화로 즉시 반영
4. **백그라운드 동기화**: SyncProvider가 자동으로 서버 전송

**트랜잭션 패턴:**

- 위치: `shared/db/utils.ts`
- 역할: DB 작업과 sync_queue를 하나의 트랜잭션으로 묶음
- 보장: 둘 다 성공하거나 둘 다 실패 (원자성)

### 데이터 흐름

| 단계               | 동작                     | 책임          |
| ------------------ | ------------------------ | ------------- |
| 1. User Action     | 버튼 클릭, 폼 제출       | UI Component  |
| 2. Validation      | Zod 스키마 검증          | Feature Layer |
| 3. ID Generation   | ULID 생성                | Service Layer |
| 4. Local Save      | SQLite 저장 + sync_queue | DB Layer      |
| 5. UI Update       | React Query 캐시 무효화  | State Layer   |
| 6. Background Sync | 네트워크 가능시 Push     | Sync Engine   |

## 🕐 Time Management

### 핵심: ISO 8601 with Timezone

- **형식**: `"2024-03-15T14:30:00.000Z"`
- **SQLite**: TEXT 타입으로 저장
- **Zod 검증**: `z.string().datetime({ offset: true })`
- **유틸리티**: `shared/lib/date.ts`에서 변환 함수 제공

## 🗄 Database Layer

### 데이터베이스 구조

**주요 테이블:**

- **업무 테이블**: trips, expenses, schedules 등
- **sync_queue**: 동기화 대기열 (action: CREATE | UPDATE | DELETE)

**Echo Protocol 필드 (모든 테이블):**

- `id`: ULID (클라이언트 생성)
- `updatedAt`: ISO 8601 문자열
- `deletedAt`: Soft Delete용
- `version`: 충돌 해결용

## 🔑 Query Key Factory Pattern

**목적**: 일관된 캐시 키 관리
**위치**: `entities/{entity}/data/keys.ts`

**패턴 예시**:

- `base`: `['expenses']`
- `byId`: `['expenses', 'id', id]`
- `byTrip`: `['expenses', 'trip', tripId]`

## 🗑 Soft Delete Pattern

**원칙**: 데이터는 삭제하지 않고 `deletedAt` 필드로 숨김
**조회시**: `isNull(deletedAt)` 필터 필수
**동기화**: DELETE action도 sync_queue에 기록

## 🔢 Version Field

**용도**: 충돌 해결 대비
**동작**: 업데이트시 자동 증가
**활용**: Last-Write-Wins 또는 Version Vector

## 🔄 Sync Engine

### Push Sync (로컬 → 서버)

**프로세스:**

1. sync_queue에서 PENDING 작업 조회
2. FIFO 순서로 서버 전송
3. 성공시 queue에서 제거
4. 실패시 재시도 카운트 증가

**위치**: `shared/services/sync/push.ts`

### Pull Sync (서버 → 로컬)

**상태**: 🚧 구현 예정
**계획**: lastSyncedAt 이후 변경사항 pull

## 📋 개발 가이드라인

### 권장 패턴

- **트랜잭션**: withTransaction()으로 원자성 보장
- **데이터 조회**: React Query + 로컬 DB
- **타입 처리**: 타입 가드 사용 (as 피함)
- **캐시 관리**: Query Key Factory 패턴

### 주의 사항

- **서버 대기**: 서버 응답 대기하며 UI 블로킹 피함
- **API 호출**: sync_queue 없이 직접 호출 피함
- **삭제**: Hard Delete 대신 Soft Delete

## 🐛 Common Issues & Debugging

### Issue 1: Sync Queue가 계속 쌓임

**증상**: sync_queue 테이블에 레코드가 계속 증가

**디버깅 쿼리**:

```sql
-- sync_queue 상태 확인
SELECT status, COUNT(*)
FROM sync_queue
GROUP BY status;

-- 실패한 작업 조회
SELECT * FROM sync_queue
WHERE status = 'FAILED'
ORDER BY retry_count DESC;
```

**해결방법**:

1. 네트워크 상태 확인
2. 서버 API 엔드포인트 확인
3. 재시도 로직 검증

### Issue 2: UI가 업데이트되지 않음

**증상**: 데이터 변경 후 화면이 갱신되지 않음

**체크리스트**:

- [ ] `queryClient.invalidateQueries()` 호출 확인
- [ ] 올바른 queryKey 사용 확인
- [ ] React Query 캐시 설정 확인

### Issue 3: 중복 ID 에러

**증상**: "UNIQUE constraint failed: trips.id"

**원인**: 동일한 ULID 중복 생성 (매우 드묾)

**해결방법**:

```typescript
// ID 생성시 재시도 로직
let id = generateId();
let retries = 0;
while ((await isIdExists(id)) && retries < 3) {
  id = generateId();
  retries++;
}
```

## 📊 Performance Optimization

### 1. 쿼리 최적화

```typescript
// ✅ 필요한 컬럼만 선택
const trips = await db
  .select({
    id: trips.id,
    name: trips.name,
  })
  .from(trips);

// ❌ 모든 컬럼 선택
const trips = await db.select().from(trips);
```

### 2. 배치 처리

```typescript
// ✅ 트랜잭션으로 배치 처리
await withTransaction(async (tx) => {
  for (const expense of expenses) {
    await tx.insert(expensesTable).values(expense);
  }
});
```

### 3. 메모이제이션

```typescript
// 비싼 계산은 useMemo로 캐싱
const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
```

## 🔍 Development Tools

### 유용한 디버깅 명령어

```bash
# SQLite DB 직접 조회
npx drizzle-kit studio

# React Query Devtools
# 앱 내에서 자동으로 표시됨 (개발 모드)

# 로그 확인
npx expo start --clear
```

### VS Code Extensions 권장

- SQLite Viewer - DB 파일 직접 확인
- React Native Tools - 디버깅 지원
- Expo Tools - Expo 명령어 지원

## 📚 Related Files

- [Root CLAUDE.md](/Users/hammyeong-yeon/Desktop/noline/CLAUDE.md) - 프로젝트 전체 가이드
- [Server CLAUDE.md](/Users/hammyeong-yeon/Desktop/noline/apps/server/CLAUDE.md) - 서버 API 가이드
- [UI CLAUDE.md](/Users/hammyeong-yeon/Desktop/noline/packages/ui/CLAUDE.md) - 컴포넌트 가이드
