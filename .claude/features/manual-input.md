# Manual Input Feature Guide

> **📋 상태**: 설계 완료 - 구현 대기중
> **버전**: v3.0
> **작성일**: 2025-11-20
> **구현 추적**: [v3.0-tracker.md](../.claude/implementation/v3.0-tracker.md) 및 문서 하단 체크리스트 참조

> **핵심**: 오프라인 환경에서도 핵심 데이터 입력을 가능하게 하는 Graceful Degradation 전략

## 📋 목차

- [개요](#개요)
- [지원 Entity](#지원-entity)
- [구현 패턴](#구현-패턴)
- [UI/UX 가이드](#uiux-가이드)
- [동기화 전략](#동기화-전략)
- [테스트 시나리오](#테스트-시나리오)

## 개요

### Manual Input이란?

네트워크가 없거나 외부 API를 사용할 수 없는 상황에서도 사용자가 핵심 데이터를 입력할 수 있도록 하는 기능입니다.

**예시**:

- 장소 검색 API 없이 일정 생성
- 환율 정보 없이 경비 기록
- GPS 없이 위치 메모

### 핵심 원칙

1. **Essential First**: 핵심 정보 우선 (제목, 날짜, 금액)
2. **Enhancement Later**: 부가 정보는 나중에 보강 (좌표, 사진, 상세주소)
3. **Transparent State**: 사용자에게 현재 상태 명확히 표시
4. **Safe Sync**: 네트워크 복구시 안전한 동기화

## 지원 Entity

### Schedule (일정)

| 필드        | 온라인 모드   | Manual 모드 | 동기화시 처리    |
| ----------- | ------------- | ----------- | ---------------- |
| id          | ULID 생성     | ULID 생성   | 그대로 유지      |
| title       | ✅ 필수       | ✅ 필수     | 그대로 유지      |
| scheduledAt | ✅ 필수       | ✅ 필수     | 그대로 유지      |
| location    | Google Places | 텍스트 입력 | 그대로 유지      |
| latitude    | 자동 입력     | null        | 나중에 보강 가능 |
| longitude   | 자동 입력     | null        | 나중에 보강 가능 |
| address     | 자동 입력     | 수동 입력   | 그대로 유지      |

```typescript
// Manual Input Schedule
{
  id: "01HGX3K5V6EXAMPLE",
  title: "에펠탑 방문",
  scheduledAt: "2024-12-28T14:00:00Z",
  location: "에펠탑",          // 수동 입력
  latitude: null,              // 나중에 보강
  longitude: null,             // 나중에 보강
  address: "파리 어딘가",      // 수동 입력
  metadata: {
    inputMode: "manual",
    createdOffline: true
  }
}
```

### Expense (경비)

| 필드        | 온라인 모드 | Manual 모드 | 동기화시 처리    |
| ----------- | ----------- | ----------- | ---------------- |
| id          | ULID 생성   | ULID 생성   | 그대로 유지      |
| amount      | ✅ 필수     | ✅ 필수     | 그대로 유지      |
| currency    | 자동 감지   | 수동 선택   | 그대로 유지      |
| category    | ✅ 필수     | ✅ 필수     | 그대로 유지      |
| description | ✅ 필수     | ✅ 필수     | 그대로 유지      |
| scheduleId  | 선택 가능   | null 가능   | 나중에 연결 가능 |
| receiptUrl  | 사진 업로드 | null        | 나중에 업로드    |

```typescript
// Manual Input Expense
{
  id: "01HGX3K5V7EXAMPLE",
  amount: 15000,
  currency: "KRW",             // 수동 선택
  category: "food",
  description: "점심 식사",
  scheduleId: null,            // 나중에 연결
  receiptUrl: null,            // 나중에 업로드
  metadata: {
    inputMode: "manual",
    exchangeRate: null         // 환율 정보 없음
  }
}
```

### Trip (여행)

**Manual Input 불가** - 정책적 결정

이유:

- 초기 메타데이터(통화, 타임존, 도시 정보) 필수
- 잘못된 설정시 전체 여행 데이터 영향
- 생성 빈도가 낮아 온라인 대기 가능

## 구현 패턴

### 1. Policy 체크

```typescript
// useCanCreateSchedule.ts
export function useCanCreateSchedule(tripId: string) {
  const policy = useAppPolicy(tripId);

  return {
    allowed: policy.createSchedule.allowed,
    mode: policy.createSchedule.mode,
    reason: policy.createSchedule.reason,
  };
}
```

### 2. Form 분기

```typescript
// CreateScheduleScreen.tsx
function CreateScheduleScreen({ tripId }) {
  const { allowed, mode, reason } = useCanCreateSchedule(tripId);

  if (!allowed) {
    return <DisabledState message={reason} />;
  }

  if (mode === 'manual-only') {
    return <ManualScheduleForm tripId={tripId} />;
  }

  return <FullScheduleForm tripId={tripId} />;
}
```

### 3. Manual Form 구현

```typescript
// ManualScheduleForm.tsx
function ManualScheduleForm({ tripId }) {
  const form = useForm({
    defaultValues: {
      title: '',
      location: '',
      date: '',
      time: '',
      notes: ''
    }
  });

  const createSchedule = useCreateSchedule();

  const onSubmit = async (data) => {
    const id = generateId();
    const scheduledAt = combineDateTimeToISO(data.date, data.time);

    await createSchedule.mutateAsync({
      id,
      tripId,
      title: data.title,
      location: data.location,     // 텍스트만
      latitude: null,              // 좌표 없음
      longitude: null,
      address: data.location,       // location과 동일
      scheduledAt,
      metadata: {
        inputMode: 'manual',
        notes: data.notes,
        networkStatus: 'offline'
      }
    });
  };

  return (
    <ScrollView>
      <FormHeader>
        <WarningBanner>
          📍 오프라인 모드: 장소 검색을 사용할 수 없습니다
        </WarningBanner>
      </FormHeader>

      <FormField>
        <Label>제목 *</Label>
        <TextInput
          {...form.register('title')}
          placeholder="일정 제목을 입력하세요"
        />
      </FormField>

      <FormField>
        <Label>장소</Label>
        <TextInput
          {...form.register('location')}
          placeholder="장소명을 직접 입력하세요"
        />
        <Hint>나중에 정확한 위치를 추가할 수 있습니다</Hint>
      </FormField>

      <FormField>
        <Label>날짜 *</Label>
        <DatePicker {...form.register('date')} />
      </FormField>

      <FormField>
        <Label>시간 *</Label>
        <TimePicker {...form.register('time')} />
      </FormField>

      <FormField>
        <Label>메모</Label>
        <TextArea
          {...form.register('notes')}
          placeholder="추가 정보를 입력하세요"
        />
      </FormField>

      <Button onPress={form.handleSubmit(onSubmit)}>
        저장
      </Button>
    </ScrollView>
  );
}
```

### 4. 데이터 저장 (with sync_queue)

```typescript
// useCreateSchedule.ts
import { routeChildMutation } from '@/shared/services/offline-prep/router';
import { withTransaction } from '@/shared/db/utils';

export function useCreateSchedule() {
  return useMutation({
    mutationFn: async (data: CreateScheduleRequest) => {
      // Router를 통해 자동으로 활성화 상태 체크 및 분기
      return await routeChildMutation(data.tripId, {
        local: async () => {
          // 활성화된 경우: Local 저장 + sync_queue
          await withTransaction(async () => {
            await db.insert(schedules).values({
              ...data,
              createdAt: getCurrentISOString(),
              updatedAt: getCurrentISOString(),
              deletedAt: null,
              version: 1,
            });

            await addToSyncQueue('schedules', data.id, 'CREATE', {
              ...data,
              metadata: {
                ...data.metadata,
                inputMode: data.latitude ? 'full' : 'manual',
              },
            });
          });
        },
        remote: async () => {
          // 비활성 상태: 서버 직접 호출
          const response = await api.post('/schedules', data);
          return response.data;
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all(),
      });
    },
  });
}
```

## UI/UX 가이드

### 상태 표시

```typescript
// ScheduleCard.tsx
function ScheduleCard({ schedule }) {
  const isManualInput = !schedule.latitude || !schedule.longitude;

  return (
    <Card>
      <CardHeader>
        <Title>{schedule.title}</Title>
        {isManualInput && (
          <Badge variant="warning">
            📍 위치 정보 없음
          </Badge>
        )}
      </CardHeader>

      <CardBody>
        <Location>
          {schedule.location || '위치 미지정'}
        </Location>

        {isManualInput && (
          <UpdateLocationButton scheduleId={schedule.id}>
            위치 추가하기
          </UpdateLocationButton>
        )}
      </CardBody>
    </Card>
  );
}
```

### 보강 UI

```typescript
// UpdateLocationModal.tsx
function UpdateLocationModal({ scheduleId, isOpen, onClose }) {
  const schedule = useGetSchedule(scheduleId);
  const updateSchedule = useUpdateSchedule();
  const [location, setLocation] = useState(null);

  const handleSave = async () => {
    if (location) {
      await updateSchedule.mutateAsync({
        id: scheduleId,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>위치 정보 추가</ModalHeader>

      <ModalBody>
        <Text>"{schedule.title}"의 정확한 위치를 검색하세요</Text>

        <LocationSearch
          initialQuery={schedule.location}
          onSelect={setLocation}
        />

        {location && (
          <MapPreview
            latitude={location.latitude}
            longitude={location.longitude}
          />
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onPress={onClose}>
          취소
        </Button>
        <Button onPress={handleSave} disabled={!location}>
          저장
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

## 동기화 전략

### 1. 네트워크 복구시

```typescript
// SyncProvider.tsx
useEffect(() => {
  if (previousStatus === 'offline' && networkStatus === 'online') {
    // Manual input 데이터 보강
    enhanceManualData();

    // 일반 동기화
    executeSync('Network recovery');
  }
}, [networkStatus]);

async function enhanceManualData() {
  // Manual input으로 생성된 Schedule 조회
  const manualSchedules = await db
    .select()
    .from(schedules)
    .where(and(isNull(schedules.latitude), isNotNull(schedules.location)));

  for (const schedule of manualSchedules) {
    try {
      // Google Places로 좌표 검색
      const location = await searchPlace(schedule.location);

      if (location) {
        await updateSchedule({
          id: schedule.id,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        });
      }
    } catch (error) {
      console.log(`Failed to enhance ${schedule.id}`);
    }
  }
}
```

### 2. Sync Queue 처리

```typescript
// Manual input 데이터도 일반 데이터와 동일하게 처리
async function pushChanges() {
  const pendingTasks = await getPendingTasks();

  for (const task of pendingTasks) {
    const payload = task.data;

    // Manual input 표시 (서버 로깅용)
    if (payload.metadata?.inputMode === 'manual') {
      payload._manualInput = true;
    }

    await api[task.action.toLowerCase()](`/${task.entityType}`, payload);

    await markTaskComplete(task.id);
  }
}
```

## 테스트 시나리오

### 시나리오 1: 오프라인 Schedule 생성

```typescript
describe('Manual Schedule Creation', () => {
  it('오프라인에서 Schedule 생성 가능', async () => {
    // Given: 오프라인 + 활성화 상태
    mockNetworkStatus('offline');
    mockActivationStatus(true);

    // When: Manual form으로 생성
    const schedule = await createSchedule({
      title: '에펠탑 방문',
      location: '에펠탑',
      scheduledAt: '2024-12-28T14:00:00Z',
    });

    // Then: 좌표 없이 저장됨
    expect(schedule.latitude).toBeNull();
    expect(schedule.longitude).toBeNull();
    expect(schedule.location).toBe('에펠탑');

    // And: sync_queue에 추가됨
    const syncTask = await getSyncTask(schedule.id);
    expect(syncTask).toBeDefined();
    expect(syncTask.metadata.inputMode).toBe('manual');
  });
});
```

### 시나리오 2: 네트워크 복구시 보강

```typescript
describe('Data Enhancement', () => {
  it('네트워크 복구시 좌표 자동 보강', async () => {
    // Given: Manual input Schedule
    const schedule = await createManualSchedule({
      location: 'Eiffel Tower',
    });
    expect(schedule.latitude).toBeNull();

    // When: 온라인 전환
    mockNetworkStatus('online');
    await enhanceManualData();

    // Then: 좌표가 보강됨
    const enhanced = await getSchedule(schedule.id);
    expect(enhanced.latitude).toBe(48.8584);
    expect(enhanced.longitude).toBe(2.2945);
  });
});
```

### 시나리오 3: 동기화 안전성

```typescript
describe('Sync Safety', () => {
  it('Manual input 데이터도 정상 동기화', async () => {
    // Given: Manual input Schedule
    const schedule = await createManualSchedule({
      title: 'Test Schedule',
    });

    // When: Sync 실행
    await executeSync();

    // Then: 서버에 전송됨
    const serverData = await api.get(`/schedules/${schedule.id}`);
    expect(serverData).toBeDefined();
    expect(serverData._manualInput).toBe(true);
  });
});
```

## 모범 사례

### Do's ✅

1. **핵심 정보 우선**: 제목, 날짜, 금액 등 필수 정보 강조
2. **상태 명확히 표시**: Manual input 데이터임을 시각적으로 구분
3. **보강 기회 제공**: 온라인시 데이터 개선 UI 제공
4. **메타데이터 보존**: inputMode, networkStatus 등 컨텍스트 저장

### Don'ts ❌

1. **가짜 데이터 생성 금지**: 없는 좌표를 임의로 생성하지 않기
2. **자동 보강 강제 금지**: 사용자 동의 없이 데이터 변경하지 않기
3. **Manual 데이터 차별 금지**: sync_queue에서 동일하게 처리

## FAQ

### Q: Manual input 데이터의 품질 관리?

A: 다음 전략으로 관리합니다:

1. 시각적 구분 (Badge, Icon)
2. 온라인시 보강 제안
3. 리포트에서 별도 표시
4. 데이터 완성도 점수 표시

### Q: 사진/영수증은 어떻게?

A: 오프라인에서는 건너뛰고, 온라인 복구시 추가:

```typescript
// 1. Manual 생성시 receiptUrl = null
// 2. 온라인 복구시 "영수증 추가" 버튼 표시
// 3. 사용자가 사진 업로드
// 4. Update mutation으로 receiptUrl 추가
```

### Q: 충돌 해결은?

A: Last-Write-Wins + 메타데이터 보존:

```typescript
{
  // Manual input
  location: "에펠탑",
  latitude: null,

  // 나중에 보강
  location: "에펠탑",      // 유지
  latitude: 48.8584,       // 추가
  longitude: 2.2945,       // 추가

  // 충돌시: 최신 버전 우선
  updatedAt: "2024-12-28T16:00:00Z"
}
```

## 구현 추적

> **📋 Implementation Tracker**: [v3.0-tracker.md](../implementation/v3.0-tracker.md)
>
> Phase 3에서 Manual Input 구현 예정

## 관련 문서

- [Policy Architecture (설계)](../core/policy-architecture.md)
- [Selective Activation (구현 완료)](../core/selective-activation-architecture.md)
- [Decision: Data/Service 분리](../decisions/2025-11-20-data-service-separation.md)
- [v3.0 Implementation Tracker](../implementation/v3.0-tracker.md)
