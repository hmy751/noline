# Offline Routing Feature Guide

> Mapbox Directions API 기반 오프라인 경로 저장 및 표시 구현 가이드

## 📌 개요

**목적**: 일정 간 이동 경로를 미리 다운로드하여 오프라인 환경에서도 도로 경로 표시

**핵심 기능**:

- 일정 생성/수정 시 자동 경로 다운로드 (3가지 이동 수단)
- Mapbox Directions API → polyline6 압축 → SQLite 저장
- 사용자가 이동 수단 선택 (도보/자전거/자동차)
- 저장된 경로는 실제 도로 표시, 미저장은 직선 표시

## 🏗 아키텍처

### 데이터 흐름

```
┌─────────────────────────────────────────────────────┐
│ 1. User: Schedule 생성/수정                         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. useCreateScheduleForm / UpdateScheduleDrawer     │
│    - Schedule 저장 성공                              │
│    - autoDownloadRoutes() 호출                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. useAutoDownloadRoutes (Mutation)                │
│    ├─ 좌표 있는 일정만 필터링                        │
│    ├─ scheduledAt 기준 정렬                         │
│    ├─ For 3 profiles (walking/cycling/driving):    │
│    │   ├─ 숙소 → 첫 일정                             │
│    │   └─ 일정 → 일정 (순차)                         │
│    └─ Mapbox Directions API 호출                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. Mapbox Directions API                            │
│    - from/to 좌표 + profile                         │
│    - 응답: { geometry, distance, duration }         │
│    - geometry: polyline6 압축 문자열                │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. SQLite 저장 (routes 테이블)                      │
│    - id: ULID (generateId)                          │
│    - tripId, fromScheduleId, toScheduleId           │
│    - profile, geometry, distance, duration          │
│    - Echo Protocol 필드들 (createdAt, version...)   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. OfflineScheduleMapView                           │
│    - useGetRoutes({ tripId }) → 로컬 DB 조회        │
│    - selectedProfile 기준 필터링                    │
│    - decodePolyline(geometry) → [lng, lat][]       │
│    - MapboxGL.LineLayer로 렌더링                    │
└─────────────────────────────────────────────────────┘
```

### 파일 구조

```
apps/client/src/
├── entities/route/
│   ├── data/
│   │   ├── useGetRoutes.ts             # 경로 조회 Query
│   │   ├── useSaveRoute.ts             # 단일 경로 저장 (미사용)
│   │   └── useAutoDownloadRoutes.ts    # 자동 다운로드 Mutation ⭐
│   └── index.ts
├── features/schedule/
│   ├── create-schedule/
│   │   └── useCreateScheduleForm.ts    # 생성 시 경로 다운로드
│   └── update-schedule/
│       └── UpdateScheduleDrawer.tsx    # 수정 시 경로 재다운로드
├── shared/
│   ├── db/
│   │   └── schema.ts                   # routes 테이블 정의
│   ├── services/directions/
│   │   ├── mapbox.ts                   # Mapbox Directions API ⭐
│   │   └── index.ts
│   ├── lib/
│   │   └── mapbox.ts                   # decodePolyline() 유틸 ⭐
│   └── components/Map/
│       └── OfflineScheduleMapView.tsx  # 경로 렌더링 컴포넌트 ⭐
```

## 💻 구현 상세

### 1. DB 스키마 (routes)

**위치**: `apps/client/src/shared/db/schema.ts`

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const routes = sqliteTable('routes', {
  // Echo Protocol 필드
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  version: integer('version').default(1).notNull(),

  // 비즈니스 필드
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  fromScheduleId: text('from_schedule_id').references(() => schedules.id, { onDelete: 'cascade' }), // null = 숙소
  toScheduleId: text('to_schedule_id')
    .notNull()
    .references(() => schedules.id, { onDelete: 'cascade' }),

  // Mapbox Directions API 응답
  profile: text('profile').notNull(), // 'walking' | 'cycling' | 'driving-traffic'
  geometry: text('geometry').notNull(), // polyline6 압축 문자열
  distance: integer('distance').notNull(), // meters
  duration: integer('duration').notNull(), // seconds
});

