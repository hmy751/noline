# 현재 상태와 다음 행동

## 병렬 작업 위치

Project context의 Ticket 06 후보 수집·합의 반영·문서 갱신은 `refactor/project-context-update` 브랜치의 별도 `project-context-update` 워크트리로 분리했다. 이 작업 디렉터리는 `refactor/app-startup-lifecycle`에서 Ticket 06을 진행한다. 활성 여부 최초 확인 1-A, 연결 상태별 안내 1-B, 재확인 버튼 1-C는 커밋되어 있고 일정 화면 복구 2-A는 `57d878f`로 커밋했고 폼·Query 수명 후속 개선도 구현·검증을 마쳤다. Project 갱신 결과는 별도 브랜치에서 검토하며 이곳에는 아직 적용하지 않았다.

## 완료·수락된 범위

사용자는 [01번 Ticket](../memory/tickets/01-expense-totals.md)부터 [05번 Ticket](../memory/tickets/05-schedule-response.md)까지를 완료된 결과로 확정했다. 각 결과는 해당 Ticket의 검사와 미확인 한계를 포함한 범위에서 수락됐으며 Workspace나 제품 전체 완료를 뜻하지 않는다.

- 01은 제한된 fixture·정적 검사 범위에서 경비 합계 표시의 반복 해석을 줄였다.
- 02는 fixture·별도 verifier 범위에서 도시 선별과 변환을 정리했다.
- 03은 SQLite·Mapbox 집계, 부분 실패와 React 연결을 나눴다. development build·실기기·native module 미확인은 남아 있다.
- 04는 fetcher를 mock한 범위에서 Expense API 요청 검증·HTTP·응답 검증·반환 흐름을 정리했다.
- 05는 Schedule 날짜 직렬화, response schema, ownership·soft-delete를 완료했다. 실제 JWT·배포 process와 일부 통합 범위는 확인하지 않았다.

제품 Verify receipt는 없으며 이 수락을 native·외부 서비스·전체 서버 계약의 검증으로 확대하지 않는다. 선택된 제품 산출물과 저장 경계는 [output](../../output/index.md)에서 찾는다.

## 공통 기준과 Project Context 후보

Ticket 03의 초기 범위가 개선 깊이를 충분히 전달하지 못한 사례를 계기로 공통 운영 기준은 목표에 필요한 일을 찾고 맡은 결과·필요한 범위·완료 근거로 실행을 판단하도록 보완됐다. 현재 정본은 [공통 운영 기준](../../../spec-and-tickets/README.md)이 소유한다. 대화 맥락 없는 세션에서의 독립 적용 재검증은 아직 없다.

Project Context 후보 구성에는 Ticket 01–05와 관련 records·output·실제 코드를 주 자료로, `_archive`를 제외한 기존 `.claude/context`·decisions·sessions·CHANGELOG를 보조 자료로 사용한다. Ticket 06 이후는 이 구성 범위에서 제외하지만 Workspace의 후속 리팩토링 범위에는 남는다.

Project-wide 판단으로 남은 항목은 Expense 날짜 계약, 금액 반올림·정밀도와 서버 오류 처리의 목표 구조다. Project Context의 실제 반영은 이 Workspace Maintain의 소유 범위가 아니며 완료로 간주하지 않는다.

## 앱 준비·인증·동기화·화면 정책의 현재 경계와 다음 행동

[Ticket 06](../memory/tickets/06-app-startup-lifecycle.md)의 인증 책임과 실행 순서를 재검토한 뒤, 사용자 확정 기준에 따라 구현했다. 상태만으로 답하는 계정·인증 판단은 Auth Store에 모았고, DB 소유권 SQL과 사용자 세션 변경 절차는 각각의 책임으로 유지했다. 계정 검사·저장·적용, 즉시 인증 차단, 로그아웃의 로컬 저장 종료·미전송 확인·삭제 순서를 보호한다.

대상 여행 라우팅·DB 원자성·인증·동기화 중단 결과·화면 정책의 저장 경계와 당시 검사 결과는 [분리 커밋 마무리 기록](../../records/2026-09-22-02-five-stage-commits-and-verification.md)에 있다. 활성 여부 최초 확인 1-A는 `c38efa0`, 연결 상태 안내 1-B는 `eaec466`, 재확인 버튼·공용 UI 연결 1-C는 `0c1b17d`에 저장됐다. 온라인 복구는 2-A 일정 화면, 2-B 경비 목록·상세, 2-C 토스트로 나뉜다.

**2-A 구현·기록은 `57d878f`로 저장했고, 후속 프론트 아키텍처 개선을 구현·검증했다.** 비활성 여행의 제한이 풀리면 기존 내용을 즉시 표시하고 데이터 없음·stale·무효화 때 Query 기준으로 조회한다. 전역 reconnect false와 push→pull을 유지한다. 화면 조회는 Policy 접근 조건과 Query 표시 계산을 조합하며 별도 복구 저장 상태를 두지 않는다. Policy의 표시용·실제 관측 기준을 구별해 Debug 캐시 표시와 요청 차단을 함께 보존한다. 정책·논의 기록은 `56f38cc`로 커밋했다.

