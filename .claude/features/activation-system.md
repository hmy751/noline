# 활성화 시스템 (Activation System)

> 오프라인 지도 통합을 위한 선택적 데이터 동기화 시스템

## 📌 핵심 철학

> **"활성화 = 오프라인 보험, 비활성 = 온라인 전용"**

- **활성화된 여행**: 완벽한 오프라인 경험 (Local-First 유지)
- **비활성 여행**: 온라인 전용 (Server-First)
- **자동 관리**: 여행 종료 후 자동 비활성화

---

## 🎯 동기 (Motivation)

### 문제

오프라인 지도(Mapbox) 통합 시 저장 공간 문제:

```
도시별 지도 크기: 15-200MB
여행 10개 × 평균 50MB = 500MB
→ 모바일 저장 공간 부족
```

### 해결

활성화 시스템으로 사용자 제어:

```
활성화 1개 여행만 로컬 저장
→ 최대 200MB
→ 저장 공간 예측 가능
```

---

## 🏗 아키텍처 개요

### 2-Tier 데이터 구조

```
┌─────────────────────────────────────────┐
│ Tier 1: Metadata (항상 로컬) │
│ │
│ - 여행 목록 표시 │
│ - 활성화 상태 확인 │
│ - 크기: ~1MB (100 trips) │
└─────────────────────────────────────────┘
↓ (활성화 시)
┌─────────────────────────────────────────┐
│ Tier 2: Full Data (활성화 시만 로컬) │
│ │
│ - 전체 Schedules, Expenses, Places │
│ - 오프라인 지도 타일 │
│ - 크기: ~10-200MB (per trip) │
└─────────────────────────────────────────┘
```

---

## 📊 Schema

### trip_metadata

```typescript
export const tripMetadata = sqliteTable('trip_metadata', {
  id: text('id').primaryKey(),
  destination: text('destination').notNull(),
  startDate: text('start_date').notNull(), // ISO 8601
  endDate: text('end_date').notNull(), // ISO 8601
  activated: integer('activated', { mode: 'boolean' }).default(false),

  // 통계 (서버에서 계산)
  totalExpenses: real('total_expenses').default(0),
  scheduleCount: integer('schedule_count').default(0),
  expenseCount: integer('expense_count').default(0),

  thumbnailUrl: text('thumbnail_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
```

### trip_activations

```typescript
export const tripActivations = sqliteTable(
  'trip_activations',
  {
    id: text('id').primaryKey(),
    tripId: text('trip_id').notNull().unique(),
    userId: text('user_id').notNull(),

    isActivated: integer('is_activated', { mode: 'boolean' }).default(false),
    activatedAt: text('activated_at'),
    deactivatedAt: text('deactivated_at'),
    expiresAt: text('expires_at'), // 자동 해제 기준

    syncStatus: text('sync_status'), // 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    lastSyncAt: text('last_sync_at'),

    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    // 동시에 1개만 활성화 가능
    uniqueActiveActivation: unique()
      .on(table.userId, table.isActivated)
      .where(sql`${table.isActivated} = true`),
  }),
);
```

---

## 🔀 라우팅 레이어 (Routing Layer)

모든 CRUD 연산은 활성화 상태에 따라 라우팅됩니다.

### 패턴

```typescript
async function <operation>(tripId: string, data: any) {
const metadata = await getTripMetadata(tripId);

if (metadata.activated) {
// Path A: Local-First (기존 로직)
return await localOperation(data);
} else {
// Path B: Server-First (새 로직)
return await serverOperation(data);
}
}
```

### 구현 예시

#### CREATE

```typescript
export async function createExpense(data: CreateExpenseInput) {
  const metadata = await getTripMetadata(data.tripId);

  if (metadata.activated) {
    // 활성화: 로컬 DB + sync_queue
    return await withTransaction(async () => {
      const id = ulid();
      await db.insert(expenses).values({ id, ...data });
      await db.insert(syncQueue).values({
        entity: 'expense',
        entityId: id,
        action: 'CREATE',
        payload: JSON.stringify({ id, ...data }),
      });
      return id;
    });
  } else {
    // 비활성: 서버 직접
    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      throw new OfflineError('오프라인에서 추가하려면 이 여행을 활성화해주세요', {
        action: 'ACTIVATE_PROMPT',
        tripId: data.tripId,
      });
    }

    const id = ulid(); // Echo Protocol 유지
    await api.post('/expenses', { id, ...data });
    return id;
  }
}
```

#### READ

