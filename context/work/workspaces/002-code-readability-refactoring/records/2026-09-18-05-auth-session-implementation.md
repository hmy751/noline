# 인증 세션 정책의 테스트 우선 구현

사용자는 합의한 정책 문서를 먼저 커밋하고 시나리오 테스트부터 작성한 뒤 코드를 개선하도록 요청했다. 정책·과정 문서 9개를 `10960e9` (`docs: 인증 세션 정책과 결정 과정 정리`)로 커밋했다. 아래 제품 변경과 실행 기록은 그 커밋 이후의 작업이며 아직 커밋하지 않았다.

## 구현한 흐름과 읽을 순서

[Auth Store](../../../../../apps/client/src/shared/store/auth.ts)에서 다섯 상태와 초기 복원의 수명, 세션 교체와 저장 순서를 읽는다. `initializing`은 최초 읽기와 명시적 재시도에만 사용한다. 세션 없음·자격 증명 없는 계정 기록·읽기 실패를 구분하고, 새 로그인 뒤 늦게 끝난 복원은 적용하지 않는다.

[저장소](../../../../../apps/client/src/shared/services/auth/token-storage.ts)는 version 1의 단일 `noline_session` JSON에 계정·토큰·프로필을 저장하고 형식을 검증한다. 이전 낱개 키는 사용자와 최소 하나의 토큰이 함께 있는 경우에만 읽는다. 다음 로그인·갱신·재인증 전환부터 새 형식으로 저장한다. 기존 userId 하나만으로 세션을 만들지 않는다. 새 레코드가 있으면 이전 키보다 우선하며 로그아웃에서는 이전 키를 먼저 지워 과거 토큰이 되살아나지 않게 한다.

[복원 연결](../../../../../apps/client/src/shared/services/auth/session-restoration.ts)은 DB 준비 뒤 실제 데이터 소유자 검사까지 끝내고 상태를 공개한다. [요청 인터셉터](../../../../../apps/client/src/shared/services/auth/auth-interceptor.ts)는 일반 API와 sync가 공유한다. access 거부 뒤 refresh를 시도하고, 통신 실패·5xx는 일시 실패로 남긴다. refresh의 인증 거부·갱신 수단 부재는 계정을 남기고 토큰을 비워 재시작 뒤에도 재인증 필요 상태를 복원한다.

세션 식별은 사용자 ID와 별개의 프로세스 내 Symbol이다. Axios 재시도에도 그 식별을 유지한다. 이전 요청은 새 계정으로 재전송하지 않고, 늦은 갱신 결과도 이전 세션이면 적용하지 않는다. SecureStore 쓰기는 직렬화하므로 이미 시작한 토큰 저장 뒤에 로그아웃 삭제·새 세션 저장이 실행된다. 앱 종료 후 재개용 journal은 만들지 않았다.

[로그인 서비스](../../../../../apps/client/src/shared/services/auth/login-service.ts)는 Google/Apple의 서버 로그인 성공 뒤 호출한다. sync와 cleanup이 끝날 때까지 기다린 뒤 메모리의 이전 userId와 무관하게 실제 DB·큐 계정을 확인한다. 같은 계정은 보존하고 다른 계정은 DB·큐·선택·캐시를 정리한 뒤 적용한다. 소유자를 알 수 없는 큐는 자동 폐기하지 않고 로그인을 보류하며 데이터를 보존한다. 이 손상 상태를 자동 복구하는 기능은 구현하지 않았다.

[Root](../../../../../apps/client/app/_layout.tsx)는 재인증 화면 진입을 허용한다. 같은 계정으로 성공하면 기존 화면으로 돌아가고, 다른 계정이면 계정별 화면을 새로 구성한다. [로그인 화면](../../../../../apps/client/src/screens/LoginScreen.tsx)은 복원 실패·재시도와 기존 여행으로 돌아가기, 다른 계정 전환 시 데이터 폐기를 안내한다. 배너는 기기에 저장한 변경과 서버 동기화 상태를 구별한다.

