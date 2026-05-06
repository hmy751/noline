# Deactivation Sync Queue Safety

## 날짜

2025-11-20

## 상태

✅ Accepted & Implemented

## 컨텍스트

### 배경

Noline 프로젝트는 **Local-First** 아키텍처를 채택하여 오프라인 환경에서도 완벽하게 작동하는 여행 관리 앱입니다. 사용자가 여행을 비활성화할 때 로컬 데이터(schedules, expenses)를 정리하는 과정에서 **데이터 손실 위험**이 발견되었습니다.

### 문제 정의

#### AS-IS (기존 구현의 문제점)

**Hard delete로 인한 데이터 손실 시나리오**:

1. 오프라인 환경에서 사용자가 expense 생성
2. `sync_queue`에 `CREATE` 작업이 PENDING 상태로 추가됨
3. 네트워크 연결 없음 (서버 전송 안 됨)
4. 사용자가 여행 비활성화 실행 (`cleanupData: true`)
5. **Hard delete 즉시 실행** → expense가 로컬 DB에서 완전히 삭제됨
6. 나중에 네트워크 복구
7. Background sync가 `sync_queue`의 `CREATE` 작업 시도
8. **❌ 문제 발생**: 로컬 DB에 expense가 없음 → payload를 읽을 수 없음 → 404 에러
9. **결과**: **데이터 영구 손실** 💀

**코드 분석**:

```typescript
// useDeactivateTrip.ts (기존 코드)
if (cleanupData) {
  // ❌ sync_queue 체크 없이 즉시 Hard delete
  await db.delete(schedules).where(eq(schedules.tripId, tripId));
  await db.delete(expenses).where(eq(expenses.tripId, tripId));
}
```

**위험성**:

- sync_queue 확인 없음
- 원자성 보장 없음 (withTransaction 미사용)
- 데이터 복구 불가능

---

## 결정

### TO-BE: 3단계 삭제 시스템

데이터 안전성을 보장하면서도 사용자 경험을 해치지 않는 **3단계 삭제 시스템**을 도입합니다.

#### Phase 1: 비활성화 (즉시, 사용자 대기 없음)

```typescript
// 1. isActivated: false 설정
await db.update(tripActivations).set({
  isActivated: false,
  deactivatedAt: now,
});

// 2. sync_queue 체크
const hasPending = await hasPendingTasksForTrip(tripId);

if (hasPending) {
  // PENDING 있음 → cleanup 지연
  await db.update(tripActivations).set({ cleanupPending: true });
} else {
  // PENDING 없음 → Soft delete 즉시 실행
  await db.update(schedules).set({ deletedAt: now });
  await db.update(expenses).set({ deletedAt: now });
}
```

#### Phase 2: Soft Delete (Background, Sync 완료 후)

```typescript
// Background Sync (pushChanges) 완료 후 자동 실행
export async function processPendingCleanups() {
  const pendingCleanups = await db.select().from(tripActivations).where(eq(tripActivations.cleanupPending, true));

  for (const activation of pendingCleanups) {
    const hasPending = await hasPendingTasksForTrip(activation.tripId);

    if (!hasPending) {
      // sync_queue 비었음 → Soft delete 실행
      await db.update(schedules).set({ deletedAt: now });
      await db.update(expenses).set({ deletedAt: now });
      await db.update(tripActivations).set({ cleanupPending: false });
    }
  }
}
```

#### Phase 3: Hard Delete (Vacuum, 7일 후)

```typescript
// 7일 지난 Soft delete 레코드 Hard delete
export async function vacuumDeletedRecords() {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 7);

  await withTransaction(async () => {
    // deletedAt < 7일 전인 레코드 Hard delete
    await db
      .delete(schedules)
      .where(and(isNotNull(schedules.deletedAt), lt(schedules.deletedAt, thresholdDate.toISOString())));

    await db
      .delete(expenses)
      .where(and(isNotNull(expenses.deletedAt), lt(expenses.deletedAt, thresholdDate.toISOString())));
  });
}
```

---

## 대안 검토

