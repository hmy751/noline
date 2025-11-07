# ADR-002: Mapbox 오프라인 지도 통합

**날짜**: 2025-11-07
**상태**: ✅ Accepted
**관련 이슈**: #offline-map

## 컨텍스트

Noline은 오프라인 환경에서도 완벽하게 작동하는 여행 관리 앱이다. 사용자가 여행지에서 인터넷 없이 지도를 볼 수 있어야 하며, 일정 위치를 확인하고 새로운 장소를 탐색할 수 있어야 한다.

### 요구사항

1. **완전한 오프라인 작동**: 네트워크 없이 지도 표시
2. **저장 공간 효율**: 모바일 저장 공간 제한 고려
3. **Local-First 유지**: 기존 아키텍처와 일관성
4. **사용자 경험**: 자동 다운로드, 투명한 관리

## 결정

### 1. Mapbox 오프라인 지도 선택

**선택**: Mapbox GL Native with Offline Pack

**대안**:

- Google Maps SDK (오프라인 미지원)
- OpenStreetMap + Leaflet (React Native 통합 복잡)
- react-native-maps (오프라인 제한적)

**이유**:

```typescript
✅ Mapbox 장점:
- 완전한 오프라인 지원 (OfflineManager API)
- React Native 최적화 (@rnmapbox/maps)
- 세밀한 제어 (zoom, bounds, style)
- 상업적 사용 가능 (무료 티어 50K MAU)

❌ 대안의 한계:
- Google Maps: 오프라인 다운로드 API 없음
- OSM: 타일 관리 직접 구현 필요
- react-native-maps: 오프라인 기능 제한적
```

### 2. 네이티브 팩 + DB 메타데이터 분리

**아키텍처**:

```
Native Layer (Mapbox OfflineManager)
  ├─ offline_city_2988507.pack (실제 지도 타일)
  └─ 60MB ~ 200MB

SQLite (offline_cities 테이블)
  └─ Metadata only:
      - cityId, cityName, country
      - centerLatitude, centerLongitude
      - radiusKm, minZoom, maxZoom
      - sizeBytes, tileCount
      - referenceCount (참조 카운팅)
      - mapboxRegionName (네이티브 팩 연결)
```

**이유**:

1. **관심사 분리**: 지도 렌더링(네이티브) vs 메타정보(DB)
2. **효율성**: SQLite에 큰 바이너리 저장 피함
3. **Mapbox 최적화**: 네이티브 팩이 렌더링 성능 최고
4. **관리 용이**: DB에서 메타만 조회, 삭제는 네이티브 API 사용

**트레이드오프**:

```typescript
// ⚠️ 불일치 가능성
// DB는 있지만 네이티브 팩이 없는 경우 (사용자가 수동 삭제)
const city = await db.select().from(offlineCities).get();
const pack = await MapboxGL.offlineManager.getPack(city.mapboxRegionName);
// pack이 null일 수 있음

// 해결: 다운로드 시 항상 네이티브 팩 먼저 확인
const existingPacks = await MapboxGL.offlineManager.getPacks();
let pack = existingPacks.find((p) => p.name === regionName);
if (!pack) {
  // 새로 다운로드
}
```

### 3. referenceCount 기반 참조 카운팅

**패턴**:

```typescript
// 첫 Trip이 도시 사용
await db.insert(offlineCities).values({
  cityId: 2988507,
  referenceCount: 1,  // 시작
});

// 두번째 Trip도 같은 도시
await db.update(offlineCities)
  .set({ referenceCount: existingCity.referenceCount + 1 })
  .where(eq(offlineCities.cityId, 2988507));
// referenceCount: 2

// Trip 삭제 시
await db.update(offlineCities)
  .set({ referenceCount: existingCity.referenceCount - 1 });
// referenceCount: 1

// 마지막 참조 제거 시
if (referenceCount === 0) {
  await MapboxGL.offlineManager.deletePack(regionName);
  await db.delete(offlineCities).where(...);
}
```

**이유**:

- **저장 공간 절약**: 여러 Trip이 같은 도시 사용 시 한 번만 다운로드
- **안전한 삭제**: 마지막 참조까지 제거되어야 삭제
- **단순성**: CRDT나 Vector Clock 불필요

