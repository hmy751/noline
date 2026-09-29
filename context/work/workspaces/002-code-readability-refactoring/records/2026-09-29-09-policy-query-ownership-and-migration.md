# 조회 조합의 이름·소유 위치와 기존 소비자 교체

일정 목록에서 비교한 조회 조합을 일정·경비별 feature와 공통 service로 정리하고, 기존 경비 목록·상세의 조합을 교체했다. 반환 계약은 `query / access / actions / view`다. 이 기록은 배치 선택과 구현 범위를 보존한다. 프로젝트 전체 FSD 규칙의 정본을 변경한 기록은 아니다.

## 왜 다시 배치를 검토했나

사용자는 기존 read-query 소비자를 새 조합으로 교체하고 이전 헬퍼를 없애자고 한 뒤, “근데 변수명좀 고민좀 해봐 적용전에 파일명부터 메서드랑”, “그리고 디렉토리랑 위치도”라고 요청했다. Main은 처음 모든 조회를 trip feature 아래에 모으는 안을 제안했다. 사용자가 “스케줄이랑 트립익스펜스도 고려해야지 바보야”라고 정정했고, 이어 “fsd 관점으로는? 그냥 변수명 파일 위치 등 개선 리뷰어 맡겨봐”라고 요청했다.

독립 프론트 리뷰어는 현재 소스·소비자·아키텍처 및 Policy 문서와 FSD 공식 문서를 대조했다. 이 리뷰는 코드 수정이나 테스트 실행을 포함하지 않았다. Main이 공식 계층 규칙과 실제 프로젝트 책임 문구를 추가 대조한 뒤 아래 권고안을 제시했고 사용자는 “그래 그렇게 진행해보자”라고 답했다.

## 이름과 실제 소유 위치

여행은 두 조회의 범위이며, 조회 결과의 소유자는 각각 일정과 경비다. 일정에는 `useTripSchedulesReadQuery`, 여행별 경비에는 `useTripExpensesReadQuery`를 사용한다. 경비에는 기존 일정별 조회도 있으므로 Trip을 생략하면 범위를 구별하기 어렵다. 기존 `useGetSchedules`·`useGetTripExpenses`는 Entity Query의 key·repository·캐시 설정을 소유하는 원본 훅으로 유지한다.

클라이언트 src 기준 구조는 다음과 같다.

```text
features/schedule/read-schedules/
  useTripSchedulesReadQuery.ts
  index.ts
features/expense/read-expenses/
  useTripExpensesReadQuery.ts
  index.ts
shared/services/policy-query/
  useTripReadAccess.ts
  usePolicyReadQuery.ts
  index.ts
```

각 index는 공개 export만 맡는다. 구체 훅은 소속 Entity와 공통 service를 연결한다. 공통 service는 일정·경비 Entity 훅을 직접 import하지 않으며, 이미 계산된 Policy와 Query를 연결한다. `shared/policy`는 계속 허용 여부·이유를 결정한다. Query 상태 투영·최근 commit 참조·refetch 실행까지 Policy 계산에 넣지 않기 위해 기존 프로젝트의 앱 전용 service 경계에 조합을 배치했다.

`TripReadAccess`의 `consumerEnabled`는 호출자가 준 조회 수명 조건, `canFetch`는 정책까지 합친 최종 조회 가능 여부다. `displayPolicy`·`actualPolicy`는 각각 표시 기준·실제 관측 기준의 정책 객체다. `latestCommitted`는 재조회 action이 참조할 최근 React commit의 입력이다. `ReadQueryState`, `ReadRefetchOutcome`, 내부 `getReadQueryView`·`toQueryState`는 기존 의미를 유지한다.

## FSD와 프로젝트 예외를 구별한 선택

