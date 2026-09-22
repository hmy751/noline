# 인증 책임 기준의 재점검과 구현

## 선택 근거

현재 대화에서 사용자는 “어떤건 local-access 에서 로컬 아이디를 읽고 어떤건 … auth.ts라는 store에서 해결하고 … 헷갈리는데 이렇게 해야만 하는 이유가 있을까”라고 물었고, 이어 “동작 오류이거나 나눠야 하거나 책임을 분리해야하는 거면 인정”하며 전체 점검을 요청했다. Main은 분리 필요와 실제 동작 보장을 함께 재검토했다. 사용자가 기준을 확인한 뒤 “더 구체화 할 필요없으면 구현 해주고 있으면 질문하고”라고 요청해 구현했다.

확정한 기준은 상태 기반 인증 판단을 Auth Store에 모으고, DB 사실은 DB 접근 코드에 두며, 하나의 세션 변경 절차는 전체 순서를 책임지는 곳에서 보호하는 것이다. 화면과 실행 결과는 실제 제한·중단을 표현한다. 함수 길이·nullable/throwing 차이만으로 파일을 나누지 않는다. 앞선 ‘ID를 한 번 읽어 넘기자’는 제안은 await 도중 세션 변경을 보장하지 못하므로 최종 설계로 채택하지 않았다.

## 재현과 수정

이전 전체 client 검사 270개가 통과한 상태에서 Main이 추가 검사를 실행해 다음 여섯 동작 실패를 확인했다. 테스트 로딩 문제가 아니라 기대/실제 assertion에서 실패했다.

- A 저장 중 B 로그인이 계정 없음 검사를 통과해 둘 다 성공했다. 복원·로그인 계정 검사와 저장·세션 적용을 Store의 같은 큐에 두었다.
- 세션 삭제 성공 뒤 겹친 로그인 저장이 실패하면 빈 저장소와 reauth-required가 함께 남았다. 직렬화된 삭제 성공을 먼저 signed-out으로 반영한다.
- 다른 refresh의 기기 저장 중 재전송 401을 확정해도 새 보호 요청이 전송됐다. 인증 거부는 즉시 메모리에 적용하고 세대를 바꿔 늦은 refresh 적용을 막는다.
- 일반 로그아웃의 최초 확인 뒤 Local 저장이 성공하고 그 큐가 삭제됐다. 전체 세션 변경 절차가 sync·cleanup을 기다린 뒤 새 transaction을 거절하고 접수된 저장을 마친 뒤 미전송 여부를 판단한다.
- vacuum이 미전송 큐가 참조하는 원본을 지워 같은 계정의 판정이 unresolved가 됐다. 일정·경비 삭제 조건에서 큐 참조를 제외했다.
- push가 인증 때문에 PENDING을 남기고도 활성 여행이 없으면 sync가 completed를 반환했다. 인증 중단 오류를 engine에서 lifecycle까지 전달한다.

추가로 HTTP retry의 문서상 최대 3회와 실제 1회가 달랐다. 실제 adapter·fake timer 검사에 맞춰 2·4·8초의 최대 3회로 고쳤다. 큐 재시도는 별도 책임이며, 한도를 넘긴 FAILED·남은 IN_PROGRESS를 건너뛰지 않는다. IN_PROGRESS의 명시적 재개 정책을 새로 정한 것은 아니다.

## 책임 배치와 보호 범위

Auth Store의 토큰은 내부 변수에 두고 공개 상태는 기존 다섯 상태와 계정·세션 식별자로 유지했다. selectLocalUserId·requireLocalUserId·requireRemoteSession과 인증 오류도 같은 파일에서 읽는다. local-access에는 SQL 접근 조건, local-account에는 DB·큐 소유자 검사를 둔다. DB에 사용자 데이터가 있다는 이유만으로 세션을 생성하지 않는다.

새 session-lifecycle 모듈은 로그인·로그아웃·회원 탈퇴의 전체 순서만 공유한다. Store의 저장 큐는 refresh·복원까지 포함한 기기 기록 순서를, 이 모듈은 DB 삭제와 백그라운드 작업까지 포함한 사용자 절차를 보호한다. sync·cleanup을 먼저 기다리고 transaction을 막는 순서는 서로의 종료를 기다리는 교착을 피한다. 일반 HTTP 요청을 재로그인까지 보관하지 않는다.

