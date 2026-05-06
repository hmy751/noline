# ADR-003: Offline Routing Integration

**날짜**: 2025-11-08
**상태**: ✅ Accepted
**결정자**: Development Team

---

## 📋 Context (배경)

오프라인 지도([ADR-002](./002-offline-map-integration.md)) 구현 후, 일정 간 이동 경로를 오프라인에서 표시할 필요성 발생.

**문제**:
- 오프라인 지도만으로는 일정 간 이동 경로를 알 수 없음
- 사용자가 일정 순서대로 이동하는 최적 경로 안내 필요
- 네트워크 없는 환경에서도 경로 시각화 필요

**요구사항**:
1. 일정 간 실제 도로 경로 표시
2. 여러 이동 수단 지원 (도보/자전거/자동차)
3. 오프라인 작동 보장
4. 최소 저장 공간 사용

---

## 🤔 Decision (결정)

**Mapbox Directions API + Polyline6 압축 저장 방식 채택**

### 핵심 결정 사항

1. **API 선택**: Mapbox Directions API v5
2. **저장 포맷**: Polyline6 압축 문자열
3. **다운로드 전략**: 3-Profile Auto-download (walking, cycling, driving-traffic)
4. **트리거 시점**: Schedule 생성/수정 시 자동
5. **UI 패턴**: Saved (초록 실선) vs Unsaved (회색 점선)

---

## 🎯 Alternatives Considered (검토한 대안들)

### Option 1: Mapbox Directions API + Polyline6 (✅ Chosen)

**장점**:
- ✅ 압축률 높음 (200-500 bytes/경로)
- ✅ Mapbox Maps와 생태계 통합
- ✅ 정확한 도로 경로 제공
- ✅ 오프라인 저장 가능

**단점**:
- ❌ 초기 다운로드 필요 (온라인 필수)
- ❌ API 호출 비용 (무료 계층 50,000 req/월)

**비용**:
```
무료 계층: 50,000 requests/month
사용 예상: 10개 일정 × 3 profiles = 30 requests/trip
         = 1,666 trips/month (충분함)
```

---

### Option 2: Google Directions API + Polyline5

**장점**:
- ✅ Google Maps 생태계 익숙함
- ✅ 압축 포맷 (polyline5)

**단점**:
- ❌ Mapbox Maps와 불일치 (혼용 복잡)
- ❌ 비용 더 높음 ($5/1000 requests)
- ❌ 압축률 낮음 (precision 5 < 6)

**결정 이유**: Mapbox 생태계 통일 + 비용 효율

---

### Option 3: OpenStreetMap + Graphhopper

**장점**:
- ✅ 완전 오픈소스
- ✅ 자체 호스팅 가능

**단점**:
- ❌ 초기 구축 복잡도 높음
- ❌ 서버 유지보수 필요
- ❌ Mapbox Maps와 통합 어려움

**결정 이유**: MVP에 과도한 복잡도

---

### Option 4: 직선 거리만 표시 (No API)

**장점**:
- ✅ 구현 간단
- ✅ 비용 없음
- ✅ 완전 오프라인

**단점**:
- ❌ 실제 경로와 큰 차이
- ❌ 사용자 혼란 (산/강 무시)
- ❌ 이동 시간/거리 부정확

**결정 이유**: UX 품질 저하 (fallback으로만 사용)

---

## 📐 Architecture Details (아키텍처 상세)

### 데이터 흐름

```
1. Schedule 생성/수정
   ↓
2. useAutoDownloadRoutes()
   ↓ (for walking, cycling, driving-traffic)
3. Mapbox Directions API
   ↓ (geometry: polyline6 string)
4. SQLite 저장 (routes 테이블)
   ↓
5. useGetRoutes() → Local DB 조회
   ↓
6. decodePolyline() → [lng, lat][]
   ↓
7. MapboxGL.LineLayer 렌더링
```

### DB 스키마