정식 FSD는 다른 slice를 엄격히 하위 layer에서만 import하도록 제한한다. 공개 index 사용은 경계를 드러내지만 같은 layer 간 의존을 허용하지는 않는다. Shared 역시 business domain별 slice를 소유하지 않는다. 근거는 [공식 Layers](https://feature-sliced.design/docs/reference/layers)와 [Slices and segments](https://feature-sliced.design/docs/reference/slices-segments)이며 2026-09-29에 확인했다.

현재 프로젝트는 Policy를 화면·feature에서 조합하고 Entity data hook에는 Policy check를 넣지 않도록 한다. 또한 `shared/services`에 앱 전용 로직을 허용한다. 기존 `shared/policy/useAppPolicy`가 `entities/trip` 활성 조회에 의존하는 예외도 이미 존재한다. 이번 공통 service 배치는 그 예외를 제거한 순수 FSD 전환이 아니며, 새로운 일정·경비 Entity 직접 의존을 shared에 추가하지 않는다. 여행 개념을 포함하므로 domain과 무관한 범용 Query 라이브러리라고 설명하지 않는다.

폼에서 같은 구체 조회 조합을 재사용할 때는 다음 제한적 예외를 작업 기준으로 선택했다.

- 공개 조회 조합 훅만 다른 feature에서 재사용한다. 해당 feature의 index를 경유한다.
- 재사용 대상은 UI·폼 입력·저장 동작을 소유하지 않고 entities/shared만 참조한다.
- 조회 feature가 소비 폼이나 다른 feature를 역으로 참조하지 않으며 폼끼리 의존을 만들지 않는다.

정식 slice 격리를 고수하면 폼마다 접근 계산·원본 Query·공통 조합 연결을 반복해야 한다. 구체 조합을 entities로 내리면 현재 Policy 책임 기준을 바꾸어야 한다. 사용자가 강조한 폼·보조조회 재사용과 현재 데이터 계층의 책임을 함께 유지하기 위해 위 좁은 예외를 선택했다. 실제 feature 간 새 재사용은 이번 세 화면 교체에 포함되지 않으며 폼 적용 시 이 조건을 확인한다.

사용자는 구현 중 “우선 워크스페이스 쪽에 문서 잘남기는거 어때? project-context보다”라고 정했다. 따라서 이 선택과 조건을 Workspace Ticket·state·본 기록에 남겼고 Project context 및 기존 아키텍처·Policy guide는 수정하지 않았다. Project-wide 기준으로 반영한 것처럼 취급하지 않으며, 다른 Workspace가 이 조합을 확대하거나 계층 기준을 변경할 때 Project 반영 여부를 별도로 판단한다.

## 구현 결과와 보존 경계

일정 목록은 일정 feature, 경비 목록·상세는 경비 feature의 공개 훅을 사용한다. 경비 상세의 연결 일정도 일정 feature 훅을 사용하며 경비 접근과 일정 연결 유무에 따른 enabled 조건을 보존한다. 상세 대상 ID 검색·부재 판정은 상세 화면에 남는다. 기존 `screens/read-query.ts`, `features/trip/read-query`와 시험용 `useSchedulesRead`·`useReadQuery` 공개 이름을 제거했다. 기존 두 헬퍼의 직접 조합은 소비자에서 제거했지만 접근·표시 계산 자체는 새 공통 구현으로 유지한다.

화면이 읽는 query에서는 raw refetch가 빠지고 actions.refetch가 정책을 적용한다. Query 상태 타입 관계, 캐시 유지, blocked/finished 반환, 기본 오류 결과와 throwOnError 동작은 앞선 시험 계약을 유지한다. 원본 Entity 훅, Router, sync, 전역 reconnect false와 5분 freshness는 바꾸지 않았다. 폼과 ScheduleDetail, 일정별 경비 조회는 이번에 전환하지 않았다. 기존 상세의 무동작 재시도 경계와 대상 부재 해석은 별도 후속 판단이다.

공통 계약 검사는 `tests/shared/services/policy-query/read-query.test.tsx`로 옮겨 Entity 대신 실제 Query와 정책 입력 fixture로 검사한다. 실제 Entity와 화면 연결은 기존 일정·경비 복구 테스트가 확인한다. 인증 정책 테스트의 경비 Query mock에는 실제 성공 결과가 가진 isSuccess를 추가했다.

Main은 교체 후 client Jest 전체 **41개 suite·393개 test 통과**를 확인했다. 변경 파일의 ESLint는 기존 충돌하는 prettier 규칙을 제외해 통과했고 형식을 정리했다. TypeScript 검사에는 기존 Mapbox/download 오류 3개만 남았다. 실기기·실제 서버 검증은 하지 않았으며 이 결과는 Ticket 06 전체 완료나 최종 UX 수락이 아니다. 변경은 미커밋이다.
