# 도시 검색의 현재 선별·실패 경계

여행 생성의 도시 검색 요청, GeoNames 응답 선별이나 `City` 변환을 수정할 때 읽는다. 이 본문은 `searchCities`의 도시 선별과 선택된 도시의 시간대 확인 경계를 설명한다. 검색 debounce·cache·화면 오류 경험이나 외부 검색 공급자 선택은 소유하지 않는다.

## 요청과 응답은 같은 도시 범위를 사용한다

[GeoNames client](../../../apps/client/src/features/trip/create-trip/geonames.api.ts)는 `/searchJSON`에 이름 접두어, 한국어, 인구순, 최대 10건과 `PPLC`, `PPLA`, `PPLA2`, `PPL` feature code를 보낸다. 응답도 같은 네 code만 허용하며 이름과 국가명이 비어 있으면 제외한다.

일반 도시는 인구가 10,000보다 커야 한다. 인구가 정확히 10,000이면 제외되지만 수도인 `PPLC`는 인구와 무관하게 포함한다. 통과한 응답은 공급자 순서를 유지하고 `lat`·`lng` 문자열을 숫자로 바꿔 `City`를 만든다. 요청과 응답 필터의 허용 code가 갈라지거나 수도 예외가 일반 인구 조건에 묻히지 않게 한다.

요청이 실패하면 현재 공개 함수는 오류를 기록하고 빈 배열을 반환한다. 이 동작은 호출부가 실패와 검색 결과 없음을 같은 값으로 받게 한다. 이를 오류로 throw하거나 별도 상태로 표현하는 변경은 단순 리팩터링이 아니라 query hook·화면의 오류 경험까지 정해야 하는 동작 변경이다.

## 도시 선택과 시간대 확인은 다른 요청이다

선택한 도시의 좌표로 `/timezoneJSON`을 조회해 IANA `timezoneId`를 확인한다. 검색 결과만으로 시간대가 확인됐다고 간주하지 않는다. 시간대 조회는 기존 `useAppPolicy`의 실제 네트워크 Service 검색 정책을 따르며 도시·좌표별 Query 결과를 재사용한다. 실패를 빈 결과나 기기 시간대로 대체하지 않고 오류와 재시도를 제공한다. 새 여행 생성은 확인된 시간대가 있어야 저장한다.

기존 Trip의 시간대 확인도 같은 조회를 사용하지만, 확인 결과를 적용하는 mutation은 기존 여행 수정 경로를 따른다. 이때 기간의 timestamp는 보존하고, 적용 후 다시 연 폼에서 도시 날짜를 표시한다. 조회·적용 이전에는 UTC 호환임을 알리고 기간 편집을 잠근다. 저장된 시간대가 있는 활성 여행의 일정·경비 편집에는 이 외부 조회가 필요하지 않다. 필드 의미와 호환 기준은 [날짜와 시각](../common/date-and-time.md)이 소유한다.

## 확인 범위와 다시 볼 신호

Ticket 02에서는 고정 Axios adapter로 요청 parameter, 허용·비허용 code, 빈 필드, 인구 10,000/10,001, 저인구 수도, 좌표 변환, 순서와 실패 반환을 변경 전후 대조했다. 영구 자동 검사 파일은 남기지 않았고 실제 Axios 네트워크 직렬화, GeoNames 가용성, 전체 화면은 확인하지 않았다.

Feature code, 인구 경계, 실패 표현, GeoNames request 또는 query consumer가 바뀌면 이 본문과 실제 서비스 경계를 다시 대조한다. 완료와 근거의 상세는 Workspace 002 [Ticket 02](../../work/workspaces/002-code-readability-refactoring/current/memory/tickets/02-city-search.md)가 소유한다.