| 방안                        | 장점                                                          | 단점                                                   | 결정        |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ | ----------- |
| **A. Hard delete (기존)**   | • 구현 간단<br>• 즉시 저장 공간 확보                          | • **데이터 손실 위험**<br>• sync 실패 시 복구 불가     | ❌ 폐기     |
| **B. Soft delete만**        | • 데이터 안전<br>• sync 완료 보장                             | • 저장 공간 계속 차지<br>• 장기적 용량 문제            | ❌ 불충분   |
| **C. Soft delete + Vacuum** | • **데이터 안전**<br>• **저장 공간 회수**<br>• sync 완료 보장 | • 구현 복잡도 증가<br>• 3단계 프로세스 관리            | ✅ **선택** |
| **D. 동기화 대기**          | • 안전<br>• 단순                                              | • **사용자 대기 시간 증가**<br>• 오프라인 시 무한 대기 | ❌ UX 악화  |

### 선택 이유: C안 (Soft delete + Vacuum)

**핵심 가치 우선순위**:

1. 🥇 **데이터 안전성** - Local-First 철학의 핵심
2. 🥈 **사용자 경험** - 즉시 비활성화 (대기 없음)
3. 🥉 **저장 공간 효율** - 7일 후 자동 회수

**트레이드오프 분석**:

- **복잡도 증가**: +265 lines (cleanup-job.ts), 3단계 프로세스
- **vs 안전성 확보**: 데이터 손실 방지, sync 완료 보장
- **결론**: 복잡도는 수용 가능. **안전성이 더 중요**.

---

## 구현 세부사항

### 1. sync_queue Helper 함수 추가

**파일**: `apps/client/src/shared/services/sync/queue.ts`

```typescript
/**
 * 특정 여행의 PENDING 작업 존재 여부 확인
 */
export async function hasPendingTasksForTrip(tripId: string): Promise<boolean> {
  const tasks = await getPendingTasksForTrip(tripId);
  return tasks.length > 0;
}

/**
 * 특정 여행의 PENDING 작업 조회
 */
export async function getPendingTasksForTrip(tripId: string): Promise<SyncQueueItem[]> {
  const tasks = await db.select().from(syncQueue).where(eq(syncQueue.status, 'PENDING')).all();

  // Trip 자체 또는 Child Entity (schedules, expenses) 필터링
  return tasks.filter((task) => {
    if (task.tableName === 'trips' && task.recordId === tripId) return true;
    if (task.tableName === 'schedules' || task.tableName === 'expenses') {
      try {
        const payload = JSON.parse(task.payload);
        return payload.tripId === tripId;
      } catch {
        return false;
      }
    }
    return false;
  });
}
```

**변경 통계**: +63 lines

---

### 2. useDeactivateTrip 개선

**파일**: `apps/client/src/entities/trip/data/useDeactivateTrip.ts`

**주요 변경사항**:

1. sync_queue 체크 추가
2. Hard delete → Soft delete 변경
3. withTransaction 사용으로 원자성 보장
4. cleanupPending 플래그 활용

```typescript
// 3. sync_queue 체크
const hasPending = await hasPendingTasksForTrip(tripId);

// 4. 트랜잭션으로 원자성 보장
await withTransaction(async () => {
  await db.update(tripActivations).set({
    isActivated: false,
    deactivatedAt: now,
    cleanupPending: cleanupData && hasPending, // 플래그 설정
    updatedAt: now,
  });

  // PENDING 없으면 즉시 Soft delete
  if (cleanupData && !hasPending) {
    await db.update(schedules).set({
      deletedAt: now,
      version: sql`${schedules.version} + 1`,
    });
    await db.update(expenses).set({
      deletedAt: now,
      version: sql`${expenses.version} + 1`,
    });
  }
});
```

**변경 통계**: +71 lines, -17 lines

---

### 3. Background Cleanup Job 생성

**파일**: `apps/client/src/shared/services/sync/cleanup-job.ts` (신규)

**주요 함수**:

#### processPendingCleanups()

```typescript
export async function processPendingCleanups(): Promise<number> {
  // 1. cleanupPending = true인 여행 조회
  const pendingCleanups = await db.select().from(tripActivations).where(eq(tripActivations.cleanupPending, true)).all();

  // 2. 각 여행에 대해 cleanup 시도
  for (const activation of pendingCleanups) {
    await processCleanupForTrip(activation.tripId);
  }

  // 3. Vacuum 실행 (7일 지난 레코드 Hard delete)
  await vacuumDeletedRecords();

  return processedCount;
}
```

#### vacuumDeletedRecords()

