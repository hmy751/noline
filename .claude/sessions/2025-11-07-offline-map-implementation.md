# Session Log: 2025-11-07 - Offline Map Implementation

**날짜**: 2025-11-07
**작업**: Mapbox 오프라인 지도 다운로드 기능 구현
**상태**: ✅ 완료

## 🎯 목표

1. Mapbox 오프라인 지도 자동 다운로드 구현
2. referenceCount 기반 참조 카운팅
3. 네이티브 팩 + DB 메타데이터 분리
4. 디버그 도구 추가

## 📝 작업 내용

### Phase 1: Mapbox 재활성화 및 빌드

이전 세션에서 임시 비활성화한 Mapbox를 다시 활성화하고 네이티브 빌드:

```bash
# app.config.js에서 Mapbox 플러그인 활성화
plugins: [
  '@rnmapbox/maps/app.plugin.js',
  { RNMapboxMapsDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN }
]

# 네이티브 빌드
npx expo run:ios
```

### Phase 2: 데이터 저장 이슈 해결

**문제**: cityId는 찍히는데 offlineCity가 DB에 안 나타남

**원인 발견**:

1. **필드명 오류**: `trips.cityName` → `trips.destination`으로 수정
2. **테이블 누락**: `offline_cities` 테이블이 `initializeDatabase()`에 없었음
3. **Bounds 포맷**: 평면 배열 → 중첩 배열로 수정

**해결**:

```typescript
// 1. 필드명 수정
cityName: trips.cityName; // ❌
destination: trips.destination; // ✅

// 2. 테이블 생성 추가
expoDb.execSync(`
  CREATE TABLE IF NOT EXISTS offline_cities (
    city_id INTEGER PRIMARY KEY NOT NULL,
    city_name TEXT NOT NULL,
    ...
  );
`);

// 3. Bounds 포맷 수정
const bounds: [[number, number], [number, number]] = [
  [centerLng - lngDelta, centerLat - latDelta],
  [centerLng + lngDelta, centerLat + latDelta],
];
```

### Phase 3: 앱 크래시 해결

**문제**: Schedule 생성 시 앱이 즉시 종료

**원인**: `MapboxGL.setAccessToken()` 런타임 초기화 누락

**해결**:

```typescript
// app/_layout.tsx
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);
```

