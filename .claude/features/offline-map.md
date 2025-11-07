# Offline Map Feature Guide

> Mapbox 오프라인 지도 다운로드 및 관리 구현 가이드

## 📌 개요

**목적**: 사용자가 여행지에서 네트워크 없이 지도를 사용할 수 있도록 함

**핵심 기능**:

- 첫 Schedule 생성 시 자동 오프라인 지도 다운로드
- referenceCount 기반 참조 카운팅 (중복 제거)
- 네이티브 Mapbox 팩 + SQLite 메타데이터 분리

## 🏗 아키텍처

### 데이터 흐름

```
┌─────────────────────────────────────────────────────┐
│ 1. User: 첫 Schedule 생성                          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. useCreateScheduleForm                            │
│    - isFirstSchedule 확인                           │
│    - downloadOfflineMap({ tripId }) 호출            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. useDownloadOfflineMap (Mutation)                │
│    ├─ Trip → cityId 조회                            │
│    ├─ 이미 다운로드? → referenceCount++             │
│    ├─ 네이티브 팩 존재? → 재사용                    │
│    ├─ 없으면 Mapbox createPack()                   │
│    └─ DB에 메타데이터 저장                          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. 저장 완료                                        │
│    ├─ Native: offline_city_2988507.pack (60MB)     │
│    └─ SQLite: offline_cities 레코드                │
└─────────────────────────────────────────────────────┘
```

### 파일 구조

```
apps/client/src/
├── entities/offline-city/
│   ├── data/
│   │   ├── useDownloadOfflineMap.ts    # 다운로드 Mutation
│   │   ├── useOfflineCity.ts            # 조회 Query
│   │   └── keys.ts                      # Query Keys
│   └── model/
│       └── ...
├── features/schedule/create-schedule/
│   └── useCreateScheduleForm.ts         # 자동 다운로드 트리거
├── shared/
│   ├── db/
│   │   ├── index.ts                     # offline_cities 테이블 생성
│   │   └── schema/offline-city.ts       # Drizzle 스키마
│   └── services/offline-map/
│       └── useOfflineMapCleanup.ts      # 자동 정리
└── app/
    └── _layout.tsx                       # MapboxGL.setAccessToken()
```

## 💻 구현 상세

### 1. DB 스키마 (offline_cities)

**위치**: `apps/client/src/shared/db/schema/offline-city.ts`

```typescript
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const offlineCities = sqliteTable('offline_cities', {
  cityId: integer('city_id').primaryKey().notNull(),
  cityName: text('city_name').notNull(),
  country: text('country'),
  centerLatitude: text('center_latitude').notNull(),
  centerLongitude: text('center_longitude').notNull(),
  radiusKm: integer('radius_km').notNull().default(10),
  downloadedAt: text('downloaded_at').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  tileCount: integer('tile_count'),
  referenceCount: integer('reference_count').notNull().default(1),
  mapboxRegionName: text('mapbox_region_name'),
  styleUrl: text('style_url').default('mapbox://styles/mapbox/streets-v11'),
  minZoom: integer('min_zoom').default(10),
  maxZoom: integer('max_zoom').default(16),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type OfflineCity = typeof offlineCities.$inferSelect;
export type NewOfflineCity = typeof offlineCities.$inferInsert;
```

**초기화**: `apps/client/src/shared/db/index.ts`

```typescript
export async function initializeDatabase() {
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS offline_cities (
      city_id INTEGER PRIMARY KEY NOT NULL,
      city_name TEXT NOT NULL,
      country TEXT,
      center_latitude TEXT NOT NULL,
      center_longitude TEXT NOT NULL,
      radius_km INTEGER NOT NULL DEFAULT 10,
      downloaded_at TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      tile_count INTEGER,
      reference_count INTEGER NOT NULL DEFAULT 1,
      mapbox_region_name TEXT,
      style_url TEXT DEFAULT 'mapbox://styles/mapbox/streets-v11',
      min_zoom INTEGER DEFAULT 10,
      max_zoom INTEGER DEFAULT 16,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}
```

### 2. 다운로드 Mutation

**위치**: `apps/client/src/entities/offline-city/data/useDownloadOfflineMap.ts`

**핵심 로직**:

1. Trip 정보 조회 (cityId, 좌표)
2. 이미 다운로드 확인 → referenceCount++
3. 네이티브 팩 존재 확인 → 재사용
4. 없으면 Mapbox createPack() 다운로드
5. DB에 메타데이터 저장

### 3. 자동 다운로드 트리거

**위치**: `apps/client/src/features/schedule/create-schedule/useCreateScheduleForm.ts`