```typescript
export async function getExpenses(tripId: string) {
  const metadata = await getTripMetadata(tripId);

  if (metadata.activated) {
    // 활성화: 로컬 DB
    return await db.select().from(expenses).where(eq(expenses.tripId, tripId)).all();
  } else {
    // 비활성: 서버 조회
    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      throw new OfflineError('오프라인에서는 활성화된 여행만 볼 수 있어요');
    }

    return await api.get(`/trips/${tripId}/expenses`);
  }
}
```

#### UPDATE

```typescript
export async function updateExpense(expenseId: string, data: UpdateExpenseInput) {
  const tripId = await getExpenseTripId(expenseId);
  const metadata = await getTripMetadata(tripId);

  if (metadata.activated) {
    // 활성화: 로컬 DB + sync_queue
    return await withTransaction(async () => {
      await db.update(expenses).set(data).where(eq(expenses.id, expenseId));

      await db.insert(syncQueue).values({
        entity: 'expense',
        entityId: expenseId,
        action: 'UPDATE',
        payload: JSON.stringify(data),
      });
    });
  } else {
    // 비활성: 서버 직접
    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      throw new OfflineError('오프라인에서는 활성화된 여행만 수정할 수 있어요');
    }

    await api.patch(`/expenses/${expenseId}`, data);
  }
}
```

#### DELETE (Soft Delete)

```typescript
export async function deleteExpense(expenseId: string) {
  const tripId = await getExpenseTripId(expenseId);
  const metadata = await getTripMetadata(tripId);

  const deletedAt = new Date().toISOString();

  if (metadata.activated) {
    // 활성화: 로컬 Soft Delete + sync_queue
    return await withTransaction(async () => {
      await db.update(expenses).set({ deletedAt }).where(eq(expenses.id, expenseId));

      await db.insert(syncQueue).values({
        entity: 'expense',
        entityId: expenseId,
        action: 'DELETE',
        payload: JSON.stringify({ deletedAt }),
      });
    });
  } else {
    // 비활성: 서버 직접
    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      throw new OfflineError('오프라인에서는 활성화된 여행만 삭제할 수 있어요');
    }

    await api.delete(`/expenses/${expenseId}`);
  }
}
```

---

## 🔄 활성화 플로우

### 활성화하기 (Activate)

```typescript
export async function activateTrip(tripId: string) {
  // 1. 1-Trip 제한 체크
  const existing = await db.select().from(tripActivations).where(eq(tripActivations.isActivated, true)).get();

  if (existing && existing.tripId !== tripId) {
    throw new ConflictError('이미 다른 여행이 활성화되어 있습니다');
  }

  // 2. 여행 정보 조회 (만료일 계산)
  const trip = await api.get(`/trips/${tripId}`);
  const expiresAt = addDays(new Date(trip.endDate), 7);

  // 3. 활성화 상태 설정 (IN_PROGRESS)
  await db.insert(tripActivations).values({
    id: ulid(),
    tripId,
    userId: getCurrentUserId(),
    isActivated: true,
    activatedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    syncStatus: 'IN_PROGRESS',
  });

  try {
    // 4. 서버에서 전체 데이터 Pull
    const fullData = await api.get(`/trips/${tripId}/full`, {
      timeout: 30000, // 30초
    });

    // 5. 로컬 DB에 배치 삽입 (트랜잭션)
    await withTransaction(async () => {
      // Trip
      await db.insert(trips).values(fullData.trip);

      // Schedules (배치 처리 + 진행률)
      const BATCH_SIZE = 100;
      for (let i = 0; i < fullData.schedules.length; i += BATCH_SIZE) {
        const batch = fullData.schedules.slice(i, i + BATCH_SIZE);
        await db.insert(schedules).values(batch);

        // 진행률 업데이트
        const progress = Math.min(100, ((i + BATCH_SIZE) / fullData.schedules.length) * 50);
        await updateActivationProgress(tripId, progress);

        await new Promise((resolve) => setTimeout(resolve, 10)); // UI 응답성
      }

      // Expenses
      for (let i = 0; i < fullData.expenses.length; i += BATCH_SIZE) {
        const batch = fullData.expenses.slice(i, i + BATCH_SIZE);
        await db.insert(expenses).values(batch);

        const progress = 50 + Math.min(50, ((i + BATCH_SIZE) / fullData.expenses.length) * 50);
        await updateActivationProgress(tripId, progress);

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // 6. 활성화 완료
      await db
        .update(tripActivations)
        .set({
          syncStatus: 'COMPLETED',
          lastSyncAt: new Date().toISOString(),
        })
        .where(eq(tripActivations.tripId, tripId));

      // 7. Metadata 업데이트
      await db.update(tripMetadata).set({ activated: true }).where(eq(tripMetadata.id, tripId));
    });

    // 8. 오프라인 지도 다운로드 (비동기, 별도)
    downloadOfflineMap(tripId).catch(console.error);
  } catch (error) {
    // Pull 실패 시 롤백 및 상태 업데이트
    await db
      .update(tripActivations)
      .set({
        syncStatus: 'FAILED',
        lastSyncAt: new Date().toISOString(),
      })
      .where(eq(tripActivations.tripId, tripId));

    throw error;
  }
}
```