export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
```

**특징**:

- `fromScheduleId`: `null`이면 숙소 출발
- `geometry`: Mapbox polyline6 포맷 (Google polyline5와 다름!)
- Foreign Key cascade: Schedule 삭제 시 경로도 자동 삭제

### 2. Mapbox Directions API 서비스

**위치**: `apps/client/src/shared/services/directions/mapbox.ts`

```typescript
import { EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } from '@env';

export type MapboxProfile = 'walking' | 'cycling' | 'driving-traffic';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

interface DirectionsResponse {
  geometry: string; // polyline6 encoded
  distance: number; // meters
  duration: number; // seconds
}

export async function getDirections({
  from,
  to,
  profile = 'walking',
}: {
  from: Coordinate;
  to: Coordinate;
  profile?: MapboxProfile;
}): Promise<DirectionsResponse> {
  const accessToken = EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Mapbox access token is not configured');
  }

  // Mapbox Directions API v5
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?access_token=${accessToken}&geometries=polyline6&overview=full`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Mapbox Directions API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No routes found');
  }

  const route = data.routes[0];

  return {
    geometry: route.geometry, // polyline6 string
    distance: Math.round(route.distance), // meters
    duration: Math.round(route.duration), // seconds
  };
}
```

**핵심 포인트**:

- `geometries=polyline6`: 압축률 높은 polyline6 사용 (Google의 polyline5와 다름)
- `overview=full`: 전체 경로 반환 (simplified 아님)
- 좌표 순서: `${longitude},${latitude}` (위도/경도 순서 주의!)

### 3. Polyline 디코딩 유틸

**위치**: `apps/client/src/shared/lib/mapbox.ts`

```typescript
import polyline from '@mapbox/polyline';

/**
 * Mapbox polyline6 문자열을 Mapbox 좌표 배열로 디코딩
 * @param encoded polyline6 인코딩 문자열
 * @returns [lng, lat][] 배열 (Mapbox 포맷)
 */
export function decodePolyline(encoded: string): [number, number][] {
  // @mapbox/polyline은 [lat, lng] 반환
  const decoded = polyline.decode(encoded, 6); // precision 6

  // Mapbox는 [lng, lat] 필요 → 순서 변경
  return decoded.map(([lat, lng]) => [lng, lat]);
}

/**
 * Mapbox 좌표 배열을 polyline6 문자열로 인코딩
 * @param coords [lng, lat][] 배열
 * @returns polyline6 인코딩 문자열
 */
export function encodePolyline(coords: [number, number][]): string {
  // [lng, lat] → [lat, lng] 변환
  const flipped = coords.map(([lng, lat]) => [lat, lng]);
  return polyline.encode(flipped, 6);
}
```

**주의사항**:

- `@mapbox/polyline` 라이브러리 사용 (Google polyline과 다름)
- precision 6 명시 필수 (기본값 5)
- 좌표 순서 변환 주의!

### 4. 자동 경로 다운로드 Mutation

**위치**: `apps/client/src/entities/route/data/useAutoDownloadRoutes.ts`

**핵심 로직**:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateId } from '@/shared/services/id/ulid';
import { db, routes } from '@/shared/db';
import { getDirections, type MapboxProfile } from '@/shared/services/directions/mapbox';
import type { NewRoute } from '@/shared/db/schema';

interface Schedule {
  id: string;
  latitude?: number;
  longitude?: number;
}

interface DownloadRoutesParams {
  tripId: string;
  schedules: Schedule[];
  accommodationCoords?: { latitude: number; longitude: number };
}

const PROFILES: MapboxProfile[] = ['walking', 'cycling', 'driving-traffic'];