```typescript
routes = {
  id: ULID,                      // Echo Protocol
  tripId: string,
  fromScheduleId: string | null, // null = 숙소
  toScheduleId: string,
  profile: 'walking' | 'cycling' | 'driving-traffic',
  geometry: string,              // polyline6 압축
  distance: number,              // meters
  duration: number,              // seconds
  // + Echo Protocol 필드들
}
```

### 3-Profile Auto-download 전략

**왜 3개 모두 다운로드?**

| Profile           | 용도                   | 차이점                    |
|-------------------|------------------------|---------------------------|
| walking           | 도보 여행              | 가장 긴 경로, 계단 허용   |
| cycling           | 자전거 여행            | 자전거 도로 우선          |
| driving-traffic   | 렌터카 여행            | 자동차 전용도로 사용      |

**이유**:
- 사용자가 여행 중 이동 수단을 바꿀 수 있음
- 미리 다운로드해도 데이터 크기 작음 (× 3배 ≈ 1.5KB)
- UX 향상 (즉시 전환 가능)

---

## 🔧 Implementation Patterns (구현 패턴)

### 1. Polyline6 압축/해제

**Polyline6 vs Polyline5**:
- Polyline5: Google Maps 기본 (precision 5, ±1.1m)
- Polyline6: Mapbox 기본 (precision 6, ±0.11m)

**압축 효과**:
```
원본 좌표 100개:
  JSON: ~2,400 bytes ([37.5665, 126.9780], ...)
  Polyline6: ~350 bytes (_p~iF~ps|U...)
  압축률: 85% 이상
```

**구현**:
```typescript
import polyline from '@mapbox/polyline';

// 디코딩 (렌더링용)
const coords = polyline.decode(geometry, 6); // precision 6
// [[lat, lng], ...] → [[lng, lat], ...] 변환 필요!

// 인코딩 (저장용, 현재 미사용)
const encoded = polyline.encode(coords, 6);
```

### 2. React Native ULID 호환성

**문제**: `ulid` 라이브러리가 React Native의 PRNG와 호환 안 됨

**해결**:
```typescript
// ❌ 직접 import 금지
import { ulid } from 'ulid';

// ✅ 프로젝트 래퍼 사용
import { generateId } from '@/shared/services/id/ulid';
```

### 3. 증분 vs 전체 재다운로드

**현재 구현**: 전체 재다운로드
- Schedule 시간 수정 → 전체 경로 재다운로드

**이유**:
- 시간 변경 → 일정 순서 변경 가능
- 순서 변경 → 모든 경로 세그먼트 영향
- 단순성 우선 (MVP)

**향후 개선 가능**:
```typescript
// 영향받는 세그먼트만 재다운로드
const affectedSegments = [
  { from: A, to: B }, // B 시간 변경
  { from: B, to: C }, // B 이후 영향
];
```

---

## ⚖️ Trade-offs (트레이드오프)

### ✅ Pros (장점)

1. **저장 공간 효율**
   - 30개 경로 × 3 profiles ≈ 45KB
   - 오프라인 지도(60-200MB)에 비해 무시할 수준

2. **정확도**
   - 실제 도로 네트워크 기반
   - 이동 시간/거리 정확

3. **유연성**
   - 3가지 이동 수단 즉시 전환
   - 사용자 선택권 보장

4. **오프라인 작동**
   - 다운로드 후 네트워크 불필요
   - Local-First 원칙 준수

### ❌ Cons (단점)

1. **초기 다운로드 필요**
   - 최소 1회 온라인 필요
   - 30회 API 호출 (10개 일정 × 3 profiles)
   - 해결: 백그라운드 자동 다운로드

2. **API 비용**
   - 무료 계층 제한 (50,000 req/월)
   - 예상 사용량: ~1,666 trips/월 (충분)

3. **경로 미세 어긋남**
   - 세그먼트 연결 지점에서 1-2m 간격
   - 원인: 독립 API 호출 → 다른 노드 스냅
   - 영향: 시각적으로 거의 인지 불가

4. **재다운로드 오버헤드**
   - Schedule 수정 시 전체 재다운로드
   - 개선 가능: 증분 업데이트