### 비활성화하기 (Deactivate)

```typescript
export async function deactivateTrip(tripId: string) {
  // 1. 활성화 상태 변경 (Mark for cleanup)
  await db
    .update(tripActivations)
    .set({
      isActivated: false,
      deactivatedAt: new Date().toISOString(),
      cleanupPending: true, // 정리 대기 플래그
    })
    .where(eq(tripActivations.tripId, tripId));

  // 2. Metadata 업데이트
  await db.update(tripMetadata).set({ activated: false }).where(eq(tripMetadata.id, tripId));

  // 3. 로컬 데이터 정리
  await cleanupDeactivatedData(tripId);
}

async function cleanupDeactivatedData(tripId: string) {
  try {
    await withTransaction(async () => {
      // 배치 삭제 (메모리 효율)
      await db.delete(schedules).where(eq(schedules.tripId, tripId));

      await db.delete(expenses).where(eq(expenses.tripId, tripId));

      await db.delete(trips).where(eq(trips.id, tripId));

      // 정리 완료 마킹
      await db.update(tripActivations).set({ cleanupPending: false }).where(eq(tripActivations.tripId, tripId));
    });

    // 오프라인 지도 삭제 (비동기)
    await deleteOfflineMap(tripId).catch(console.error);
  } catch (error) {
    console.error('Cleanup failed:', error);
    // 실패해도 재시도 가능하도록 cleanupPending 유지
  }
}
```

### 자동 비활성화

```typescript
// Background Job: 하루 1회 실행
export async function autoDeactivateExpiredTrips() {
  const now = new Date();

  const expired = await db
    .select()
    .from(tripActivations)
    .where(and(eq(tripActivations.isActivated, true), lt(tripActivations.expiresAt, now.toISOString())))
    .all();

  for (const activation of expired) {
    await deactivateTrip(activation.tripId);

    // 푸시 알림 (선택)
    await sendNotification({
      title: '여행 오프라인 준비 해제',
      body: `${activation.destination}의 오프라인 준비가 자동 해제되었습니다`,
    });
  }
}

// 앱 시작 시 등록
export function registerBackgroundJobs() {
  // 하루 1회 (새벽 3시)
  scheduleDaily('03:00', autoDeactivateExpiredTrips);

  // 미완료 정리 작업 재시도
  retryPendingCleanups();
}

async function retryPendingCleanups() {
  const pending = await db.select().from(tripActivations).where(eq(tripActivations.cleanupPending, true)).all();

  for (const activation of pending) {
    await cleanupDeactivatedData(activation.tripId);
  }
}
```

---

## ⚛️ React Query Integration

### Activation Status Hook

```typescript
export const activationKeys = {
  status: (tripId: string) => ['activation', 'status', tripId] as const,
};

export function useActivationStatus(tripId: string) {
  return useQuery({
    queryKey: activationKeys.status(tripId),
    queryFn: async () => {
      const metadata = await db.select().from(tripMetadata).where(eq(tripMetadata.id, tripId)).get();

      return {
        isActivated: metadata?.activated ?? false,
        expiresAt: metadata?.expiresAt,
      };
    },
    staleTime: 5 * 60 * 1000, // 5분 캐시 (성능 최적화)
  });
}
```

### Data Hooks with Routing

```typescript
export function useExpenses(tripId: string) {
  const { data: activation } = useActivationStatus(tripId);
  const isOnline = useNetworkStatus();

  return useQuery({
    queryKey: ['expenses', tripId, { source: activation.isActivated ? 'local' : 'remote' }],
    queryFn: async () => {
      if (activation.isActivated) {
        // Local
        return await db.select().from(expenses).where(eq(expenses.tripId, tripId)).all();
      } else {
        // Remote
        if (!isOnline) {
          throw new OfflineError('오프라인에서는 활성화된 여행만 볼 수 있어요');
        }
        return await api.get(`/trips/${tripId}/expenses`);
      }
    },
    enabled: !!activation, // 활성화 상태 로드 후 실행
  });
}
```