export function useAutoDownloadRoutes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, schedules, accommodationCoords }: DownloadRoutesParams) => {
      const now = new Date().toISOString();
      const newRoutes: NewRoute[] = [];

      // 좌표가 있는 일정만 필터링
      const schedulesWithCoords = schedules.filter(
        (s) => s.latitude && s.longitude && !isNaN(s.latitude) && !isNaN(s.longitude),
      );

      if (schedulesWithCoords.length === 0) {
        return { downloaded: 0 };
      }

      // 1. 숙소 → 첫 일정 (있는 경우)
      if (accommodationCoords && schedulesWithCoords[0]) {
        const firstSchedule = schedulesWithCoords[0];

        for (const profile of PROFILES) {
          try {
            const directions = await getDirections({
              from: { latitude: accommodationCoords.latitude, longitude: accommodationCoords.longitude },
              to: { latitude: firstSchedule.latitude!, longitude: firstSchedule.longitude! },
              profile,
            });

            newRoutes.push({
              id: generateId(), // ✅ Echo Protocol
              tripId,
              fromScheduleId: null, // 숙소
              toScheduleId: firstSchedule.id,
              profile,
              geometry: directions.geometry,
              distance: directions.distance,
              duration: directions.duration,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
              version: 1,
            });
          } catch (error) {
            console.error(`Failed to download route (accommodation → ${firstSchedule.id}, ${profile}):`, error);
          }
        }
      }

      // 2. 일정 → 일정 경로들
      for (let i = 0; i < schedulesWithCoords.length - 1; i++) {
        const currentSchedule = schedulesWithCoords[i];
        const nextSchedule = schedulesWithCoords[i + 1];

        for (const profile of PROFILES) {
          try {
            const directions = await getDirections({
              from: { latitude: currentSchedule.latitude!, longitude: currentSchedule.longitude! },
              to: { latitude: nextSchedule.latitude!, longitude: nextSchedule.longitude! },
              profile,
            });

            newRoutes.push({
              id: generateId(),
              tripId,
              fromScheduleId: currentSchedule.id,
              toScheduleId: nextSchedule.id,
              profile,
              geometry: directions.geometry,
              distance: directions.distance,
              duration: directions.duration,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
              version: 1,
            });
          } catch (error) {
            console.error(`Failed to download route (${currentSchedule.id} → ${nextSchedule.id}, ${profile}):`, error);
          }
        }
      }

      // 3. DB에 일괄 저장
      if (newRoutes.length > 0) {
        await db.insert(routes).values(newRoutes).run();
      }

      return { downloaded: newRoutes.length };
    },
    onSuccess: (_, variables) => {
      // 경로 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['routes', 'trip', variables.tripId] });
      console.log(`✅ Downloaded ${_.downloaded} routes for trip ${variables.tripId}`);
    },
    onError: (error) => {
      console.error('Failed to download routes:', error);
    },
  });
}
```

**특징**:

- **3가지 profile 모두 다운로드**: 사용자가 나중에 선택 가능
- **에러 처리**: 일부 경로 실패해도 나머지 계속 시도
- **일괄 저장**: 모든 경로 다운로드 완료 후 한 번에 DB insert

### 5. 일정 생성 시 자동 다운로드

**위치**: `apps/client/src/features/schedule/create-schedule/useCreateScheduleForm.ts`

```typescript
const { mutate: autoDownloadRoutes } = useAutoDownloadRoutes();
const { data: schedules = [] } = useGetSchedules(tripId);