성공한 push와 pull 뒤 진행 중 조회를 취소하고 갱신을 요청하며, pull 생략·실패나 앞선 GET 때문에 성공한 변경을 놓치지 않게 했다. 활성화·비활성화 성공 뒤 일정 Query에도 같은 취소 후 무효화를 연결했다. 화면 GET 완료는 sync 완료를 지연시키지 않는다. 상세 구현과 범위는 [Ticket 06](../memory/tickets/06-app-startup-lifecycle.md), sync 검사 근거는 [구현 기록](../../records/2026-09-29-03-schedule-query-recovery-implementation.md), Policy·Query 책임 재배치는 [개선 기록](../../records/2026-09-29-04-schedule-policy-query-composition.md), 폼·조회 수명과 공통 갱신 연산 및 최신 검사는 [후속 기록](../../records/2026-09-29-05-schedule-form-query-lifecycle.md)이 소유한다.

기존 데이터의 재조회 실패 안내·재시도는 Main이 Query 상태만 쓰는 낮은 복잡도의 구현안으로 반영했다. 후속 개선은 폼 mount를 보존하면서 조회만 편집 중에 활성화하고, sync·활성 전환의 취소 후 무효화를 작은 공통 함수로 모았다. 2-B 경비 목록·상세의 온라인 복구도 구현·검증했다. 기존 데이터를 즉시 표시하고 최초 실패와 빈 결과를 구별하며 재조회 실패에는 내용을 유지한다. 상세의 연결 일정은 필요한 경우에만 조회하고 닫힌 경비 수정 폼의 일정 조회도 중지한다. 활성 전환 뒤 경비도 이전 출처의 조회 결과를 배제한다. 2-B는 `ed50ce1`로 커밋했다. 현재는 `query / access / actions / view`를 반환하는 일정·경비별 feature 훅과 공통 policy-query service로 배치를 정리하고 세 화면을 교체했다. 기존 helper와 시험 위치를 제거했다. 홈 요약·일정 상세·생성/수정 폼은 기존 Entity 조회 훅을 사용한다. 명명·배치·제한적 feature 재사용 기준은 Workspace에 우선 기록했으며 Project 문서는 변경하지 않았다. 안내 UI 통합·상세 오류 경계 수정·Drawer 조회 조건 확대는 적용하지 않았다. 그 뒤 2-C 토스트가 알릴 사실과 시점 판단이 남는다. 실패 안내의 최종 UX 확인은 남아 있다.

이번 배치·교체 후 전체 client Jest 41개 suite·393개 test가 통과했다. 이름·소유 위치와 FSD 예외의 선택 이유, Project 반영 보류와 실제 검증 범위는 [배치·교체 기록](../../records/2026-09-29-09-policy-query-ownership-and-migration.md)에 있다. 앞선 한 곳 시험 과정은 [시험 기록](../../records/2026-09-29-08-schedule-read-query-actions-trial.md)에 보존한다. 2-B의 화면·sync·활성 전환 검사와 한계는 [경비 복구 기록](../../records/2026-09-29-06-expense-query-recovery.md)이 소유한다. 실제 일정 수정 폼에서 작성 중 제목·날짜 보존과 저장 전 mutation 부재를 확인했으며 native 표시 표면과 repository는 mock이다. 타입 검사는 기존 Mapbox/download 오류 3개로 전체 성공은 아니다. 실제 기기·서버·OAuth·SecureStore와 native 활성 전환 전체 검증은 남아 있다.

Ticket 06의 토스트·foreground 재확인·mutation 오류 전달과 전체 완료 검증, 14의 전체 write/cache 계약, 15의 typed pull·cleanup 부분 실패 결과·중단 작업 재개, 16의 여행별 미전송 판정·cleanup 집계는 남는다. 앞선 데이터 보존 검사의 실제 Drizzle SQL·Node 메모리 SQLite 범위와 화면 검사의 mock 경계를 제품 전체 검증으로 확대하지 않는다.

판단 기준, 앞선 제안의 보정, 수정별 증거와 정확한 파일 진입점은 [재점검·구현 기록](../../records/2026-09-21-04-auth-responsibilities-and-regression-fixes.md)에서 읽는다.

## 그 밖의 남은 리팩토링

Ticket 06–16의 제품 구현과 Ticket 17의 남은 request·response·ownership·오류 경계는 미완료다. Ticket 06의 DB·auth 실패 처리와 화면 정책 적용은 위 결과에 포함하며, 남은 네트워크 소비 연결은 06, typed pull·cleanup 부분 실패 결과·중단된 작업 재개는 15에서 이어 간다. 여행별 미전송 판정과 정리 집계는 16에 남는다.

Ticket 07의 독립 API export, 08의 순수 계산과 12의 표시 Owner 조사도 다른 후속 구현 전체를 기다리지 않는다. 10·11의 입력과 14의 cache 계약은 13이 사용하고, 13·14·15의 결과는 09의 전체 준비 완료에 필요하다. 14·15는 16의 보존 조건에 연결된다.

Trip PATCH/PUT의 기대·수정 담당, 날짜 변경 뒤 무효 `scheduleId`의 입력 UX와 서버 개발환경 후보도 Main 조율이 남았다.

현재 Workspace 전체에 대한 제품 Verify receipt와 최종 acceptance는 없다. Ticket 01–05의 제한된 수락을 전체 Work 완료로 사용하지 않는다.
