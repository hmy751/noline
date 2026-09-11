# 02 — 도시 검색의 선별 조건과 변환

## 맡은 결과와 범위

`apps/client/src/features/trip/create-trip/geonames.api.ts`의 요청 도시 코드와 응답 선별·City 변환을 명확히 한다. query hook의 debounce·cache·에러 표시 정책은 바꾸지 않는다. [Spec 품질·완료 판단](../spec/04-quality-and-completion.md)을 따른다.

## 실행 맥락과 접근

[추가 조사](../additional-research.md)에 따르면 허용 도시 코드가 요청/필터에 반복되고 인구 기준과 수도 예외가 조건식에 묶여 있다. 기존 `searchCities`를 호출 경계로 유지하고 동일 기준을 수정할 위치와 조건의 의미를 드러낸다. 문자열 좌표 변환과 catch의 빈 배열 반환은 보존한다. 범용 검색 엔진 도입은 목표가 아니다. Ticket 01과 기술적 의존성은 없다.

## 완료 조건과 확인 방법

리팩토링 전 `searchCities`에 고정 HTTP 응답을 공급해 실제 요청 인자와 반환값을 확인한다. 허용/비허용 코드, 이름/국가 누락, 인구 10,000과 10,001, 인구 미달 수도, 응답 순서, 숫자 문자열 좌표, 요청 실패를 포함하고 수정 후 같은 검사를 실행한다. 실제 GeoNames 가용성 검증으로 확대하지 않는다.

허용 코드 변경 위치가 하나로 모이고 수도 예외·필드 변환 의미를 가까운 코드에서 읽을 수 있어야 한다. 필요한 검사 실행 방법은 실행 때 정하며 구현 복제 테스트로 대신하지 않는다.

## 현재 상태와 실제 결과

2026-09-11 구현·검증 뒤 사용자가 결과 설명과 검증 한계를 확인하고 수락해 완료했다.

`CAPITAL_FEATURE_CODE`·`CITY_FEATURE_CODES`·`MIN_CITY_POPULATION`으로 기준을 드러내고 요청과 응답 필터가 같은 허용 코드 목록을 사용하게 했다. `isSearchableCity`는 이름·국가명, 허용 코드, 수도 예외 또는 인구 10,000 초과 조건을 판단하고, `toCity`는 GeoNames 필드를 `City` 필드와 숫자 좌표로 변환한다. 공개 `searchCities` 경계와 query hook·화면 consumer는 바꾸지 않았다.

수정 전후 같은 Axios adapter fixture를 `searchCities`에 공급했다. `/searchJSON` 경로와 전체 요청 params, 네 허용 코드와 비허용 코드, 빈 이름·국가명, 인구 10,000과 10,001, 인구 1인 `PPLC`, 응답 순서, 숫자 문자열 좌표, 요청 실패 시 오류 로그 1회와 빈 배열 반환이 같았고 두 실행 모두 assertion과 함께 종료 코드 0이었다. 별도 verifier도 Git HEAD 원본과 변경본을 독립 비교해 `behavior-identical`, 전체 `supported`, actionable issue 없음으로 판정했다.

Prettier, `prettier/prettier` 규칙을 제외한 대상 파일 ESLint와 `git diff --check`는 통과했다. client typecheck는 대상 파일의 새 오류 없이 기존 3건만 재현했다. 정규 ESLint는 기존 `eslint-plugin-prettier`와 Prettier 3 호환 오류로 완료하지 못했다. 실제 Axios 네트워크 직렬화, GeoNames 서비스 가용성, 전체 앱 화면은 확인하지 않았고 영구 테스트 파일이나 새 테스트 의존성은 추가하지 않았다. 외부 응답 런타임 검증과 query hook 오류 정책은 이번 범위에서 변경하지 않았다.
