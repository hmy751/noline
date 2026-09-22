# 다섯 단계 분리 커밋과 검증 마무리

## 저장한 동작 경계

사용자가 정한 라우팅 → DB 저장 → 인증 흐름 → 동기화 → 화면 정책 순서로 변경을 검토하고 커밋했다. 한 파일에 여러 책임이 섞인 경우에는 파일 전체가 아니라 해당 커밋에서 완성되는 동작을 기준으로 나눴다. 앞서 인증·동기화·화면 변경을 한꺼번에 저장한 커밋은 사용자의 요청으로 `9936662`까지 풀고 내용은 유지한 뒤, 각 범위를 다시 분리했다.

- `f0f680e` — Schedule·Expense의 대상 `tripId`와 Trip 활성 상태를 기준으로 Local/Remote를 선택한다. 비활성 여행의 서버 작업이 불필요한 Local 선조회에 막히지 않도록 한 범위다.
- `9936662` — Local 데이터와 sync queue를 같은 transaction에 저장하고, 큐·메타데이터·서버 pull 저장·DB 초기화의 접근 순서를 보호한다.
- `62ce226` — 인증 거부 뒤 보호된 서버 요청을 멈추고 활성 여행의 Local 접근은 유지한다. 같은 계정의 재로그인과 기기 저장, 다른 계정 거절, 이전 세션의 늦은 응답 차단을 연결한다.
- `100e71a` — sync queue의 소유 계정과 응답 계정을 확인하고 FAILED 재시도, 뒤 작업 중단과 실패 전달, 로그아웃·cleanup의 미전송 원본 보존을 연결한다.
- `be2f5b9` — Schedule·Expense의 CRUD 화면 정책, 제한 안내와 캐시 내용 차단, 수정 Drawer의 기존 값·연결 보존을 연결한다. 사용자가 함께 요청한 인증 파일 두 곳의 빈 줄 정리와 Ticket·state·output 갱신도 이 커밋에 포함됐다.

각 구현의 파일 진입점은 [output](../output/index.md), 인증 책임을 재검토한 이유와 실패 재현은 [앞선 기록](2026-09-21-04-auth-responsibilities-and-regression-fixes.md)에 있다. 이 기록은 과거 커밋 해시도 당시 이력으로 보존한다. 현재 브랜치의 저장 경계는 위 다섯 해시다.

## 분리 검증의 의미와 한계

Main은 인증 후보만 있는 별도 디렉터리에서 client Jest 30개 suite·277개 test, 동기화까지 반영한 후보에서 33개 suite·288개 test를 통과시켰다. 화면 정책을 더한 후보는 35개 suite·297개 test가 통과했다. 마지막 커밋 직전에는 실제 staged diff를 HEAD에만 적용한 별도 디렉터리에서 같은 client Jest를 다시 실행해 **35개 suite·297개 test 통과**를 확인했다. `git diff --cached --check`도 통과했다. 따라서 혼합 작업 트리의 검사 결과를 분리 커밋의 근거로 사용하지 않았다.

앞선 변경 파일 Prettier 검사와 Prettier plugin 충돌 규칙만 제외한 ESLint 실행은 오류 0개·기존 경고 9개였다. 최종 후보의 TypeScript 검사는 기존 `mapbox.ts` 좌표 tuple 오류 1개와 `offline-map/download.ts`의 `OfflinePack.size`·`tileCount` 오류 2개로 전체 성공하지 않았다. 검사는 제어 가능한 인증 저장·HTTP mock, Node 메모리 SQLite와 실제 Drizzle SQL, React component render 범위다. 실제 OAuth·SecureStore·서버 token rotation·실기기 SQLite·화면 조작은 확인하지 않았다. 제품 Verify receipt나 사용자 최종 수락은 없다.

## 이후 판단

다섯 커밋은 이번에 나눈 구현 범위를 저장한 결과다. Ticket 06의 온라인 복구 뒤 재조회·토스트, unknown 안내와 foreground 재확인, Ticket 14의 전체 write/cache 계약, Ticket 15의 typed pull·cleanup 부분 실패 결과·중단 작업 재개, Ticket 16의 여행별 미전송 판정·cleanup 집계는 남는다. 다음 작업자는 [state](../current/state/index.md)와 해당 Ticket에서 현재 범위와 확인 조건을 읽는다. 이 기록은 Ticket 06–16 전체 완료나 Workspace 수락으로 사용하지 않는다.