const onValid = (data: CreateScheduleFormData) => {
  const id = generateId();
  const scheduledAt = combineDateTimeToISO(data.date, data.time);

  createSchedule(
    {
      id,
      tripId,
      title: data.title,
      // ...
      scheduledAt,
      latitude: selectedLocation?.latitude || null,
      longitude: selectedLocation?.longitude || null,
    },
    {
      onSuccess: () => {
        // 경로 자동 다운로드 (새 일정 포함)
        setTimeout(() => {
          const newSchedule = {
            id,
            latitude: selectedLocation?.latitude ? parseFloat(String(selectedLocation.latitude)) : undefined,
            longitude: selectedLocation?.longitude ? parseFloat(String(selectedLocation.longitude)) : undefined,
          };

          // scheduledAt 기준으로 정렬된 전체 일정 목록
          const allSchedules = [
            ...schedules.map((s) => ({
              id: s.id,
              latitude: s.latitude ? parseFloat(s.latitude) : undefined,
              longitude: s.longitude ? parseFloat(s.longitude) : undefined,
              scheduledAt: s.scheduledAt,
            })),
            {
              ...newSchedule,
              scheduledAt,
            },
          ]
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
            .map(({ id: scheduleId, latitude, longitude }) => ({ id: scheduleId, latitude, longitude }));

          autoDownloadRoutes({ tripId, schedules: allSchedules });
        }, 500); // React Query 캐시 업데이트 대기
      },
    },
  );
};
```

**핵심 포인트**:

- **500ms 지연**: React Query 캐시가 업데이트될 때까지 대기
- **시간순 정렬**: `scheduledAt` 기준으로 일정 정렬 (경로 순서 보장)
- **새 일정 포함**: 생성된 일정도 배열에 추가

### 6. 일정 수정 시 경로 재다운로드

**위치**: `apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx`

```typescript
const { mutate: autoDownloadRoutes } = useAutoDownloadRoutes();
const { data: schedules = [] } = useGetSchedules(scheduleData?.tripId || '');

const onValid = (data: ScheduleUpdateFormData) => {
  const scheduledAt = combineDateTimeToISO(data.date, data.time);

  updateSchedule(
    {
      id: scheduleData.id,
      data: {
        title: data.title,
        scheduledAt, // 시간 변경
      },
    },
    {
      onSuccess: () => {
        Alert.alert('성공', '일정이 수정되었습니다.');

        // 경로 재다운로드 (날짜/시간 변경으로 순서가 바뀔 수 있음)
        setTimeout(() => {
          const allSchedules = schedules
            .map((s) => ({
              id: s.id,
              latitude: s.latitude ? parseFloat(s.latitude) : undefined,
              longitude: s.longitude ? parseFloat(s.longitude) : undefined,
              scheduledAt: s.id === scheduleData.id ? scheduledAt : s.scheduledAt, // 수정된 시간 반영
            }))
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
            .map(({ id: scheduleId, latitude, longitude }) => ({ id: scheduleId, latitude, longitude }));

          autoDownloadRoutes({ tripId: scheduleData.tripId, schedules: allSchedules });
        }, 500);

        onClose();
      },
    },
  );
};
```

**왜 재다운로드?**

- 일정 시간 변경 → 일정 순서 변경 가능
- 순서 변경 → 경로 연결이 달라짐
- 예: A→B→C 였는데, C 시간을 앞당기면 A→C→B로 변경

### 7. 경로 조회 Query

**위치**: `apps/client/src/entities/route/data/useGetRoutes.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { db, routes } from '@/shared/db';
import { eq, and, isNull } from 'drizzle-orm';