---

## 🎨 UI Components

### Activation Button

```tsx
export function ActivateButton({ tripId }: { tripId: string }) {
  const { data: activation } = useActivationStatus(tripId);
  const activateMutation = useMutation({
    mutationFn: () => activateTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activationKeys.status(tripId) });
    },
  });

  if (activation.isActivated) {
    return (
      <View>
        <Text>오프라인 준비 완료</Text>
        <Text>만료: {formatDate(activation.expiresAt)}</Text>
      </View>
    );
  }

  return (
    <Button onPress={() => activateMutation.mutate()} loading={activateMutation.isPending}>
      오프라인 활성화하기
    </Button>
  );
}
```

### Activation Progress

```tsx
export function ActivationProgress({ tripId }: { tripId: string }) {
  const { data: progress } = useQuery({
    queryKey: ['activation-progress', tripId],
    queryFn: () => getActivationProgress(tripId),
    refetchInterval: 500, // 0.5초마다 폴링
  });

  return (
    <View>
      <Text>여행 데이터 준비 중...</Text>
      <ProgressBar value={progress} />
      <Text>{progress}% 완료</Text>
    </View>
  );
}
```

### Offline Error Prompt

```tsx
export function OfflineErrorPrompt({ error, tripId }: Props) {
  const navigation = useNavigation();

  if (!(error instanceof OfflineError)) return null;

  return (
    <Alert
      title='오프라인 준비 필요'
      message='오프라인에서 이 여행을 편집하려면 오프라인 활성화를 해주세요'
      actions={[
        { text: '취소', style: 'cancel' },
        {
          text: '오프라인 활성화하기',
          onPress: () => navigation.navigate('ActivateTrip', { tripId }),
        },
      ]}
    />
  );
}
```

---

## 🐛 Edge Cases

### 1. Pull 실패 시 부분 데이터

**문제**: 네트워크 끊김으로 일부만 삽입

**해결**: 트랜잭션으로 원자성 보장

```typescript
await withTransaction(async () => {
  await db.insert(trips).values(fullData.trip);
  await db.insert(schedules).values(fullData.schedules);
  await db.insert(expenses).values(fullData.expenses);

  // 모두 성공 시에만 커밋
});
// 하나라도 실패 시 전체 롤백
```

### 2. 활성화 중 앱 종료

**문제**: Pull 중 앱 종료 → 불완전 데이터

**해결**: syncStatus 체크 및 재시도

```typescript
async function onAppStart() {
  const inProgress = await db.select().from(tripActivations).where(eq(tripActivations.syncStatus, 'IN_PROGRESS')).all();

  for (const activation of inProgress) {
    // 재시도 또는 FAILED 처리
    await retryActivation(activation.tripId);
  }
}
```

### 3. 비활성화 후 정리 실패

**문제**: 비활성화 중 앱 종료 → 로컬 데이터 남음

**해결**: cleanupPending 플래그 + 재시도

```typescript
async function onAppStart() {
  const pendingCleanup = await db.select().from(tripActivations).where(eq(tripActivations.cleanupPending, true)).all();

  for (const activation of pendingCleanup) {
    await cleanupDeactivatedData(activation.tripId);
  }
}
```

### 4. 여러 기기 동시 활성화

**문제**: 기기 A, B에서 동시 활성화 요청

**해결**: DB Constraint + Server Lock

```sql
-- UNIQUE constraint
CREATE UNIQUE INDEX idx_active_activation
ON trip_activations(user_id, is_activated)
WHERE is_activated = true;
```

```typescript
// Server-side
async function activateTrip(userId: string, tripId: string) {
  const existing = await db.query.tripActivations.findFirst({
    where: and(eq(tripActivations.userId, userId), eq(tripActivations.isActivated, true)),
    for: 'UPDATE', // SELECT ... FOR UPDATE (Lock)
  });

  if (existing && existing.tripId !== tripId) {
    throw new ConflictError('이미 다른 여행이 활성화되어 있습니다');
  }

  // ...
}
```

### 5. 활성화 중 데이터 수정 시도

**문제**: Pull 진행 중 사용자가 수정 시도

**해결**: syncStatus 체크

```typescript
async function updateExpense(expenseId: string, data: any) {
  const tripId = await getExpenseTripId(expenseId);
  const activation = await getActivation(tripId);

  if (activation.syncStatus === 'IN_PROGRESS') {
    throw new Error('여행 데이터 준비 중입니다. 잠시만 기다려주세요');
  }

  // 정상 수정 로직
}
```

### 6. 대량 데이터 Pull 시 UI 블로킹

