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

### trips (기존 테이블 - activated 필드 제거됨)

```typescript
export const trips = sqliteTable('trips', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  destination: text('destination').notNull(),
  country: text('country'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  baseCurrency: text('base_currency').notNull(),
  cityId: integer('city_id'),
  startDate: text('start_date').notNull(), // ISO 8601
  endDate: text('end_date').notNull(), // ISO 8601

  // Local-First 필드
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  version: integer('version').default(1).notNull(),

  // ❌ activated 필드 제거됨 (Commit #16)
  // tripActivations 테이블이 Single Source of Truth
});
```

### trip_activations (활성화 상태 관리 - Single Source of Truth)

```typescript
export const tripActivations = sqliteTable('trip_activations', {
  id: text('id').primaryKey(),
  tripId: text('trip_id')
    .notNull()
    .unique() // 여행당 1개 레코드만
    .references(() => trips.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),

  // 활성화 상태
  isActivated: integer('is_activated', { mode: 'boolean' }).notNull().default(true),
  activatedAt: text('activated_at').notNull(), // ISO string
  deactivatedAt: text('deactivated_at'), // ISO string
  expiresAt: text('expires_at').notNull(), // ISO string (여행 종료 + 7일)

  // 동기화 상태
  syncStatus: text('sync_status').notNull().default('PENDING'), // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  lastSyncAt: text('last_sync_at'), // ISO string
  syncProgress: integer('sync_progress').default(0), // 0-100 (%)

  // 정리 상태
  cleanupPending: integer('cleanup_pending', { mode: 'boolean' }).notNull().default(false),

  // 데이터 다운로드 상태 (별도 추적)
  dataDownloaded: integer('data_downloaded', { mode: 'boolean' }).notNull().default(false),
  mapDownloaded: integer('map_downloaded', { mode: 'boolean' }).notNull().default(false),

  // 저장 공간 추적
  estimatedSize: integer('estimated_size'), // bytes
  actualSize: integer('actual_size'), // bytes

  createdAt: text('created_at').notNull(), // ISO string
  updatedAt: text('updated_at').notNull(), // ISO string
});
```

---

## 🔀 라우팅 레이어 (Routing Layer)

모든 CRUD 연산은 활성화 상태에 따라 라우팅됩니다.

### 4개 Router 함수 (Trip vs Child 분리)

**핵심 아이디어**: Trip 작업과 Schedule/Expense 작업은 의미적으로 다름

| 작업 유형                    | 사용 함수                  | tripId 필요 | 체크 로직                         |
| ---------------------------- | -------------------------- | ----------- | --------------------------------- |
| Trip 조회 (GET /trips)       | `routeTripQuery`           | ❌ 불필요   | `hasAnyActivatedTrip()`           |
| Trip 생성 (POST /trips)      | `routeTripMutation`        | ❌ 불필요   | `hasAnyActivatedTrip()`           |
| Trip 수정 (PATCH /trips/:id) | `routeChildMutation`       | ✅ 필요     | `getTripActivationStatus(tripId)` |
| Schedule/Expense 모든 작업   | `routeChildQuery/Mutation` | ✅ 필요     | `getTripActivationStatus(tripId)` |

**왜 분리?**

- **Trip 생성/조회**: 특정 Trip이 아니라 "활성화 기능 사용 여부"만 중요
- **Trip/Schedule/Expense 수정**: 해당 Trip이 활성화되었는지 확인

### Metadata 조회 함수

```typescript
/**
 * 특정 여행의 활성화 상태 조회 (boolean)
 * - tripActivations 테이블 확인 (Single Source of Truth)
 * - Schedule/Expense 라우팅에서 사용
 */
export async function getTripActivationStatus(tripId: string): Promise<boolean> {
  const activation = await db.select().from(tripActivations).where(eq(tripActivations.tripId, tripId)).get();

  return !!(activation && activation.isActivated);
}

/**
 * 활성화된 여행이 하나라도 있는지 확인
 * - tripActivations 테이블 확인
 * - Trip 자체 라우팅에서 사용
 */
export async function hasAnyActivatedTrip(): Promise<boolean> {
  const activation = await db.select().from(tripActivations).limit(1).all();

  return activation.length > 0;
}

/**
 * 특정 여행의 활성화 상태 상세 조회
 * - UI에서 배지 표시용
 * @returns 'online' | 'preparing' | 'ready'
 */
export async function getTripActivationStatusDetail(tripId: string): Promise<'online' | 'preparing' | 'ready'> {
  const activation = await db.select().from(tripActivations).where(eq(tripActivations.tripId, tripId)).get();

  if (!activation || !activation.isActivated) {
    return 'online';
  }

  if (activation.mapDownloaded) {
    return 'ready';
  }

  return 'preparing';
}
```