export function useGetRoutes({ tripId }: { tripId: string }) {
  return useQuery({
    queryKey: ['routes', 'trip', tripId],
    queryFn: async () => {
      return db
        .select()
        .from(routes)
        .where(and(eq(routes.tripId, tripId), isNull(routes.deletedAt))) // Soft Delete 필터
        .all();
    },
    staleTime: Infinity, // 로컬 DB는 항상 최신
  });
}
```

**Local-First 패턴 준수**:

- ✅ 로컬 DB에서만 조회
- ✅ API 호출 없음
- ✅ Soft Delete 필터 적용

### 8. 지도 렌더링 컴포넌트

**위치**: `apps/client/src/shared/components/Map/OfflineScheduleMapView.tsx`

**핵심 기능**:

1. **Profile 선택**

```typescript
const [selectedProfile, setSelectedProfile] = useState<MapboxProfile>('walking');
const { data: savedRoutes = [] } = useGetRoutes({ tripId });
```

2. **경로 세그먼트 계산**

```typescript
const routeSegments = useMemo(() => {
  const segments: Array<{
    id: string;
    type: 'saved' | 'straight';
    coordinates: [number, number][];
    color: string;
    width: number;
    dashed?: boolean;
  }> = [];

  // 숙소 → 첫 일정
  if (accommodationCoords && schedulesWithCoords[0]) {
    const firstSchedule = schedulesWithCoords[0];
    const savedRoute = savedRoutes.find(
      (r) => r.fromScheduleId === null && r.toScheduleId === firstSchedule.id && r.profile === selectedProfile,
    );

    if (savedRoute) {
      // 저장된 경로 - 실제 도로 (초록색 실선)
      segments.push({
        id: `route-accommodation-${firstSchedule.id}`,
        type: 'saved',
        coordinates: decodePolyline(savedRoute.geometry),
        color: '#4CAF50',
        width: 4,
      });
    } else {
      // 미저장 경로 - 직선 (회색 점선)
      segments.push({
        id: `route-accommodation-${firstSchedule.id}`,
        type: 'straight',
        coordinates: [
          [accommodationCoords.longitude, accommodationCoords.latitude],
          [firstSchedule.longitude!, firstSchedule.latitude!],
        ],
        color: '#9E9E9E',
        width: 2,
        dashed: true,
      });
    }
  }

  // 일정 → 일정 경로들도 동일 로직
  // ...

  return segments;
}, [schedulesWithCoords, savedRoutes, accommodationCoords, selectedProfile]);
```

3. **Profile 선택 UI**

```typescript
const profileLabels: Record<MapboxProfile, string> = {
  walking: '도보',
  cycling: '자전거',
  'driving-traffic': '자동차',
};