DB 초기화도 큐·테이블 삭제와 재생성을 하나의 transaction으로 묶었다. 재생성 실패를 주입한 SQLite 검사에서 원본과 큐가 복구됐다. 삭제된 세션 뒤 늦은 activation 응답을 transaction에서 확인하고 다른 계정 응답도 거절한다. Store action 자체는 공개돼 있으므로 서비스 사용을 타입으로 강제한 구조라고 설명하지 않는다.

화면은 실제 useAppPolicy를 소비한다. 비활성 여행의 재인증·offline·unknown에는 캐시 내용 대신 제한 안내를 표시한다. 화면 내용만 분기하고 Drawer는 mount를 유지한다. 오프라인 일정 저장은 기존 장소·좌표를 덮지 않고, 경비는 기존 일정 연결을 표시하고 payload에도 유지한다. 제한 중 숨겼다 돌아와도 작성 값이 유지되는 것을 확인했다. 복원 실패·signed-out의 기기 정리는 데이터 손실 Alert에서 사용자가 확인한 뒤에만 force logout을 호출한다.

## 커밋별 검증

Main이 HEAD를 별도 임시 디렉터리에 복제하고 각 커밋 후보의 파일·부분 변경만 반영해 검사했다. 의존성은 기존 설치를 공유하고, Jest source와 TypeScript 진입은 후보 경로를 사용했다.

- 인증 범위의 당시 커밋 `e79fbb1`: 30개 suite·277개 test 통과. 새 Auth 상태를 읽는 최소 Policy 변경만 포함하고 이름·CRUD·화면 정리는 제외했다.
- 동기화 범위의 당시 커밋 `6f6a74c`: 33개 suite·288개 test 통과. FAILED 종료 보류·재시도 순서·인증 중단·vacuum 보존을 추가했다.
- 화면 정책 커밋 후보: 35개 suite·297개 test 통과. 기존 입력과 연결, 화면 캐시 제한 및 실패 복구 행동을 component test로 확인했다.

최종 변경 파일 Prettier·diff 검사는 통과했다. ESLint는 설치된 prettier plugin과 Prettier 3의 resolveConfig.sync 충돌 때문에 해당 규칙만 제외해 실행했고 오류 0개·기존 경고 9개였다. 전체 TypeScript는 기존 mapbox 좌표 tuple 오류 1개와 OfflinePack size/tileCount 오류 2개로 실패했다. 이번 변경·검사 파일에서 추가 타입 오류는 남지 않았다.

검사는 native SecureStore·OAuth·실서버 token rotation·실기기 SQLite·실제 화면 조작을 대신하지 않는다. Node 메모리 SQLite와 실제 Drizzle SQL, 제어 가능한 기기 저장·HTTP, React component render 범위의 증거다. 제품 Verify receipt나 사용자 acceptance는 만들지 않았다.

2026-09-22에 사용자의 요청으로 위 두 커밋과 당시 화면 커밋을 `9936662`까지 풀고 파일 내용은 유지했다. 이후 인증은 `62ce226`, 동기화는 `100e71a`로 범위를 다시 분리해 저장했다. Main은 두 범위와 화면 정책 후보를 각각 별도 디렉터리에서 다시 실행해 위와 같은 277개·288개·297개 test 통과를 확인했다. 옛 해시는 당시 검토 이력이며 현재 브랜치의 커밋 경계는 [state](../current/state/index.md)가 소유한다.

## 남은 일

이번 작업은 합의한 책임 기준과 재현한 결함을 구현했다. Ticket 06의 네트워크 복구 조회·토스트·unknown 안내 끝단과 foreground 재확인, 14의 전체 local write/cache 계약, 15의 typed pull·중단 작업 재개, 16의 여행별 미전송 predicate·cleanup 집계는 남는다. 이 항목들을 자동으로 완료 처리하지 않는다. 현재 코드·검사 위치는 [output](../output/index.md), 다음 판단은 [state](../current/state/index.md)가 소유한다.