### Router 패턴

#### 1. Trip Query (tripId 불필요)

```typescript
export async function routeTripQuery<T>(operations: { local: () => Promise<T>; remote: () => Promise<T> }): Promise<T> {
  const hasActivated = await hasAnyActivatedTrip();

  if (hasActivated) {
    // 활성화된 Trip 있음 → 로컬 DB 조회
    return await operations.local();
  } else {
    // 비활성 상태 → 서버 조회 (온라인 필수)
    const networkStatus = await getNetworkStatus();

    if (networkStatus === 'offline') {
      throw new OfflineError('오프라인에서는 활성화된 여행만 볼 수 있어요', {
        action: 'ACTIVATE_PROMPT',
      });
    }

    return await operations.remote();
  }
}
```

#### 2. Child Query (tripId 필요)

```typescript
export async function routeChildQuery<T>(
  tripId: string,
  operations: {
    local: () => Promise<T>;
    remote: () => Promise<T>;
  },
): Promise<T> {
  const isActivated = await getTripActivationStatus(tripId);

  if (isActivated) {
    // 활성화된 Trip → 로컬 DB 조회
    return await operations.local();
  } else {
    // 비활성 Trip → 서버 조회 (온라인 필수)
    const networkStatus = await getNetworkStatus();

    if (networkStatus === 'offline') {
      throw new OfflineError('오프라인에서는 활성화된 여행만 볼 수 있어요', {
        action: 'ACTIVATE_PROMPT',
        tripId,
      });
    }

    return await operations.remote();
  }
}
```

#### 3. Trip Mutation / Child Mutation

동일한 패턴으로 `routeTripMutation`, `routeChildMutation` 구현

### 구현 예시

#### CREATE (Child Mutation 사용)

```typescript
export async function createExpense(data: CreateExpenseInput) {
  return await routeChildMutation(data.tripId, {
    local: async () => {
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
    },
    remote: async () => {
      // 비활성: 서버 직접 (Echo Protocol 유지)
      const id = ulid();
      await api.post('/expenses', { id, ...data });
      return id;
    },
  });
}
```

#### READ (Child Query 사용)

```typescript
export async function getExpenses(tripId: string) {
  return await routeChildQuery(tripId, {
    local: async () => {
      // 활성화: 로컬 DB
      return await db.select().from(expenses).where(eq(expenses.tripId, tripId)).all();
    },
    remote: async () => {
      // 비활성: 서버 조회
      return await api.get(`/trips/${tripId}/expenses`);
    },
  });
}
```

#### UPDATE (Child Mutation 사용)

```typescript
export async function updateExpense(expenseId: string, data: UpdateExpenseInput) {
  const tripId = await getExpenseTripId(expenseId);

  return await routeChildMutation(tripId, {
    local: async () => {
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
    },
    remote: async () => {
      // 비활성: 서버 직접
      await api.patch(`/expenses/${expenseId}`, data);
    },
  });
}
```

#### DELETE (Child Mutation 사용 - Soft Delete)