**문제**: 1000개 일정 삽입 중 UI 프리징

**해결**: 배치 삽입 + 진행률 업데이트

```typescript
const BATCH_SIZE = 100;
for (let i = 0; i < schedules.length; i += BATCH_SIZE) {
  const batch = schedules.slice(i, i + BATCH_SIZE);
  await db.insert(schedules).values(batch);

  const progress = ((i + BATCH_SIZE) / schedules.length) * 100;
  await updateActivationProgress(tripId, progress);

  await new Promise((resolve) => setTimeout(resolve, 10)); // UI 응답성
}
```

### 7. 라우팅 레이어 성능

**문제**: 모든 CRUD에서 활성화 상태 체크 → 반복 쿼리

**해결**: React Query 캐시

```typescript
export function useActivationStatus(tripId: string) {
return useQuery({
queryKey: activationKeys.status(tripId),
queryFn: async () => getTripMetadata(tripId),
staleTime: 5 _ 60 _ 1000, // 5분 캐시
});
}
```

### 8. 지도 다운로드 실패

**문제**: 데이터는 Pull 완료, 지도만 실패

**해결**: 별도 상태 관리

```typescript
export const tripActivations = sqliteTable('trip_activations', {
  // ...
  dataDownloaded: integer('data_downloaded', { mode: 'boolean' }),
  mapDownloaded: integer('map_downloaded', { mode: 'boolean' }),
});

// 재시도 가능
async function retryMapDownload(tripId: string) {
  const activation = await getActivation(tripId);

  if (activation.dataDownloaded && !activation.mapDownloaded) {
    await downloadOfflineMap(tripId);
  }
}
```

### 9. 자동 비활성화 알림

**문제**: 갑작스러운 비활성화에 혼란

**해결**: 사전 알림 + 만료일 표시

```typescript
// D-1 알림
async function checkExpiringActivations() {
  const tomorrow = addDays(new Date(), 1);

  const expiring = await db
    .select()
    .from(tripActivations)
    .where(
      and(
        eq(tripActivations.isActivated, true),
        lt(tripActivations.expiresAt, tomorrow.toISOString()),
        gt(tripActivations.expiresAt, new Date().toISOString()),
      ),
    )
    .all();

  for (const activation of expiring) {
    await sendNotification({
      title: '오프라인 준비 곧 해제됩니다',
      body: `${activation.destination}이 내일 자동 해제됩니다`,
      action: 'EXTEND_ACTIVATION',
    });
  }
}
```

---

## ✅ Implementation Checklist

### Phase 1: 스키마 및 기본 구조 (2일)

- [ ] `trip_metadata` 테이블 생성
- [ ] `trip_activations` 테이블 생성
- [ ] Drizzle 스키마 정의
- [ ] 마이그레이션 파일 작성
- [ ] UNIQUE constraint 추가

### Phase 2: 라우팅 레이어 (3일)

- [ ] `useActivationStatus` Hook 구현
- [ ] `getExpenses` 라우팅 로직
- [ ] `createExpense` 라우팅 로직
- [ ] `updateExpense` 라우팅 로직
- [ ] `deleteExpense` 라우팅 로직
- [ ] 네트워크 상태 체크 유틸

### Phase 3: 활성화 관리 (4일)

- [ ] `activateTrip` 구현 (Pull 로직)
- [ ] `deactivateTrip` 구현 (Cleanup 로직)
- [ ] 배치 삽입 로직
- [ ] 진행률 업데이트 로직
- [ ] 1-Trip 제한 검증
- [ ] syncStatus 관리

### Phase 4: 기존 코드 통합 (5일)

- [ ] Expense CRUD 라우팅 적용
- [ ] Schedule CRUD 라우팅 적용
- [ ] Trip 조회 로직 수정
- [ ] React Query 캐시 키 정책 수정
- [ ] UI 컴포넌트 활성화 상태 반영

### Phase 5: 테스트 및 최적화 (3일)

- [ ] 유닛 테스트 (라우팅 로직)
- [ ] 통합 테스트 (활성화 플로우)
- [ ] 엣지 케이스 테스트 (9개)
- [ ] 성능 프로파일링
- [ ] React Query 캐시 최적화

### Phase 6: 오프라인 지도 연동 (2일)

- [ ] Mapbox 다운로드 API 통합
- [ ] `mapDownloaded` 상태 관리
- [ ] 지도 파일 삭제 로직
- [ ] 재시도 로직
- [ ] 저장 공간 표시 UI

### Phase 7: 자동화 및 Background Jobs (1일)