[로컬 접근 조건](../../../../../apps/client/src/shared/services/auth/local-access.ts)은 조회·수정에 계정 조건과 활성 여행 조건을 함께 제공한다. Trip 단건 조회·수정·삭제는 대상 여행의 활성 상태로 분기한다. 재인증 상태의 여행 목록은 자기 활성 여행만 반환한다. Schedule·Expense 로컬 읽기·CUD도 소유 계정과 활성 여행을 확인하며 인증 만료에 따른 날짜 제한은 두지 않는다. [Policy](../../../../../apps/client/src/shared/policy/useAppPolicy.ts)는 재인증 중 비활성 데이터와 새 여행 생성을 제한하되 서비스의 실제 네트워크 정책을 바꾸지 않는다.

[로컬 계정 검사](../../../../../apps/client/src/shared/services/auth/local-account.ts)는 기존 큐에 새 userId 컬럼을 추가하는 대신 원본 row의 소유자와 payload의 계정이 일치하는지 확인한다. 소유자를 알 수 없거나 현재 계정과 다른 큐는 전송하지 않는다. sync의 pull 대상과 응답에도 현재 계정 조건을 적용했다. 엔진 전체의 결과·재시도 정책을 완료한 것은 아니다.

## 테스트에서 발견한 추가 결함

세션 복원 18개 검사를 먼저 작성해 기존 코드의 실패를 확인했고, 일반 API·sync의 갱신과 늦은 응답, 라우트의 재로그인 진입·복귀, 계정 전환과 로컬 접근도 실패 사례를 먼저 고정했다. 일부 기존 테스트의 boolean fixture는 새 상태 모델로 옮겼으며 DB 실패·cleanup·로그아웃 순서의 기존 회귀 검사는 유지했다.

로컬 접근 검사는 Node의 메모리 SQLite에 실제 Drizzle SQL을 실행한다. 큐 insert를 실패시키는 trigger를 만들자 기존 `withTransaction`이 로컬 일정만 남기는 결함이 재현됐다. 설치된 Drizzle Expo adapter의 동기 `transaction`은 async callback을 기다리지 않고 commit했다. [DB 실행](../../../../../apps/client/src/shared/db/index.ts)에서 비동기 작업의 완료까지 BEGIN/COMMIT/ROLLBACK을 관리하고 실행을 직렬화하도록 바꿨다. reset도 진행 중 transaction 완료를 기다린다. 수정 뒤 같은 실패 검사에서 일정과 큐가 함께 남지 않는 것을 확인했다. 기기 SQLite의 모든 동시성·cleanup 계약까지 증명한 것은 아니다.

## 실행 근거와 남은 범위

- 전체 client Jest: **23개 suite·235개 test 통과**. `node node_modules/jest/bin/jest.js --config apps/client/jest.config.cjs --runInBand --silent`로 실행했다. SQLite fixture는 Node 24의 `node:sqlite`를 사용하며 실기기 DB를 건드리지 않는다.
- TypeScript: 이번 변경의 오류는 없고 기존 Mapbox 관련 오류 3개가 남았다. `shared/lib/mapbox.ts:61`의 좌표 tuple, `shared/services/offline-map/download.ts:171–172`의 `OfflinePack.size/tileCount`다.
- 변경 TS/TSX 파일의 ESLint는 formatter rule을 제외하고 오류 0개다. 설치된 eslint-plugin-prettier와 Prettier 버전이 맞지 않아 일반 실행은 `prettier.resolveConfig.sync`에서 실패했다. 포맷은 저장소 설정으로 Prettier를 별도 실행해 확인했다. 의존성·설정은 변경하지 않았다.
- Expo 개발 빌드·실기기 SecureStore·실제 Google/Apple 로그인·서버 token rotation은 실행하지 않았다. 복귀 테스트도 화면 fixture 범위이며 기기에서 작성 중인 폼의 실제 수명은 추가 확인해야 한다.

남은 Ticket 06 범위는 inactive child의 Local 선조회 제거, 제한·복구 화면과 foreground 재확인이다. 이번에 Trip 단건 Router는 대상별로 고쳤지만 inactive Schedule·Expense의 update/delete가 Local에서 tripId를 찾는 경계는 아직 남아 있다. 엔진 전체의 결과·재시도와 cleanup 보존은 Ticket 15·16, transaction 전체 계약의 기기 검증은 14에서 이어 간다. 사용자 acceptance와 Ticket 전체 완료는 아직 받지 않았다.