<View style={styles.profileSelector}>
  {(['walking', 'cycling', 'driving-traffic'] as MapboxProfile[]).map((profile) => (
    <TouchableOpacity
      key={profile}
      style={[styles.profileButton, selectedProfile === profile && styles.profileButtonActive]}
      onPress={() => setSelectedProfile(profile)}
    >
      <Text style={[styles.profileButtonText, selectedProfile === profile && styles.profileButtonTextActive]}>
        {profileLabels[profile]}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

4. **LineLayer 렌더링**

```typescript
{routeSegments.map((segment) => (
  <MapboxGL.ShapeSource
    key={segment.id}
    id={segment.id}
    shape={{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: segment.coordinates,
      },
      properties: {},
    }}
  >
    <MapboxGL.LineLayer
      id={`${segment.id}-layer`}
      style={{
        lineColor: segment.color,
        lineWidth: segment.width,
        lineDasharray: segment.dashed ? [2, 2] : undefined,
      }}
    />
  </MapboxGL.ShapeSource>
))}
```

## 🐛 트러블슈팅

### Issue 1: ULID 생성 에러 (Critical)

**증상**:

```
[ULIDError: Failed to find a reliable PRNG (PRNG_DETECT)]
```

**원인**: `ulid` 라이브러리가 React Native 환경과 호환되지 않음

**해결**:

```typescript
// ❌ 잘못된 import
import { ulid } from 'ulid';
const id = ulid();

// ✅ 올바른 방법
import { generateId } from '@/shared/services/id/ulid';
const id = generateId();
```

**적용 위치**:

- `useAutoDownloadRoutes.ts`
- `useSaveRoute.ts`

**관련 코드**: [apps/client/src/shared/services/id/ulid.ts](../../apps/client/src/shared/services/id/ulid.ts)

### Issue 2: 지도가 아프리카에서 시작

**증상**: 지도 카메라가 좌표 [0, 0] (아프리카 대서양)에서 시작

**원인**: Camera props가 useMemo 이전에 설정되어 초기값이 적용 안 됨

**해결**:

```typescript
// ✅ useMemo로 초기 카메라 계산
const initialCamera = useMemo(() => {
  if (schedulesWithCoords.length === 1) {
    return {
      centerCoordinate: [schedulesWithCoords[0].longitude!, schedulesWithCoords[0].latitude!] as [number, number],
      zoomLevel: 15,
    };
  }

  // 여러 일정 - bounds로 자동 조정
  const lngs = schedulesWithCoords.map((s) => s.longitude!);
  const lats = schedulesWithCoords.map((s) => s.latitude!);

  return {
    bounds: {
      ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
      sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
      paddingTop: 100,
      paddingRight: 50,
      paddingBottom: 300,
      paddingLeft: 50,
    },
  };
}, [schedulesWithCoords]);

// ✅ animationDuration 0으로 즉시 이동
<MapboxGL.Camera ref={cameraRef} {...initialCamera} animationDuration={0} />
```

### Issue 3: Profile 선택 UI가 날짜 UI와 겹침

**증상**: 상단 날짜 선택 UI와 profile 버튼이 겹쳐서 클릭 안 됨

**해결**:

```typescript
// ❌ 기존 (top: 16)
profileSelector: {
  position: 'absolute',
  top: 16,
  right: 16,
  // ...
}

// ✅ 수정 (top: 60)
profileSelector: {
  position: 'absolute',
  top: 60, // 날짜 선택 UI 아래로 이동
  right: 16,
  // ...
}
```

### Issue 4: 경로가 미묘하게 어긋남

**증상**: 경로 연결 지점에서 약간의 간격 발생

**예시**:

```
일정 A ─────┐
            │ ← 약간의 간격
일정 B ─────┘
```

**원인**:

- 각 경로 세그먼트를 독립적으로 API 호출
- Mapbox API가 시작/끝점을 가장 가까운 도로 노드로 스냅
- A→B 경로의 끝점과 B→C 경로의 시작점이 다른 노드로 스냅될 수 있음

**상태**:

- ✅ 데이터 특성으로 수용
- 시각적으로 거의 눈에 띄지 않음 (1-2m 차이)
- 사용성에 영향 없음

**대안 (미채택)**:

- 전체 경로를 한 번에 요청 (waypoints 방식)
- 단점: Mapbox API 제약 (최대 25개 waypoint)

### Issue 5: 직선 경로가 표시 안 됨

**증상**: 경로 다운로드 전에 회색 점선(직선)이 안 보임

**원인**: savedRoute를 찾지 못할 때 else 블록이 실행 안 됨

**해결**:

```typescript
// ✅ 명시적으로 fallback 처리
if (savedRoute) {
  // 저장된 경로
  segments.push({
    type: 'saved',
    coordinates: decodePolyline(savedRoute.geometry),
    color: '#4CAF50',
    width: 4,
  });
} else {
  // ⭐ 미저장 경로 - 직선으로 표시
  segments.push({
    type: 'straight',
    coordinates: [
      [currentSchedule.longitude!, currentSchedule.latitude!],
      [nextSchedule.longitude!, nextSchedule.latitude!],
    ],
    color: '#9E9E9E',
    width: 2,
    dashed: true,
  });
}
```

## 📊 성능 및 데이터

### 다운로드 크기

| 경로 수 | Profile 개수 | geometry 크기 (평균) | 총 크기 (예상) |
| ------- | ------------ | -------------------- | -------------- |
| 3개     | 3            | 200-500 bytes        | ~4KB           |
| 10개    | 3            | 200-500 bytes        | ~15KB          |
| 30개    | 3            | 200-500 bytes        | ~45KB          |

**특징**:

- polyline6 압축으로 매우 작은 용량
- 오프라인 지도(60-200MB)에 비해 무시할 수준
- 네트워크 사용량 최소화

### API 호출 수

**Schedule 생성 시**:

```
일정 개수: N
경로 세그먼트: N-1 (+ 숙소→첫 일정 1개)
Profile: 3개

총 API 호출 = N × 3
예: 10개 일정 → 30회 API 호출
```

**최적화 가능성**:

- 현재: 순차 호출 (await)
- 개선: Promise.all로 병렬 호출 (API rate limit 주의)

### 시간 복잡도

| 작업                | 복잡도   | 설명                      |
| ------------------- | -------- | ------------------------- |
| 경로 다운로드       | O(N × 3) | N개 일정, 3개 profile     |
| 경로 조회 (로컬 DB) | O(1)     | tripId 인덱스로 빠른 조회 |
| Polyline 디코딩     | O(M)     | M = polyline 길이         |
| 경로 렌더링         | O(N × M) | N개 세그먼트, M개 좌표    |

## 🎨 UI/UX 패턴

### 1. 저장 vs 미저장 경로 구분

| 상태   | 색상   | 스타일 | 의미                  |
| ------ | ------ | ------ | --------------------- |
| 저장됨 | 초록색 | 실선   | 실제 도로 경로 (신뢰) |
| 미저장 | 회색   | 점선   | 임시 직선 (참고용)    |

### 2. Profile 선택

**기본값**: walking (도보)
**이유**:

- 가장 보수적인 추정 (거리가 길게 나옴)
- 여행지에서 걸어다니는 경우가 많음

**위치**: 우측 상단 (날짜 선택 아래)
**스타일**:

- 선택됨: 초록색 배경 + 흰색 글씨
- 미선택: 회색 글씨

### 3. 로딩 상태

**다운로드 중**:

- 직선(회색 점선)으로 표시
- 백그라운드에서 다운로드
- UI 블로킹 없음 (비동기)

**완료 후**:

- 자동으로 실제 도로 경로로 전환
- React Query 캐시 무효화 → 리렌더링

## 🔗 관련 문서

- [Offline Map Feature](./offline-map.md) - 오프라인 지도 기능
- [Local Architecture](../core/local-architecture.md) - Echo Protocol, Local-First 패턴
- [Client CLAUDE.md](../../apps/client/CLAUDE.md) - 클라이언트 가이드

## 📝 체크리스트

새 Entity에 오프라인 라우팅 추가 시:

- [ ] Schedule에 `latitude`, `longitude` 필드 있는지 확인
- [ ] `useAutoDownloadRoutes` import
- [ ] Schedule 생성/수정 시 `autoDownloadRoutes()` 호출
- [ ] `scheduledAt` 기준으로 정렬된 배열 전달
- [ ] 좌표 없는 일정은 필터링
- [ ] React Query 캐시 업데이트 대기 (500ms setTimeout)

## 🚀 향후 개선 사항

### 1. 증분 업데이트 (Incremental Update)

**현재**: 일정 수정 시 모든 경로 재다운로드
**개선**: 변경된 세그먼트만 다운로드

```typescript
// 예: B 일정 시간 변경 → A→B, B→C만 재다운로드
if (scheduleOrderChanged) {
  const affectedSegments = getAffectedSegments(oldOrder, newOrder);
  downloadSegments(affectedSegments);
}
```

### 2. 병렬 다운로드

**현재**: 순차 API 호출 (await)
**개선**: Promise.all로 병렬 호출

```typescript
const promises = [];
for (const profile of PROFILES) {
  promises.push(getDirections({ from, to, profile }));
}
const results = await Promise.all(promises);
```

**주의**: Mapbox API rate limit 확인 필요

### 3. 경로 캐싱

**현재**: 일정 수정 시 무조건 재다운로드
**개선**: 좌표가 같으면 재사용

```typescript
const cacheKey = `${fromLat},${fromLng}-${toLat},${toLng}-${profile}`;
if (routeCache.has(cacheKey)) {
  return routeCache.get(cacheKey);
}
```

### 4. 경로 미리보기

**현재**: 다운로드 전에 직선만 표시
**개선**: API 호출 없이 예상 경로 시뮬레이션

```typescript
// Haversine 거리 + 도시 밀도 기반 예측
const estimatedRoute = estimateRoute(from, to, cityDensity);
```

---

**작성일**: 2025-11-08
**버전**: 1.0.0
**작성자**: Claude (Anthropic)