```typescript
export async function vacuumDeletedRecords(): Promise<{ schedules: number; expenses: number }> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - VACUUM_THRESHOLD_DAYS); // 7일

  await withTransaction(async () => {
    // Hard delete: deletedAt < 7일 전
    await db
      .delete(schedules)
      .where(and(isNotNull(schedules.deletedAt), lt(schedules.deletedAt, thresholdDate.toISOString())));

    await db
      .delete(expenses)
      .where(and(isNotNull(expenses.deletedAt), lt(expenses.deletedAt, thresholdDate.toISOString())));
  });
}
```

#### forceCleanupTrip()

```typescript
// 디버깅/긴급 상황용 강제 cleanup
export async function forceCleanupTrip(tripId: string): Promise<void> {
  // sync_queue 체크 없이 즉시 Soft delete
  // ⚠️ 주의: 동기화되지 않은 데이터 손실 가능
}
```

**변경 통계**: +265 lines (신규 파일)

---

### 4. Sync Engine 통합

**파일**: `apps/client/src/shared/services/sync/engine.ts`

```typescript
export async function pushChanges(): Promise<void> {
  // ... sync_queue 처리 ...

  console.log(`✅ [Sync] Push completed`);

  // Push 완료 후 자동으로 pending cleanup 처리
  try {
    const processedCount = await processPendingCleanups();
    if (processedCount > 0) {
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['trip'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['expense'] });
    }
  } catch (error) {
    console.error('⚠️ Failed to process pending cleanups (ignored):', error);
    // cleanup 실패해도 Push는 성공으로 처리
  }
}
```

**변경 통계**: +17 lines

---

### 5. 앱 시작 시 Cleanup 재시도

**파일**: `apps/client/app/_layout.tsx`

```typescript
/**
 * Pending Cleanup 재시도 트리거
 *
 * 앱 시작 시 cleanupPending = true인 여행을 찾아서
 * sync_queue가 비어있으면 cleanup 실행
 */
function PendingCleanupTrigger() {
  useEffect(() => {
    const retryPendingCleanups = async () => {
      try {
        const processedCount = await processPendingCleanups();
        if (processedCount > 0) {
          // React Query 캐시 무효화
          queryClient.invalidateQueries({ queryKey: ['trip'] });
          queryClient.invalidateQueries({ queryKey: ['schedule'] });
          queryClient.invalidateQueries({ queryKey: ['expense'] });
        }
      } catch (error) {
        console.error('⚠️ Failed to process pending cleanups:', error);
      }
    };

    // 2초 지연 (DB 초기화 대기)
    const timer = setTimeout(retryPendingCleanups, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

// App component에 추가
<PendingCleanupTrigger />
```

**변경 통계**: +46 lines

---

## 핵심 패턴

### 1. withTransaction 패턴

**모든 DB 작업은 withTransaction으로 원자성 보장**:

```typescript
await withTransaction(async () => {
  await db.update(tripActivations).set({ ... });
  await db.update(schedules).set({ ... });
  await db.update(expenses).set({ ... });
  // 하나라도 실패하면 전체 롤백
});
```

### 2. Soft Delete 패턴

**deletedAt 필드로 논리 삭제**:

```typescript
// ✅ Good: Soft delete
await db.update(schedules).set({
  deletedAt: getCurrentISOString(),
  version: sql`${schedules.version} + 1`,
});

// ❌ Bad: Hard delete (기존)
await db.delete(schedules);
```

### 3. cleanupPending 플래그 패턴

**2단계 cleanup 제어**:

```typescript
// Phase 1: 플래그 설정
await db.update(tripActivations).set({ cleanupPending: true });

// Phase 2: Background job이 확인 후 실행
const pendingCleanups = await db.select().from(tripActivations).where(eq(tripActivations.cleanupPending, true));
```

---

## 영향 범위

### 핵심 시스템

- **Offline-Prep** (여행 비활성화)
- **Sync Engine** (Background cleanup 통합)

### 관련 Entity

- `schedules`, `expenses` - Soft delete 대상
- `tripActivations` - cleanupPending 플래그 관리
- `sync_queue` - PENDING 작업 확인

### 사용자 경험