- [ ] 자동 비활성화 Job
- [ ] 만료 알림 Job
- [ ] 미완료 정리 재시도 Job
- [ ] 앱 시작 시 복구 로직

**총 예상 기간**: 12-16일

---

## 📚 Related Documents

### Design

- [Session: 활성화 아키텍처 설계](../sessions/2025-11-06-activation-architecture-design.md) - 설계 논의 과정

### Architecture

- [CLAUDE.md](../../CLAUDE.md) - 프로젝트 가이드
- [Local Architecture](../core/local-architecture.md) - Local-First 가이드
- [Schema CLAUDE.md](../../packages/schema/CLAUDE.md) - Entity 스키마 규칙

### Implementation

- [API & Data Layer](../core/api-data.md) - API 레이어 패턴
- [Error Handling](../core/error-handling.md) - 에러 처리 패턴

---

## 🎯 Testing Strategy

### Unit Tests

```typescript
describe('Routing Layer', () => {
  it('활성화된 여행: 로컬 DB 사용', async () => {
    const tripId = await createTrip({ activated: true });
    const expenses = await getExpenses(tripId);

    expect(expenses).toBeDefined();
    // DB 호출 검증
  });

  it('비활성 + 오프라인: 에러', async () => {
    const tripId = await createTrip({ activated: false });
    setNetworkStatus('offline');

    await expect(getExpenses(tripId)).rejects.toThrow(OfflineError);
  });

  it('비활성 + 온라인: 서버 조회', async () => {
    const tripId = await createTrip({ activated: false });
    setNetworkStatus('online');

    const expenses = await getExpenses(tripId);

    // API 호출 검증
    expect(mockApi.get).toHaveBeenCalledWith(`/trips/${tripId}/expenses`);
  });
});
```

### Integration Tests

```typescript
describe('Activation Flow', () => {
  it('활성화 성공', async () => {
    const tripId = await createTrip({ activated: false });

    await activateTrip(tripId);

    const activation = await getActivation(tripId);
    expect(activation.isActivated).toBe(true);
    expect(activation.syncStatus).toBe('COMPLETED');

    const localTrip = await db.select().from(trips).where(eq(trips.id, tripId)).get();
    expect(localTrip).toBeDefined();
  });

  it('활성화 실패 복구', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network Error'));

    await expect(activateTrip(tripId)).rejects.toThrow();

    const activation = await getActivation(tripId);
    expect(activation.syncStatus).toBe('FAILED');

    const localTrip = await db.select().from(trips).where(eq(trips.id, tripId)).get();
    expect(localTrip).toBeUndefined(); // 롤백됨
  });
});
```

---

## 💡 Best Practices

### 1. 항상 라우팅 레이어 사용

```typescript
// ❌ 직접 DB 접근
const expenses = await db.select().from(expenses).all();

// ✅ 라우팅 레이어 사용
const expenses = await getExpenses(tripId);
```

### 2. React Query 캐시 활용

```typescript
// ✅ 활성화 상태 캐시
const { data: activation } = useActivationStatus(tripId);

// ❌ 매번 DB 쿼리
const activation = await getTripMetadata(tripId);
```

### 3. 오프라인 에러 명확히

```typescript
// ✅ 사용자 액션 제공
throw new OfflineError('오프라인에서 추가하려면 이 여행을 활성화해주세요', {
  action: 'ACTIVATE_PROMPT',
  tripId,
});

// ❌ 일반 에러
throw new Error('오프라인입니다');
```

### 4. Echo Protocol 유지

```typescript
// ✅ 항상 클라이언트 ID 생성
const id = ulid();
await api.post('/expenses', { id, ...data });

// ❌ 서버 ID 생성
await api.post('/expenses', data); // 서버가 ID 생성
```

---

## 🚀 Performance

### 예상 성능

| 작업        | 활성화               | 비활성           |
| ----------- | -------------------- | ---------------- |
| 목록 조회   | ~10ms (로컬)         | ~10ms (Metadata) |
| 상세 조회   | ~5ms (로컬)          | ~200ms (서버)    |
| 경비 추가   | ~20ms (로컬 + queue) | ~300ms (서버)    |
| 활성화 처리 | ~10s (1000개 일정)   | N/A              |

### 최적화 포인트

1. **React Query 캐시**: 활성화 상태 5분 캐시
2. **배치 삽입**: 100개 단위로 분할
3. **진행률 업데이트**: UI 응답성 확보
4. **백그라운드 지도 다운로드**: 사용자 대기 시간 최소화

---

## ⚠️ Limitations

