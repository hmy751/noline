# 클라이언트 표현 정리 구현 B

채택된 배정 항목을 모두 반영했다. 작업 시작 기준은 Main의 `visual-stage/`이며 기존 미커밋 작업과 다른 담당자 수정은 보존했다. commit/stage/install/network/앱 실행과 Work·Project·Personal 수정은 하지 않았다.

## 실제 채택

- F2-01: `useActivateTrip.ts`의 transaction 본문을 같은 파일 `applyActivationResponse`로 옮겼다. 입력 4개이며 응답 타입은 `z.infer<typeof activateTripResponse>['data']`, session 타입은 store에서 추론한다. helper 자체가 transaction을 시작하므로 Main 피드백에 따라 `InTransaction` 접미어를 사용하지 않았다. 원래 transaction 본문은 들여쓰기 외 정확히 동일하다. 전체 응답 parse → 대상 확인 → transaction → 삭제 null 결과의 바깥 throw → 지도/경로 비대기 요청을 유지한다.
- F2-06/R5-02: 지도 StyleSheet 선언을 컴포넌트 뒤로 옮기고 미소비 `hasAllRoutes` 계산/속성만 제거했다. 부분 저장 경로 표시·savedCount·카메라 동작은 그대로다.
- F2-07/R6-01: ScheduleScreen의 메뉴/수정/삭제 handler를 파생 화면 값·selection 보정 뒤에 모으고, 동일한 표시행 타입 세 곳을 파일 내부 `ScheduleListItem`으로 연결했다. hook 호출 순서, render 중 selection 보정 조건/시점, 기존 optional/null 필드는 보존했다. useCallback인 onRefresh 위치는 유지했다.
- F2-08: offline-values의 afterEach, schedule-recovery의 beforeEach/afterEach, auth-policy의 afterEach를 각각 첫 사례 앞에 옮겼다. 모두 기존 root scope이며 hook 간 순서/내용은 동일하다.
- M3-01: 두 repository의 `preparedRequest`를 `requestPreparation`으로 개명했다. prepareEdit 호출·Promise 전달·await 순서는 동일하다.
- M3-02: 실제 그룹 전체 patch를 반환하는 `changedFields`를 `buildChangedGroupPatch`로 개명하고 두 폼과 runtime/type 검사 소비자를 연결했다. overload·반환 계약·숫자/null/그룹 계산은 그대로다.
- M3-06/E4-02: route다운로드 결과/지역변수를 `savedCount`로 개명하고 route-cache 기대 속성을 연결했다. 실제 inserted 수는 동일하다. readCurrentSegments 정의에 null은 캐시 보존, []는 전체 정리임을 적었다. 새 union/조회/분기는 없다.
- M3-07: 보호할 Local 여행 존재를 나타내는 flag를 `hasProtectedLocalTrips`로 개명하고 repository 및 useGetTrips 검사에 반영했다. 범위 밖 application/trip-list-refresh mock은 Main에게 전달했고 Main이 반영했다. 현재 source/test 검색에 hasLocalTrips 잔존은 없다.
- M3-12: offline-values 첫 두 사례명을 실제 값 동일 시 저장 생략 검증에 맞췄다. assertion은 그대로다.
- R5-01: 두 폼 valid/invalid handler 첫머리로 mounted guard를 옮기고 handleSubmit의 익명 중계 callback을 제거했다. 저장 뒤 mounted 재검사, 일정 경로 준비의 검사 앞 실행, catch·isSubmitting 수명은 보존했다.
- R5-10/R5-12: read-query-consumers에서 성공 mock을 `mockResolvedValueOnce(undefined)`로, 하나뿐인 it.each를 단일 it로 정리했다. mockSaveSchedule에는 `(input: unknown) => Promise<void>` 타입을 명시해 현재 Promise 성공 계약을 표현했다. 닫힘→무효화/조회0→열림/조회1 순서는 그대로다.

Main의 후속 지시에 따라 trip-local의 복합조건 내부 개행 한 곳만 기존 formatter가 수용하는 한 줄로 되돌렸다. 그 외 Main의 시각적 빈 줄/블록은 보존했고 전체 formatter는 실행하지 않았다.

## 자기 확인

- 소비처 검색: source/tests에서 preparedRequest, changedFields, hasLocalTrips, hasAllRoutes 및 경로 서비스의 downloaded 잔존 없음. DB downloadedAt 등 독립 필드는 변경하지 않았다.
- `client-self-check.json`: activation transaction 본문의 들여쓰기 제외 정확 일치, ScheduleScreen hook 호출 순서/selection 보정 블록 일치, 지도 StyleSheet 내용 일치, 세 test root hook 순서 일치를 확인했다.
- `client-owned-tests.log`: 관련 16 suites / 213 tests 통과.
- `client-activation-tests.log`: 최종 mock/helper 변경 뒤 read-query-consumers + temporal-local-contracts + response-freshness + save-submission 4 suites / 130 tests 통과. 앞 실행과 read-query-consumers가 겹치므로 두 수치를 합산하지 않는다.
- `client-owned-types.log`: client TypeScript는 기존 baseline과 같은 7오류만 남았다(mapbox 좌표 tuple 1, OfflinePack 속성 2, UI rootDir/include 4). 새 오류 없음. edit-fields 타입 검사 포함.
- `client-owned-lint-final.log`: 소유 변경 19파일을 기존 ESLint로 검사. 오류 0, 기존 테마/inline-style/no-shadow 경고 35개. 별도 설치나 formatter 호환 설정은 하지 않았다.

## 수정 파일

생산 11개:
- apps/client/src/entities/expense/repository/expense-repository.ts
- apps/client/src/entities/schedule/repository/schedule-repository.ts
- apps/client/src/entities/trip/data/useActivateTrip.ts
- apps/client/src/entities/trip/lib/trip-local.ts
- apps/client/src/entities/trip/repository/trip-repository.ts
- apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx
- apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx
- apps/client/src/shared/lib/edit-fields.ts
- apps/client/src/screens/ScheduleScreen.tsx
- apps/client/src/shared/components/Map/MapboxScheduleMapView.tsx
- apps/client/src/shared/services/directions/route-downloader.ts

검사 8개:
- apps/client/tests/entities/trip/data/useGetTrips.test.tsx
- apps/client/tests/features/edit/offline-values.test.tsx
- apps/client/tests/screens/auth-policy.test.tsx
- apps/client/tests/screens/read-query-consumers.test.tsx
- apps/client/tests/screens/schedule-recovery.test.tsx
- apps/client/tests/shared/lib/edit-fields.test.ts
- apps/client/tests/shared/lib/edit-fields.types.ts
- apps/client/tests/shared/services/directions/route-cache.test.ts

배정 범위의 미구현이나 남은 연결은 없다. 전체 통합 검사/최종 검토는 Main이 진행한다. 기존 타입 오류는 이번 정리의 범위 밖이며 앱 실행은 요청하지 않았다.
