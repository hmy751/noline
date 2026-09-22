# 현재 상태와 다음 행동

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

합의한 순서의 다섯 범위를 각각 저장했다. 대상 여행 라우팅은 `f0f680e`, DB 원자성은 `9936662`, 인증 세션 전환·로컬 데이터 보존은 `62ce226`, 동기화 중단 결과·미전송 원본 보존은 `100e71a`, 화면 정책·제한 중 입력 보존은 `be2f5b9`다. 마지막 커밋에는 사용자가 함께 요청한 인증 파일의 빈 줄 정리와 해당 Ticket·state·output 갱신도 포함됐다. 각 커밋의 동작 경계와 검사 결과는 [분리 커밋 마무리 기록](../../records/2026-09-22-02-five-stage-commits-and-verification.md)에 남긴다.

Main이 각 후보만 반영한 별도 디렉터리에서 검증했다. 인증 후보는 30개 suite·277개 test, 동기화까지는 33개 suite·288개 test, 최종 화면 정책까지는 **35개 suite·297개 test 통과**다. 마지막 커밋 직전의 staged 내용만 적용한 별도 디렉터리에서도 35개 suite·297개 test가 통과했고 `git diff --cached --check`도 통과했다. 앞선 변경 파일 Prettier 검사와 Prettier plugin 충돌 규칙만 제외한 ESLint 실행은 오류 0개·기존 경고 9개였다. 전체 타입 검사는 기존 Mapbox/download 오류 3개 때문에 성공하지 않았다.

다음은 이번 책임 배치와 구현 결과에 대한 사용자 검토다. 실제 OAuth·SecureStore·서버 rotation·실기기 화면은 실행하지 않았다. 화면 검사는 mock 경계의 component test, 데이터 보존 검사는 실제 Drizzle SQL과 Node 메모리 SQLite로 확인했다. Ticket 06의 온라인 복구 재조회·토스트·unknown 안내 끝단 연결과 foreground 재확인, 14의 전체 write/cache 계약, 15의 typed pull·cleanup 부분 실패 결과·중단 작업 재개, 16의 여행별 미전송 판정·cleanup 집계는 남는다. 이번에 재현한 여섯 결함의 해소를 Ticket 06–16 전체 완료나 사용자 acceptance로 확대하지 않는다.

판단 기준, 앞선 제안의 보정, 수정별 증거와 정확한 파일 진입점은 [재점검·구현 기록](../../records/2026-09-21-04-auth-responsibilities-and-regression-fixes.md)에서 읽는다.

## 그 밖의 남은 리팩토링

Ticket 06–16의 제품 구현과 Ticket 17의 남은 request·response·ownership·오류 경계는 미완료다. Ticket 06의 DB·auth 실패 처리와 화면 정책 적용은 위 결과에 포함하며, 남은 네트워크 소비 연결은 06, typed pull·cleanup 부분 실패 결과·중단된 작업 재개는 15에서 이어 간다. 여행별 미전송 판정과 정리 집계는 16에 남는다.

Ticket 07의 독립 API export, 08의 순수 계산과 12의 표시 Owner 조사도 다른 후속 구현 전체를 기다리지 않는다. 10·11의 입력과 14의 cache 계약은 13이 사용하고, 13·14·15의 결과는 09의 전체 준비 완료에 필요하다. 14·15는 16의 보존 조건에 연결된다.

Trip PATCH/PUT의 기대·수정 담당, 날짜 변경 뒤 무효 `scheduleId`의 입력 UX와 서버 개발환경 후보도 Main 조율이 남았다.

현재 Workspace 전체에 대한 제품 Verify receipt와 최종 acceptance는 없다. Ticket 01–05의 제한된 수락을 전체 Work 완료로 사용하지 않는다.