**대안 고려**:

```typescript
// ❌ 매 Trip마다 별도 다운로드
// 문제: 파리 여행 3개 = 600MB (200MB × 3)

// ❌ 전역 1개만 유지
// 문제: 도쿄→파리 전환 시 기존 지도 삭제 → 다시 돌아오면 재다운로드

// ✅ referenceCount
// 장점: 필요한 만큼만 유지, 자동 정리
```

### 4. 첫 Schedule 생성 시 자동 다운로드

**트리거 시점**:

```typescript
// ❌ Trip 생성 시 다운로드?
// 문제: 아직 확정 안 된 여행, 장소 변경 가능

// ✅ 첫 Schedule 생성 시
// 이유: 일정 만들기 시작 = 진지한 여행 계획
const isFirstSchedule = schedules.length === 0;
if (isFirstSchedule) {
  downloadOfflineMap({ tripId });
}
```

**이유**:

1. **사용자 의도 명확**: 일정 추가 = 여행 확정
2. **불필요한 다운로드 방지**: "일단 만들어보기"에서 다운로드 안 함
3. **저장 공간 존중**: 사용자가 원하는 여행만
4. **UX**: 일정 보면서 지도 로딩 자연스러움

### 5. Zoom 레벨 설정: 10-16

**현재 설정**:

```typescript
const minZoom = 10; // 도시 구역 레벨 (강남구 전체)
const maxZoom = 16; // 건물 단위 (강남역 주변 상세)
const radiusKm = 10; // 중심에서 10km 반경
```

**Zoom 레벨 참조**:

```
8-9:  지역 전체 (서울 전체)
10-11: 도시 구역 (강남구)
12-13: 동네 (역삼동)
14-15: 거리/건물 (강남역)
16-18: 상세 건물/도로명
```

**결정 과정**:

```typescript
// Phase 1: 보수적 설정 (앱 크래시 우려)
minZoom: 11, maxZoom: 14, radiusKm: 5
// → 크기: ~20-30MB, 빠른 테스트

// Phase 2: 실제 이슈는 토큰 초기화
// MapboxGL.setAccessToken() 누락이 원인

// Phase 3: 실용적 설정으로 복원
minZoom: 10, maxZoom: 16, radiusKm: 10
// → 크기: ~50-80MB, 건물 단위 확대 가능
```

**향후 조정**:

```typescript
// Production 고려사항:
// - maxZoom: 18 (도로명/건물명 완전 표시)
// - radiusKm: 15 (외곽 이동 여유)
// - 예상 크기: ~150-250MB
// - 사용자 설정 옵션 제공?
```

## 구현

### 핵심 파일

**1. useDownloadOfflineMap.ts** - 다운로드 로직

```typescript
export function useDownloadOfflineMap() {
  return useMutation({
    mutationFn: async ({ tripId }) => {
      // 1. Trip → cityId 조회
      const trip = await db.select().from(trips).where(eq(trips.id, tripId)).get();

      // 2. 이미 있으면 referenceCount++
      const existing = await db.select().from(offlineCities).where(eq(offlineCities.cityId, trip.cityId)).get();
      if (existing) {
        await db.update(offlineCities).set({ referenceCount: existing.referenceCount + 1 });
        return existing;
      }

      // 3. 네이티브 팩 확인
      const existingPacks = await MapboxGL.offlineManager.getPacks();
      let pack = existingPacks.find((p) => p.name === regionName);

      // 4. 없으면 다운로드
      if (!pack) {
        await MapboxGL.offlineManager.createPack({
          name: regionName,
          styleURL: 'mapbox://styles/mapbox/streets-v11',
          bounds: [
            [lng - 0.09, lat - 0.09],
            [lng + 0.09, lat + 0.09],
          ],
          minZoom: 10,
          maxZoom: 16,
        });
      }

      // 5. DB에 메타데이터 저장
      await db.insert(offlineCities).values({
        cityId,
        cityName,
        centerLatitude,
        centerLongitude,
        radiusKm: 10,
        sizeBytes: pack.size,
        tileCount: pack.tileCount,
        referenceCount: 1,
        mapboxRegionName: regionName,
        minZoom: 10,
        maxZoom: 16,
      });
    },
  });
}
```