1. **1-Trip 제한**: 동시에 1개만 활성화 가능
2. **비활성 온라인 필수**: 오프라인에서 비활성 여행 편집 불가
3. **자동 해제**: 여행 종료 + 7일 후 자동 비활성화 (연장 불가)
4. **재활성화 가능**: 해제 후 다시 활성화 시 Pull 재실행

---

## 📖 Glossary

- **활성화 (Activation)**: 여행을 로컬에 저장하여 오프라인 작동 가능하게 하는 상태
- **Metadata**: 여행 목록 표시용 최소 정보 (항상 로컬)
- **Full Data**: 완전한 여행 데이터 (활성화 시만 로컬)
- **라우팅 레이어**: 활성화 상태에 따라 로컬/서버 경로 결정하는 로직
- **Echo Protocol**: 클라이언트가 ID 생성, 서버가 그대로 수용하는 패턴

---

## 🏗 디렉토리 구조 및 아키텍처 관계

### Offline-Prep 서비스 위치

```text
shared/services/
├── id/
│ └── ulid.ts # ID 생성 서비스 (독립)
│
├── sync/ # 🔄 동기화 엔진
│ ├── provider.tsx # 백그라운드 동기화 Provider
│ ├── engine.ts # Push/Pull 엔진
│ ├── queue.ts # sync_queue 관리
│ ├── storage.ts # sync metadata
│ └── api.ts # Sync API 클라이언트
│
└── offline-prep/ # 📦 오프라인 준비 시스템 (활성화)
├── router.ts # routeQuery, routeMutation (라우팅)
├── metadata.ts # getTripMetadata (활성화 상태 조회)
└── manager.ts # activate, deactivate (활성화 관리 - 미래)
```

### Sync Engine vs Offline-Prep

**완전히 독립적인 두 계층**:

| 비교            | Sync Engine              | Offline-Prep                 |
| --------------- | ------------------------ | ---------------------------- |
| **책임**        | 로컬 ↔ 서버 동기화      | 데이터 소스 라우팅           |
| **동작 시점**   | 백그라운드 주기적        | Query/Mutation 시점 (실시간) |
| **트리거**      | 타이머, 네트워크 복구    | 사용자 액션 (Query 호출)     |
| **판단 기준**   | sync_queue 상태          | 여행 활성화 상태             |
| **데이터 흐름** | 로컬 → 서버, 서버 → 로컬 | 로컬 OR 원격 선택            |
| **역할**        | "언제 동기화할까?"       | "어디서 읽을까?"             |

### 관계: 독립적이지만 협력적

```text
┌─────────────────────────────────────────────────┐
│ Entity Layer (useGetExpenses) │
└─────────────────────────────────────────────────┘
↓
Offline-Prep Router (활성화 상태 확인)
↓
┌─────────────┴─────────────┐
│ │
[활성화된 여행] [비활성 여행]
↓ ↓
Local SQLite Remote Server
↓ ✓ 끝
(백그라운드)
↓
Sync Engine (주기적으로)
(push/pull)
↓
Remote Server
```

**핵심**:

- Offline-Prep: Entity 계층에서 직접 호출 (실시간 라우팅)
- Sync Engine: 백그라운드에서 독립 실행 (활성화된 여행만 관여)
- 두 시스템은 서로를 호출하지 않음 (독립적)

### lib/ vs services/ 구분

**왜 Offline-Prep이 `services/`에?**

|                 | lib/                           | services/                                 |
| --------------- | ------------------------------ | ----------------------------------------- |
| **기준**        | 순수 함수 + 범용               | Side effect OR 앱 특화                    |
| **예시**        | `formatDate`, `formatCurrency` | `pushChanges`, `generateId`, `routeQuery` |
| **재사용**      | 다른 프로젝트 OK               | 앱에 특화됨                               |
| **Side effect** | ❌ 없음                        | ✅ 있음 (DB, API, 파일 등)                |

**Offline-Prep 판단**:

- Side effect: ✅ (DB 조회, 네트워크 상태 확인)
- 앱 특화: ✅ (Noline의 활성화 시스템에 특화)
- 결론: `services/offline-prep/` ✅

---

## 🔄 롤백 전략

### 변경 범위

**변경이 필요한 파일** (13개):