```typescript
export async function deleteExpense(expenseId: string) {
  const tripId = await getExpenseTripId(expenseId);
  const deletedAt = new Date().toISOString();

  return await routeChildMutation(tripId, {
    local: async () => {
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
    },
    remote: async () => {
      // 비활성: 서버 직접
      await api.delete(`/expenses/${expenseId}`);
    },
  });
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
      // 5-1. 모든 Trip 메타데이터 저장 (404 버그 방지)
      await upsertTrips(fullData.trips);

      // 5-2. 기존 활성화 레코드 비활성화 (1-Trip 제한)
      await db
        .update(tripActivations)
        .set({
          isActivated: false,
          deactivatedAt: now,
          updatedAt: now,
        })
        .where(eq(tripActivations.isActivated, true));

      // 5-3. 현재 여행 활성화 레코드 생성
      const expiresAt = new Date(trip.endDate);
      expiresAt.setDate(expiresAt.getDate() + 7); // 여행 종료 + 7일

      await db.insert(tripActivations).values({
        id: ulid(),
        tripId,
        userId: trip.userId,
        isActivated: true,
        activatedAt: now,
        deactivatedAt: null,
        expiresAt: expiresAt.toISOString(),
        syncStatus: 'IN_PROGRESS',
        dataDownloaded: false,
        mapDownloaded: false,
        createdAt: now,
        updatedAt: now,
      });

      // 5-4. Schedules/Expenses 저장 (배치 처리)
      if (fullData.schedules?.length > 0) {
        await upsertSchedules(fullData.schedules);
      }

      if (fullData.expenses?.length > 0) {
        await upsertExpenses(fullData.expenses);
      }

      // 6. 활성화 완료
      await db
        .update(tripActivations)
        .set({
          syncStatus: 'COMPLETED',
          dataDownloaded: true,
          lastSyncAt: new Date().toISOString(),
        })
        .where(eq(tripActivations.tripId, tripId));
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
export async function deactivateTrip(tripId: string, cleanupData: boolean = true) {
  const now = new Date().toISOString();

  // 1. 활성화 상태 변경
  await db
    .update(tripActivations)
    .set({
      isActivated: false,
      deactivatedAt: now,
      cleanupPending: cleanupData, // 데이터 정리 여부
      updatedAt: now,
    })
    .where(eq(tripActivations.tripId, tripId));

  // 2. 로컬 데이터 정리 (선택적)
  if (cleanupData) {
    await cleanupDeactivatedData(tripId);
  }
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

**실제 구현**: 직접 service 함수 호출, React Query Hook 불필요

```typescript
// ✅ 현재 구현 (apps/client/src/shared/services/offline-prep/metadata.ts)
import { getTripActivationStatus, getTripActivationStatusDetail, hasAnyActivatedTrip } from '@/shared/services/offline-prep/metadata';

// UI 컴포넌트에서 직접 사용
const isActivated = await getTripActivationStatus(tripId); // boolean
const status = await getTripActivationStatusDetail(tripId); // 'online' | 'preparing' | 'ready'
const hasAny = await hasAnyActivatedTrip(); // boolean
```

**왜 Hook이 아닌가?**

- 활성화 상태는 tripActivations 테이블 단일 진실 공급원
- UI 컴포넌트는 useEffect에서 직접 service 함수 호출
- Trip/Expense/Schedule Hooks은 라우팅 레이어에서 자동 처리

### Data Hooks with Routing

```typescript
// ✅ 현재 구현: Entity 레이어 Hook이 라우팅 자동 처리
export function useGetTripExpenses(tripId: string) {
  return useQuery({
    queryKey: expenseQueryKeys.byTrip(tripId),
    queryFn: async () => {
      // routeChildQuery가 자동으로 활성화 상태 확인 후 라우팅
      return await routeChildQuery(tripId, {
        local: async () => {
          return await db.select().from(expenses).where(eq(expenses.tripId, tripId)).all();
        },
        remote: async () => {
          const response = await axios.get(`/api/trips/${tripId}/expenses`);
          return response.data;
        },
      });
    },
    enabled: !!tripId,
  });
}
```

---

## 🎨 UI Components

### ActivationBadge (실제 구현)

**파일**: [apps/client/src/entities/trip/ui/ActivationBadge.tsx](../../../apps/client/src/entities/trip/ui/ActivationBadge.tsx)

```tsx
// ✅ 현재 구현
export type ActivationStatus = 'online' | 'ready' | 'preparing';