**2. index.ts (DB 초기화)** - offline_cities 테이블

```sql
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
```

**3. \_layout.tsx** - 토큰 초기화

```typescript
// 🚨 Critical: 앱 시작 시 반드시 호출
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

// DB 초기화도 명시적으로
await initializeDatabase();
```

**4. useCreateScheduleForm.ts** - 자동 다운로드 트리거

```typescript
onSuccess: () => {
  if (isFirstSchedule) {
    console.log('🗺️ First schedule created - triggering offline map download');
    downloadOfflineMap({ tripId });
  }
},
```

### 디버그 도구

**DebugScreen.tsx**:

- `offline_cities` 테이블 표시
- Mapbox 네이티브 팩 삭제 버튼
- 크기, 타일 수, referenceCount 확인

## 영향

### Positive

1. **완전한 오프라인**: 네트워크 없이 지도 작동
2. **저장 공간 효율**: referenceCount로 중복 제거
3. **자동화**: 사용자 개입 최소화
4. **Local-First 유지**: 기존 아키텍처와 일관성

### Negative

1. **복잡성 증가**: 네이티브 팩 + DB 관리
2. **다운로드 시간**: 50-80MB, 2-5분 소요
3. **불일치 가능성**: DB와 네이티브 팩 동기화 필요

### 위험 완화

```typescript
// 1. 네이티브 팩 불일치 처리
const pack = await MapboxGL.offlineManager.getPack(regionName);
if (!pack && dbRecord) {
  // DB에는 있지만 팩 없음 → 재다운로드 유도
  console.warn('Offline pack missing, re-download needed');
}

// 2. 다운로드 실패 처리
const errorListener = (error) => {
  // 사용자에게 알림, 재시도 옵션 제공
  Alert.alert('지도 다운로드 실패', '다시 시도하시겠습니까?');
};

// 3. 저장 공간 부족
// 향후: 다운로드 전 여유 공간 확인
// 향후: 구독 시스템으로 1개 제한
```

## 향후 작업

### Phase 1: 현재 구현 (✅ 완료)

- [x] Mapbox 통합
- [x] offline_cities 테이블
- [x] 자동 다운로드
- [x] referenceCount 관리

### Phase 2: 구독 시스템 연동 (계획 중)

```typescript
// .claude/features/subscription-system.md 참조

// 구독 여행: 완전 오프라인
if (trip.isSubscribed) {
  await downloadOfflineMap({ tripId });
  await pullFullData({ tripId }); // Schedule, Expense 전부
}

// 비구독 여행: 온라인 전용
else {
  // Metadata만 로컬, 오프라인 지도 없음
  await pullMetadata({ tripId });
}

// 1-Trip 제한
const subscribedTrips = trips.filter((t) => t.isSubscribed);
if (subscribedTrips.length >= 1) {
  // 새 구독 전 기존 구독 해제 필요
}
```

### Phase 3: UX 개선

- [ ] 다운로드 진행률 UI
- [ ] 예상 크기 미리 표시
- [ ] WiFi 전용 옵션
- [ ] 수동 다운로드 트리거

### Phase 4: 최적화

- [ ] Zoom 레벨 사용자 설정
- [ ] 압축 최적화
- [ ] 점진적 다운로드 (저해상도 → 고해상도)

## 관련 문서

- [Subscription System](./../features/subscription-system.md) - 구독 시스템 설계
- [Local Architecture](./../core/local-architecture.md) - Local-First 가이드
- [Client CLAUDE.md](./../../apps/client/CLAUDE.md) - 클라이언트 패턴
- [Session: 2025-11-07](./../sessions/2025-11-07-offline-map-implementation.md) - 구현 과정

## 참고

- Mapbox Offline Docs: https://docs.mapbox.com/ios/maps/guides/offline/
- @rnmapbox/maps Issue #3829: setAccessToken 필수
- React Native 0.74.5, Expo SDK 51
- @rnmapbox/maps v10.1.33