| 항목          | 기존        | 개선 후              |
| ------------- | ----------- | -------------------- |
| 비활성화 속도 | 즉시        | **즉시** (변화 없음) |
| 데이터 안전성 | ❌ 위험     | ✅ **안전**          |
| 저장 공간     | 즉시 회수   | **7일 후 회수**      |
| 오프라인 작동 | 데이터 손실 | **손실 방지**        |

---

## 실행 시점

### processPendingCleanups() 자동 실행

1. **Background Sync 완료 후** - `pushChanges()` 종료 시
2. **앱 시작 시** - `PendingCleanupTrigger` (2초 지연)
3. **수동 트리거** - 디버깅용 (선택)

### vacuumDeletedRecords() 자동 실행

- `processPendingCleanups()` 완료 후 매번 실행
- 7일 지난 레코드만 Hard delete

---

## 테스트 시나리오

### Scenario 1: 정상 케이스 (sync_queue 비어있음)

```
1. 사용자가 Deactivate 클릭
2. hasPendingTasksForTrip() → false
3. 즉시 Soft delete 실행
4. 완료! (0.1초 소요)
```

### Scenario 2: sync_queue PENDING 있음

```
1. 오프라인에서 expense 생성 → sync_queue에 PENDING
2. 사용자가 Deactivate 클릭
3. hasPendingTasksForTrip() → true
4. cleanupPending: true 설정, cleanup 스킵
5. 완료! (0.1초 소요, 사용자 대기 없음)
---
[나중에]
6. 네트워크 복구 → Background Sync 실행
7. sync_queue 비워짐 (expense 서버 전송 완료)
8. processPendingCleanups() 자동 호출
9. Soft delete 실행
10. cleanupPending: false
```

### Scenario 3: 앱 강제 종료 후 재시작

```
1. Scenario 2의 Step 5에서 앱 강제 종료
2. 앱 재시작
3. PendingCleanupTrigger 실행 (2초 후)
4. cleanupPending: true인 여행 발견
5. sync_queue 체크 → 비어있음
6. Soft delete 실행
7. cleanupPending: false
```

### Scenario 4: Vacuum (7일 후)

```
Day 0: Soft delete (deletedAt 설정)
Day 1-6: SELECT * FROM schedules WHERE deletedAt IS NULL (UI에 안 보임)
Day 7+: vacuumDeletedRecords() 실행 → Hard delete → 저장 공간 회수
```

---

## 통계

| 항목      | 수치                     |
| --------- | ------------------------ |
| 변경 파일 | 5개                      |
| 신규 파일 | 1개 (cleanup-job.ts)     |
| 추가 코드 | +445 lines               |
| 삭제 코드 | -17 lines                |
| 순 증가   | +428 lines               |
| 새 함수   | 6개                      |
| 영향 정책 | 4개 (Critical 2, High 2) |

---

## 참고 문서

### 프로젝트 문서

- `.claude/context/selective-activation-architecture.md` - Offline-Prep 시스템 아키텍처
- `.claude/context/activation-system.md` - Activation 가이드
- `CLAUDE.md:256` - Soft Delete 패턴 정책

### 관련 Session

- 없음 (이번 구현이 최초)

### 관련 커밋

- **f0b5039** - `feat: apps/client, deactivate 기능 중 sync_queue cleanup 로직 추가`
  - 2025-11-20 02:08:45
  - 5 files changed, 445 insertions(+), 17 deletions(-)

---

## 향후 고려사항

### 1. VACUUM_THRESHOLD_DAYS 튜닝

- 현재: 7일 고정
- 고려: 사용자 설정 또는 여행 유형별 조정

### 2. UI 피드백 개선

- "동기화 대기 중..." 상태 표시
- cleanup 진행률 표시 (선택적)

### 3. 모니터링

- cleanup 실패율 추적
- vacuum 실행 통계
- 저장 공간 회수량 측정

### 4. 에러 처리 강화

- cleanup 실패 시 재시도 로직
- 사용자 알림 (선택적)

---

## 결론

이번 결정을 통해 **데이터 안전성**과 **사용자 경험**을 모두 확보했습니다:

✅ **데이터 손실 방지** - sync 완료 보장
✅ **즉시 비활성화** - 사용자 대기 없음
✅ **저장 공간 회수** - 7일 후 자동
✅ **Local-First 철학 준수** - 오프라인 우선

복잡도가 증가했지만 (+428 lines), **안전성 확보**라는 핵심 가치를 달성했습니다.