export function ActivationBadge({ status }: { status: ActivationStatus }) {
  const config = {
    online: {
      icon: WifiOff,
      text: '온라인 전용',
      bgColor: 'bg-secondary',
      textColor: 'text-secondary-foreground',
    },
    ready: {
      icon: CheckCircle,
      text: '준비 완료',
      bgColor: 'bg-success/10',
      textColor: 'text-success',
    },
    preparing: {
      icon: Download,
      text: '준비 중',
      bgColor: 'bg-warning/10',
      textColor: 'text-warning',
    },
  };

  const { icon: Icon, text, bgColor, textColor, iconColor } = config[status];

  return (
    <View className={cn('flex-row items-center gap-xs rounded-full px-sm py-2xs', bgColor)}>
      <Icon size={14} color={iconColor} strokeWidth={2} />
      <Text className={cn('text-label', textColor)}>{text}</Text>
    </View>
  );
}
```

### TripCard with Activation Buttons (실제 구현)

**파일**: [apps/client/src/entities/trip/ui/TripCard.tsx](../../../apps/client/src/entities/trip/ui/TripCard.tsx)

```tsx
// ✅ 현재 구현
export function TripCard({
  destination,
  activationStatus = 'online',
  onActivatePress,
  onDeactivatePress,
  ...props
}: TripCardProps) {
  return (
    <View className='rounded-xl bg-primary p-md'>
      {/* Header with ActivationBadge */}
      <View className='flex-row justify-between'>
        <Text>{destination}</Text>
        <ActivationBadge status={activationStatus} />
      </View>

      {/* 활성화 버튼 - 비활성 상태일 때만 표시 */}
      {activationStatus === 'online' && onActivatePress && (
        <TouchableOpacity onPress={onActivatePress}>
          <Download size={18} />
          <Text>오프라인 활성화</Text>
        </TouchableOpacity>
      )}

      {/* 비활성화 버튼 - 활성 상태일 때만 표시 */}
      {(activationStatus === 'preparing' || activationStatus === 'ready') && onDeactivatePress && (
        <TouchableOpacity onPress={onDeactivatePress}>
          <Trash2 size={18} />
          <Text>오프라인 해제</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### MainTripSection (활성화 상태 조회 예시)

**파일**: [apps/client/src/screens/HomeScreen/MainTripSection.tsx](../../../apps/client/src/screens/HomeScreen/MainTripSection.tsx)

```tsx
// ✅ 현재 구현
export function MainTripSection({ mainTripData, onActivatePress }: MainTripSectionProps) {
  const [activationStatus, setActivationStatus] = useState<ActivationStatus>('online');

  useEffect(() => {
    if (!mainTripData?.id) {
      setActivationStatus('online');
      return;
    }

    const checkActivationStatus = async () => {
      try {
        const status = await getTripActivationStatusDetail(mainTripData.id);
        setActivationStatus(status);
      } catch (error) {
        console.error('❌ Failed to check activation status:', error);
        setActivationStatus('online');
      }
    };

    checkActivationStatus();
  }, [mainTripData?.id]);

  return (
    <TripCard
      {...mainTrip}
      activationStatus={activationStatus}
      onActivatePress={activationStatus !== 'online' ? undefined : () => onActivatePress(mainTripData.id, mainTrip.destination)}
    />
  );
}
```

### Activation Progress Drawer

**파일**: [apps/client/src/entities/trip/ui/ActivationProgressDrawer.tsx](../../../apps/client/src/entities/trip/ui/ActivationProgressDrawer.tsx)

```tsx
// ✅ 현재 구현
export function ActivationProgressDrawer({
  isOpen,
  onClose,
  tripName,
  progress = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  tripName: string;
  progress?: number;
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

**해결**: Router 함수 내부에서 1회만 조회

```typescript
// ✅ 현재 구현: Router 함수가 1회만 상태 확인
export async function routeChildQuery<T>(tripId: string, operations: { local, remote }): Promise<T> {
  const isActivated = await getTripActivationStatus(tripId); // 1회만 조회

  if (isActivated) {
    return await operations.local();
  } else {
    return await operations.remote();
  }
}

// Entity Hook에서 호출 시 자동으로 상태 확인됨 (추가 조회 불필요)
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

### Phase 1: 스키마 및 기본 구조 ✅ 완료 (2일)

- [x] `tripActivations` 테이블 생성 - Commit #1 (d071a02)
- [x] Drizzle 스키마 정의 - Commit #1
- [x] 인덱스 추가 - Commit #1
- [x] trips.activated 필드 제거 - Commit #16 (7192fde)

### Phase 2: 라우팅 레이어 ✅ 완료 (3일)

- [x] `getTripActivationStatus` 구현 - Commit #2 (773551a)
- [x] `hasAnyActivatedTrip` 구현 - Commit #15 (9dd9e56)
- [x] `getTripActivationStatusDetail` 구현 - Commit #21 (aec3699)
- [x] `routeTripQuery/Mutation` 구현 - Commit #15 (9dd9e56)
- [x] `routeChildQuery/Mutation` 구현 - Commit #15 (9dd9e56)
- [x] 네트워크 상태 체크 유틸 - Commit #2 (773551a)
- [x] OfflineError 클래스 - Commit #2 (773551a)

### Phase 3: 활성화 관리 ✅ 완료 (4일)

- [x] `useActivateTrip` 구현 (Pull 로직) - Commit #6 (7fa2c99)
- [x] `useDeactivateTrip` 구현 (Cleanup 로직) - Commit #6 (7fa2c99)
- [x] 서버 데이터 Pull 로직 - Commit #7 (b649bc4)
- [x] 모든 Trip 메타데이터 저장 (404 버그 해결) - Commit #15 (9dd9e56)
- [x] 1-Trip 제한 구현 - Commit #15 (9dd9e56)
- [x] syncStatus 관리 - Commit #6 (7fa2c99)
- [x] 서버 API (activate/deactivate) - Commit #6 (7fa2c99)

### Phase 4: 기존 코드 통합 ✅ 완료 (5일)

- [x] Trip CRUD 라우팅 적용 - Commit #15 (9dd9e56)
- [x] Expense CRUD 라우팅 적용 - Commit #4, #8 (491380f, 9792ce2)
- [x] Schedule CRUD 라우팅 적용 - Commit #5, #8 (e697059, 9792ce2)
- [x] React Query 캐시 키 업데이트 - Commit #15
- [x] UI 컴포넌트 활성화 상태 반영 - Commit #13 (e8d5253)

### Phase 5: UI 컴포넌트 ✅ 완료 (3일)

- [x] ActivationBadge 구현 - Commit #13 (e8d5253)
- [x] ActivationProgressDrawer 구현 - Commit #13 (e8d5253)
- [x] TripCard 활성화 버튼 - Commit #13 (e8d5253)
- [x] TripCard 비활성화 버튼 - Commit #22 (139d6d1)
- [x] HomeScreen 구조 개선 - Commit #14 (af1b26b)
- [x] MainTripSection 분리 - Commit #14 (af1b26b)
- [x] Service 레이어 사용 - Commit #21 (aec3699)

### Phase 6: 오프라인 지도 연동 ⚠️ 부분 완료 (2일)

- [x] offline-map 서비스 재구조화 - Commit #10 (39c406d)
- [x] downloadOfflineMapForTrip 구현 - Commit #10 (39c406d)
- [x] cleanupOfflineMapForTrip 구현 - Commit #10 (39c406d)
- [x] mapDownloaded 상태 관리 - Commit #10 (39c406d)
- [ ] 지도 다운로드 재시도 로직 - ❌ 미구현
- [ ] 저장 공간 표시 UI - ❌ 미구현

### Phase 7: 자동화 및 Background Jobs ❌ 미구현 (1일)

- [ ] 자동 비활성화 Job (여행 종료 + 7일)
- [ ] 만료 알림 Job
- [ ] 미완료 정리 재시도 Job
- [ ] 앱 시작 시 복구 로직

### 추가 완료 사항 (예상 외)

- [x] 통화 자동 설정 (ISO 국가 코드 기반) - Commit #17 (efe7408)
- [x] 디버그 도구 확장 - Commit #18 (7ced40e)
- [x] Schedule API Zod 검증 수정 - 현재 세션
- [x] response.data 정합성 수정 - Commit #19, #20

**실제 작업 기간**: 3일 4시간 (2025-11-16 ~ 2025-11-19, 22개 커밋)

**남은 작업**: Phase 6 일부 + Phase 7 전체

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
    const tripId = await createTrip();
    // tripActivations 레코드 생성 (활성화)
    await db.insert(tripActivations).values({
      id: ulid(),
      tripId,
      userId: 'user1',
      isActivated: true,
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      syncStatus: 'COMPLETED',
      dataDownloaded: true,
      mapDownloaded: false,
      cleanupPending: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const expenses = await getExpenses(tripId);

    expect(expenses).toBeDefined();
    // DB 호출 검증
  });

  it('비활성 + 오프라인: 에러', async () => {
    const tripId = await createTrip();
    // tripActivations 레코드 없음 (비활성)
    setNetworkStatus('offline');

    await expect(getExpenses(tripId)).rejects.toThrow(OfflineError);
  });

  it('비활성 + 온라인: 서버 조회', async () => {
    const tripId = await createTrip();
    // tripActivations 레코드 없음 (비활성)
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
    const tripId = await createTrip();

    await activateTrip(tripId);

    // tripActivations 확인 (Single Source of Truth)
    const activation = await db.select().from(tripActivations).where(eq(tripActivations.tripId, tripId)).get();
    expect(activation?.isActivated).toBe(true);
    expect(activation?.syncStatus).toBe('COMPLETED');

    const localTrip = await db.select().from(trips).where(eq(trips.id, tripId)).get();
    expect(localTrip).toBeDefined();
  });

  it('활성화 실패 복구', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Network Error'));

    await expect(activateTrip(tripId)).rejects.toThrow();

    // tripActivations 확인
    const activation = await db.select().from(tripActivations).where(eq(tripActivations.tripId, tripId)).get();
    expect(activation?.syncStatus).toBe('FAILED');

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