---

## 📊 Performance Impact (성능 영향)

### 다운로드 시간

| 일정 개수 | API 호출 | 예상 시간 | 데이터 크기 |
|-----------|----------|-----------|-------------|
| 5개       | 15회     | 3-5초     | ~8KB        |
| 10개      | 30회     | 6-10초    | ~15KB       |
| 20개      | 60회     | 12-20초   | ~30KB       |

**최적화**:
- 현재: 순차 호출 (await)
- 개선: Promise.all 병렬 (API rate limit 주의)

### 렌더링 성능

| 경로 개수 | Polyline 좌표 | 렌더링 시간 |
|-----------|---------------|-------------|
| 10개      | ~1,000개      | < 16ms      |
| 30개      | ~3,000개      | < 50ms      |

**결론**: 60fps 유지 가능

### 메모리 사용

```
경로 데이터 (SQLite): ~45KB (30 routes × 3 profiles)
디코딩 캐시 (메모리): ~200KB (useMemo)
총 영향: 무시할 수준
```

---

## 🔗 Integration Points (통합 지점)

### 1. 오프라인 지도와의 관계

| 기능           | 오프라인 지도        | 오프라인 라우팅      |
|----------------|----------------------|----------------------|
| 역할           | 지도 타일 저장       | 경로 geometry 저장   |
| 트리거         | 첫 Schedule 생성     | 모든 Schedule 생성   |
| 저장 위치      | Native Pack + SQLite | SQLite only          |
| 크기           | 60-200MB             | 15-45KB              |

**분리 이유**:
- 관심사 분리 (지도 vs 경로)
- 독립적 다운로드/업데이트
- 오프라인 지도 없어도 경로 저장 가능 (직선 표시)

### 2. Schedule Entity와의 의존성

```typescript
// Schedule 생성 → 경로 다운로드
onSuccess: () => {
  autoDownloadRoutes({ tripId, schedules: sortedSchedules });
}

// Schedule 시간 수정 → 경로 재다운로드
onSuccess: () => {
  autoDownloadRoutes({ tripId, schedules: updatedSchedules });
}
```

**의존 방향**: Schedule → Route (단방향)

---

## 🚨 Risks & Mitigations (리스크 및 완화)

### Risk 1: API Rate Limit 초과

**리스크**:
- 무료 계층 50,000 req/월 초과
- 서비스 중단

**완화책**:
1. **모니터링**: API 사용량 추적
2. **제한**: 일정 개수 제한 (30개)
3. **캐싱**: 동일 좌표 경로 재사용
4. **Fallback**: 직선 표시로 degradation

**예상 사용량**:
```
사용자 100명 × 2 trips/월 × 30 API calls = 6,000 req/월
→ 여유 있음 (50,000 한도)
```

### Risk 2: Mapbox API 장애

**리스크**:
- Mapbox 서비스 다운
- 경로 다운로드 실패

**완화책**:
1. **Graceful Degradation**: 직선(회색 점선)으로 표시
2. **재시도 로직**: Exponential backoff
3. **에러 UI**: 사용자에게 상태 안내

### Risk 3: 저장 공간 부족

**리스크**:
- 많은 여행 → 경로 데이터 누적
- 저장 공간 부족

**완화책**:
1. **Soft Delete**: 여행 삭제 시 경로도 삭제 (cascade)
2. **정리 작업**: 오래된 여행 데이터 정리
3. **현실적 제약**: 45KB/trip × 100 trips = 4.5MB (문제없음)

---

## 🔮 Future Improvements (향후 개선)

### Phase 1: 증분 업데이트 (Incremental Update)

**현재 문제**: Schedule 수정 시 전체 재다운로드

**개선안**:
```typescript
// 영향받는 세그먼트만 재다운로드
function getAffectedSegments(oldSchedules, newSchedules) {
  // 순서 변경된 구간만 찾기
  const changed = findOrderChanges(oldSchedules, newSchedules);
  return changed.map(seg => ({ from: seg.from, to: seg.to }));
}
```