```typescript
const isFirstSchedule = schedules.length === 0;

onSuccess: () => {
  if (isFirstSchedule) {
    console.log('🗺️ First schedule created - triggering offline map download');
    downloadOfflineMap({ tripId });
  }
},
```

### 4. Mapbox 토큰 초기화

**위치**: `apps/client/app/_layout.tsx`

```typescript
// 🚨 Critical: 앱 시작 시 반드시 초기화
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

// DB 초기화도 명시적으로
await initializeDatabase();
```

## 🐛 트러블슈팅

### Issue 1: 앱 크래시 (즉시 종료)

**증상**: Schedule 생성 시 앱이 즉시 종료

**원인**: `MapboxGL.setAccessToken()` 런타임 초기화 누락

**해결**:

```typescript
// app/_layout.tsx
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);
```

**관련 이슈**: [@rnmapbox/maps #3829](https://github.com/rnmapbox/maps/issues/3829)

### Issue 2: `coordinates must be an Array`

**증상**: `ERROR: [Error: coordinates must be an Array]`

**원인**: Mapbox bounds 포맷 오류

**해결**:

```typescript
// ❌ 잘못된 형식
const bounds: [number, number, number, number] = [west, south, east, north];

// ✅ 올바른 형식 (중첩 배열)
const bounds: [[number, number], [number, number]] = [
  [west, south], // southwest
  [east, north], // northeast
];
```

### Issue 3: `Offline pack already exists`

**증상**: `ERROR: [Error: Offline pack with name offline_city_2988507 already exists.]`

**원인**: DB 리셋 후 네이티브 팩은 남아있음

**해결**:

```typescript
// 다운로드 전 네이티브 팩 확인
const existingPacks = await MapboxGL.offlineManager.getPacks();
let pack = existingPacks.find(p => p.name === regionName);

if (!pack) {
  await MapboxGL.offlineManager.createPack(...);
} else {
  console.log('♻️ Reusing existing offline pack:', regionName);
}
```

### Issue 4: DB에 저장 안 됨

**증상**: cityId는 찍히지만 offlineCity가 안 나옴

**원인**: `offline_cities` 테이블이 생성되지 않음

**해결**:

```typescript
// shared/db/index.ts에 CREATE TABLE 추가
export async function initializeDatabase() {
  expoDb.execSync(`CREATE TABLE IF NOT EXISTS offline_cities (...);`);
}

// app/_layout.tsx에서 명시적 호출
await initializeDatabase();
```

### Issue 5: 필드명 오류

**증상**: `ERROR: no such column: trips.cityName`

**원인**: DB 스키마에 `cityName` 필드 없음 (실제는 `destination`)

**해결**:

```typescript
// ❌ 잘못된 필드
cityName: trips.cityName;

// ✅ 올바른 필드
destination: trips.destination;
```

## 📊 성능

### 다운로드 크기 및 시간

| 설정                           | 크기      | 시간   | 적합성       |
| ------------------------------ | --------- | ------ | ------------ |
| **현재** (10km, zoom 10-16)    | 50-80MB   | 2-5분  | ✅ 균형 잡힘 |
| **빠름** (5km, zoom 11-14)     | 20-30MB   | 1-2분  | ⚠️ 제한적    |
| **프로덕션** (15km, zoom 9-18) | 150-250MB | 8-15분 | ✅ 완전      |

### Zoom 레벨별 용도

```
Zoom 8-9:  지역 전체 (서울 전체) - 광역 보기
Zoom 10-11: 도시 구역 (강남구) - 현재 minZoom
Zoom 12-13: 동네 (역삼동) - 일반 탐색
Zoom 14-15: 거리/건물 (강남역) - 상세 보기
Zoom 16-18: 건물명/도로명 - 현재 maxZoom보다 높음
```

**권장**:

- **개발/테스트**: 현재 설정 (10-16) 유지
- **프로덕션**: maxZoom 18로 상향 고려 (건물명 완전 표시)

## 🔗 관련 문서

- [ADR-002: Mapbox 오프라인 지도](./../decisions/002-offline-map-integration.md)
- [Subscription System](./subscription-system.md)
- [Local Architecture](./../core/local-architecture.md)
- [Session: 2025-11-07](./../sessions/2025-11-07-offline-map-implementation.md)

## 📝 체크리스트

새 Entity에 오프라인 지도 추가 시:

- [ ] Trip에 `cityId`, `latitude`, `longitude` 필드 있는지 확인
- [ ] `useDownloadOfflineMap` import
- [ ] 적절한 시점에 `downloadOfflineMap({ tripId })` 호출
- [ ] referenceCount 증감 로직 확인
- [ ] 삭제 시 `useOfflineMapCleanup` 확인