| 영역              | 파일                                | 변경 타입   | 롤백 난이도 |
| ----------------- | ----------------------------------- | ----------- | ----------- |
| Schema            | `shared/db/schema.ts`               | 테이블 추가 | 🟢 쉬움     |
| Service           | `services/offline-prep/router.ts`   | 신규        | 🟢 쉬움     |
| Service           | `services/offline-prep/metadata.ts` | 신규        | 🟢 쉬움     |
| Entity (Trip)     | `data/useGetTrips.ts`               | 수정        | 🟡 중간     |
| Entity (Trip)     | `data/api/local.ts`                 | 신규        | 🟢 쉬움     |
| Entity (Trip)     | `data/api/remote.ts`                | 신규        | 🟢 쉬움     |
| Entity (Schedule) | 3개 파일                            | 동일        | 동일        |
| Entity (Expense)  | 3개 파일                            | 동일        | 동일        |

**변경이 불필요한 파일** (~50개):

- Sync 엔진 (engine.ts, queue.ts, provider.tsx)
- Mutation Hook (useCreate*, useUpdate*, useDelete\*)
- Screen, Feature 컴포넌트

### 롤백 시나리오

#### 시나리오 1: 완전 제거 (1시간 내)

```bash

# Git revert 한 방

git revert <commit-hash>

# 또는 수동

1. services/offline-prep/ 디렉토리 삭제
2. entities/*/data/api/ 디렉토리 삭제
3. entities/_/data/use_.ts 파일 원래대로 복구
4. DB: DROP TABLE trip_activations
```

**롤백 난이도**: 🟢 매우 쉬움

#### 시나리오 2: Router만 무시 (30분 내)

각 Entity의 Query Hook에서 `routeQuery` 호출 제거:

```typescript
// entities/expense/data/useGetExpenses.ts
export const useGetExpenses = ({ tripId }) => {
return useQuery({
queryKey: ['expense', 'byTrip', tripId],
queryFn: async () => {
// routeQuery 제거 → 항상 로컬

-     return await routeQuery(tripId, { local, remote });

*     return await local.getExpensesLocal(tripId);
      },
  });
  };
```

변경: 3개 파일 (Trip, Schedule, Expense)

#### 시나리오 3: 전부 로컬로 (10분 내)

Router 로직만 수정:

```typescript
// services/offline-prep/router.ts
export async function routeQuery<T>(...) {
// 항상 로컬 반환
return operations.local();
}
```

변경: 1개 파일

### 롤백 용이성: 🟢 매우 쉬움 (9/10)

**핵심 이유**:

1. ✅ **단방향 의존성**: Entity → Offline-Prep (제거 쉬움)
2. ✅ **기존 코드 영향 최소**: Sync, Mutation 무관
3. ✅ **Git으로 완벽 복구**: 커밋 단위 롤백 가능
4. ✅ **점진적 롤백 옵션**: Router만 무시 가능
5. ✅ **데이터 손실 없음**: 새 테이블 추가일 뿐

### 안전장치

#### 1. Feature Flag

```typescript
// shared/config/features.ts
export const FEATURES = {
OFFLINE_PREP_ENABLED: false, // 🚩 플래그
};

// router.ts
export async function routeQuery<T>(...) {
if (!FEATURES.OFFLINE_PREP_ENABLED) {
return operations.local(); // 기존 동작
}
// Offline-Prep 로직
const metadata = await getTripMetadata(tripId);
// ...
}
```

**장점**: 코드 변경 없이 1줄만 수정하면 On/Off

#### 2. 단계적 적용

```bash

# Phase 1: Router 추가만 (일단 항상 로컬 반환)

# Phase 2: Trip Entity만 적용 → 검증

# Phase 3: Schedule Entity 적용 → 검증

# Phase 4: Expense Entity 적용 → 검증

```

문제 발생 시 범위 최소화

#### 3. 커밋 분리 전략

```bash

# Commit 1: DB 스키마 추가

git commit -m "feat: Add trip_activations table"

# Commit 2: Offline-Prep 서비스 추가

git commit -m "feat: Add offline-prep router service"

# Commit 3: Trip Entity 적용

git commit -m "feat: Apply offline-prep to Trip entity"

# Commit 4: Schedule Entity 적용

git commit -m "feat: Apply offline-prep to Schedule entity"

# Commit 5: Expense Entity 적용

git commit -m "feat: Apply offline-prep to Expense entity"
```

커밋 단위로 롤백 가능, 문제 지점 명확히 파악

---

## 📚 참고 문서

- [Session: 아키텍처 설계](../sessions/2025-11-06-activation-architecture-design.md) - 설계 논의 전체 과정
- [CLAUDE.md](../../CLAUDE.md) - 프로젝트 전체 가이드
- [local-architecture.md](../core/local-architecture.md) - Local-First 완전 가이드
- [architecture.md](../core/architecture.md) - FSD 디렉토리 구조