**효과**: API 호출 60-90% 감소

### Phase 2: 병렬 다운로드

**현재**: 순차 API 호출 (await)

**개선안**:
```typescript
const promises = PROFILES.map(profile =>
  getDirections({ from, to, profile })
);
const results = await Promise.all(promises);
```

**효과**: 다운로드 시간 30-50% 단축

**주의**: Mapbox API rate limit 확인 필요

### Phase 3: 경로 캐싱

**현재**: 동일 좌표라도 매번 API 호출

**개선안**:
```typescript
const cacheKey = `${fromLat},${fromLng}-${toLat},${toLng}-${profile}`;
if (routeCache.has(cacheKey)) {
  return routeCache.get(cacheKey);
}
```

**효과**: 중복 API 호출 제거

### Phase 4: 경로 미리보기

**현재**: 다운로드 전 직선만 표시

**개선안**: Haversine 거리 + 도시 밀도 기반 예상 경로 시뮬레이션

**효과**: UX 향상 (예상 경로 즉시 표시)

---

## 📝 Lessons Learned (배운 점)

### 1. Polyline6 vs Polyline5 차이 중요

**문제**: 처음 polyline5로 구현 → 정밀도 부족
**해결**: Mapbox 공식 precision 6 사용
**교훈**: API 문서 정확히 확인

### 2. ULID 라이브러리 호환성 체크 필수

**문제**: `ulid` 라이브러리 → React Native 크래시
**해결**: `generateId()` 래퍼 사용
**교훈**: 라이브러리 선택 시 환경 호환성 우선 확인

### 3. 좌표 순서 주의 (lat/lng vs lng/lat)

**문제**: Mapbox는 [lng, lat], polyline은 [lat, lng] 반환
**해결**: 명시적 변환 함수
**교훈**: 좌표 시스템 항상 문서화

### 4. 카메라 초기화 타이밍

**문제**: useMemo 전에 Camera props 설정 → 아프리카([0,0])에서 시작
**해결**: useMemo로 initialCamera 계산
**교훈**: React 훅 순서 중요

---

## ✅ Acceptance Criteria (수용 기준)

### Functional Requirements

- [x] Schedule 생성 시 3가지 profile 경로 자동 다운로드
- [x] 저장된 경로는 실제 도로로 표시 (초록 실선)
- [x] 미저장 경로는 직선으로 표시 (회색 점선)
- [x] 사용자가 profile 선택 가능 (도보/자전거/자동차)
- [x] 오프라인 환경에서 경로 표시
- [x] Schedule 시간 수정 시 경로 재다운로드

### Non-Functional Requirements

- [x] 경로 데이터 크기: 500 bytes/route 이하
- [x] 렌더링 성능: 60fps 유지
- [x] 다운로드 시간: 10개 일정 기준 10초 이내
- [x] API 사용량: 무료 계층 내 (50,000 req/월)

### Code Quality

- [x] FSD 아키텍처 준수
- [x] Echo Protocol 적용 (ULID, Soft Delete)
- [x] Local-First 패턴 (로컬 DB 조회)
- [x] TypeScript 타입 안전성
- [x] 에러 처리 (try-catch, fallback)

---

## 📚 References (참고 자료)

### Documentation

- [Feature Guide: Offline Routing](../context/offline-routing.md)
- [Client CLAUDE.md: Offline Routing](../../apps/client/CLAUDE.md#-offline-routing)
- [ADR-002: Offline Map Integration](./002-offline-map-integration.md)

### External APIs

- [Mapbox Directions API v5](https://docs.mapbox.com/api/navigation/directions/)
- [Polyline Encoding](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
- [@mapbox/polyline Package](https://github.com/mapbox/polyline)

### Related Issues

- [ULID Error Fix](../context/offline-routing.md#issue-1-ulid-생성-에러-critical)
- [Camera Africa Issue](../context/offline-routing.md#issue-2-지도가-아프리카에서-시작)

---

**작성자**: Development Team
**승인자**: -
**구현일**: 2025-11-08