**관련 이슈**: [@rnmapbox/maps #3829](https://github.com/rnmapbox/maps/issues/3829) - 토큰 초기화 필수

### Phase 4: 중복 다운로드 방지

**문제**: DB 리셋 후 네이티브 팩은 남아있어서 "already exists" 에러

**해결**:

```typescript
// 다운로드 전 네이티브 팩 확인
const existingPacks = await MapboxGL.offlineManager.getPacks();
let pack = existingPacks.find(p => p.name === regionName);

if (!pack) {
  // 새로 다운로드
  await MapboxGL.offlineManager.createPack(...);
  console.log('✅ New offline pack created:', regionName);
} else {
  // 기존 팩 재사용
  console.log('♻️ Reusing existing offline pack:', regionName);
}
```

### Phase 5: DB 초기화 명시적 호출

**문제**: `initializeDatabase()`가 어디서도 호출되지 않음

**해결**:

```typescript
// app/_layout.tsx
useEffect(() => {
  const prepareApp = async () => {
    await initializeDatabase(); // ✅ 명시적 호출
  };
  prepareApp();
}, []);
```

### Phase 6: 디버그 도구 추가

**추가 기능**:

1. `offline_cities` 테이블 표시
2. Mapbox 네이티브 팩 삭제 버튼
3. 크기, 타일 수, referenceCount 확인

```typescript
// DebugScreen.tsx
<View className='rounded-lg bg-card p-md border border-card-border'>
  <Text className='text-title-medium'>Offline Cities 테이블</Text>
  {offlineCitiesData.map((city) => (
    <View key={city.cityId}>
      <Text>{city.cityName}, {city.country}</Text>
      <Text>크기: {(city.sizeBytes / 1024 / 1024).toFixed(2)}MB</Text>
      <Text>참조 횟수: {city.referenceCount}</Text>
      <Text>Zoom: {city.minZoom}-{city.maxZoom}</Text>
    </View>
  ))}
</View>

<Pressable onPress={handleClearOfflineMaps}>
  <Text>🗺️ Mapbox 오프라인 팩 삭제</Text>
</Pressable>
```

### Phase 7: Zoom 레벨 복원

**논의**: 영역이나 줌을 조절하면 확대/축소 시 문제 없을까?

**결정**: 원래 설정으로 복원

```typescript
// 임시 설정 (토큰 이슈 우려)
minZoom: 11, maxZoom: 14, radiusKm: 5

// 복원 (토큰이 진짜 원인이었음)
minZoom: 10, maxZoom: 16, radiusKm: 10
```

**이유**:

- maxZoom 16: 건물 단위 확대 가능 (실사용에 필수)
- minZoom 10: 도시 구역 전체 보기
- radiusKm 10: 외곽 이동 여유

## 🐛 해결한 이슈

### 1. 필드명 오류

```
ERROR: no such column: trips.cityName
```

→ `trips.destination` 사용

### 2. 테이블 누락

```
ERROR: no such table: offline_cities
```

→ `initializeDatabase()`에 CREATE TABLE 추가

### 3. Bounds 포맷

```
ERROR: coordinates must be an Array
```

→ 중첩 배열 `[[west, south], [east, north]]` 사용

### 4. 앱 크래시

```
[앱 즉시 종료]
```

→ `MapboxGL.setAccessToken()` 런타임 초기화

### 5. 중복 다운로드

```
ERROR: Offline pack already exists
```

→ 네이티브 팩 존재 확인 후 재사용

### 6. DB 초기화 미호출

→ `app/_layout.tsx`에서 명시적 `await initializeDatabase()`

## 📊 최종 설정

```typescript
// 다운로드 설정
const radiusKm = 10; // 중심에서 10km 반경
const latDelta = 0.09; // 위도 델타 (0.09도 ≈ 10km)
const lngDelta = 0.09; // 경도 델타
const minZoom = 10; // 도시 구역 레벨
const maxZoom = 16; // 건물 단위 레벨
const styleURL = 'mapbox://styles/mapbox/streets-v11';

// 예상 크기: 50-80MB
// 다운로드 시간: 2-5분
```

## ✅ 완료 항목

- [x] Mapbox 플러그인 재활성화
- [x] `offline_cities` 테이블 생성
- [x] `useDownloadOfflineMap` 구현
- [x] 첫 Schedule 생성 시 자동 다운로드
- [x] referenceCount 기반 참조 카운팅
- [x] 네이티브 팩 재사용 로직
- [x] 토큰 런타임 초기화
- [x] DB 초기화 명시적 호출
- [x] 디버그 콘솔 기능 추가
- [x] Zoom 레벨 원래대로 복원

## 🔄 Git 커밋

```bash
# 이전 세션 이후 커밋들
dfac05c - chore: apps/client, 주석 추가
57cefe0 - refactor: apps/client, 중복 다운로드 방지 추가
566a83f - fix: apps/client, Mapbox Bounds 포맷 오류 수정
af0e601 - refactor: apps/client, destination 필드 수정
95708cf - feat: apps/client, 디버그 콘솔 오프라인지도 관련 기능 추가
93255de - fix: apps/client, 앱 크래시 문제 해결, 실행 시 토큰 접근 설정으로 해결
71d67ab - feat: apps/client, 오프라인 지도 db 적용
```

## 💬 주요 대화

### Q1: "속도는 어덯게 조절해?"

**A**: 직접 조절 불가, 데이터 양으로 제어:

- 커버리지 줄이기: 10km → 5km
- Zoom 레벨 낮추기: 10-16 → 11-13
- 스타일 변경: streets → light

### Q2: "영역이나 줌을 조절하면 작게하거나 확대할 때 문제있지않을까?"

**A**: 맞음!

- maxZoom 14 → 15-16 확대 시 타일 없음
- minZoom 10 → 9 축소 시 타일 없음
- bounds 밖 이동 시 지도 안 보임

→ 원래 설정 (10-16, 10km) 복원

### Q3: "여기서 고친 이슈나 수정 부분은 뭐였지?"

**A**: 4가지 주요 수정:

1. 필드명 오류 (cityName → destination)
2. Bounds 포맷 (평면 → 중첩 배열)
3. 중복 다운로드 방지 (네이티브 팩 확인)
4. Zoom 레벨 복원 (10-16)

## 📚 생성된 문서

1. **ADR-002: Mapbox 오프라인 지도 통합**
   - 아키텍처 결정 기록
   - 대안 평가 및 트레이드오프
   - 향후 작업 계획

2. **Offline Map Feature Guide**
   - 구현 상세 가이드
   - 트러블슈팅
   - 성능 최적화

3. **Session Log (this file)**
   - 작업 과정 기록
   - 이슈 해결 과정
   - 주요 대화

## 🔜 Next Steps

### 즉시 (Phase 1)

- [ ] 다운로드 진행률 UI 추가
- [ ] 에러 처리 강화 (Alert)
- [ ] WiFi 전용 옵션

### 단기 (Phase 2)

- [ ] 활성화 시스템 연동
- [ ] 1-Trip 제한 적용
- [ ] 자동 정리 고도화

### 장기 (Phase 3)

- [ ] Zoom 레벨 사용자 설정
- [ ] 점진적 다운로드
- [ ] 압축 최적화

## 🔗 관련 링크

- [Mapbox Offline Docs](https://docs.mapbox.com/ios/maps/guides/offline/)
- [@rnmapbox/maps v10.1.33](https://github.com/rnmapbox/maps)
- [Issue #3829 - setAccessToken](https://github.com/rnmapbox/maps/issues/3829)

## 📝 메모

- expo start vs expo run:ios 차이 명확히 이해
- 네이티브 팩 vs DB 메타데이터 분리 아키텍처 확립
- referenceCount 패턴 향후 재사용 가능
- 토큰 초기화 이슈는 문서에 명시 필요
