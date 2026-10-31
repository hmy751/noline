# 기기 세션과 활성 여행의 로컬 접근

> 2026-09-19 후속 결정: 재로그인은 같은 계정의 인증만 복구하고, 다른 계정 전환은 명시적 로그아웃 뒤 로그인으로 진행한다. 아래 본문은 최초 구현 당시 결정이며 자동 계정 전환 부분은 이 합의로 대체됐다. 현재 기준과 이유는 [Workspace Spec](../../context/work/workspaces/002-code-readability-refactoring/current/memory/spec/02-behavior-and-cases.md)과 [추가 결정 기록](../../context/work/workspaces/002-code-readability-refactoring/records/2026-09-19-01-auth-complexity-review-and-decisions.md)을 따른다. 제품 코드의 후속 보완은 아직 남아 있다.

채택한 인증 정책을 클라이언트에 구현했다. 결정 과정과 제외 범위는 [Workspace의 인증 논의 기록](../../context/work/workspaces/002-code-readability-refactoring/records/2026-09-18-04-auth-session-policy-and-decisions.md), 현재 실행·검증 범위는 [Ticket 06](../../context/work/workspaces/002-code-readability-refactoring/current/memory/tickets/06-app-startup-lifecycle.md)에서 읽는다.

서버 로그인으로 생성한 SecureStore 세션 기록은 계정과 nullable access/refresh token을 함께 저장한다. 인증 수단을 복원한 `signed-in`은 서버가 방금 유효성을 확인했다는 뜻이 아니다. 자동 갱신까지 인증 거부된 `reauth-required`는 같은 계정의 활성 여행에 대한 로컬 CRUD를 계속 허용하고, 인증이 필요한 원격 요청과 새 동기화는 막는다. 별도 로컬 이용 기한은 추가하지 않는다.

`initializing`은 최초 복원과 복원 실패의 명시적 재시도에만 사용한다. 성공적으로 읽은 기록 부재는 `signed-out`, 읽기·해석 실패 또는 데이터 소유자 불일치는 `restore-failed`다. 실패만으로 저장된 데이터를 지우지 않는다. 다른 계정으로 전환할 때에는 이전 DB와 큐를 폐기한 뒤 새 계정을 공개한다. 소유자를 확인할 수 없는 큐를 다른 계정 데이터로 단정해 자동 폐기하지 않는다.

일반 API와 sync는 첫 401 뒤 같은 갱신 경로를 사용한다. 통신 실패·5xx를 인증 만료로 확정하지 않으며, 갱신의 401/403 거부 또는 갱신 수단 부재를 재인증 필요로 처리한다. [기존 Axios Factory 결정](2025-12-23-auth-axios-factory.md)의 인스턴스 분리는 유지하지만, 그 문서의 sync 전용 무갱신 401 처리는 이 결정으로 대체한다. 요청 시점의 세션 식별자를 보존해 로그아웃·다른 계정 로그인·같은 계정 재로그인 뒤의 이전 응답을 적용하지 않는다.

다중 기기 제어·원격 세션 회수·로그아웃 중 앱 종료 후 정리 재개는 이번 구현에 추가하지 않았다. 실제 기기 SecureStore·Expo 진입·실제 서버의 token rotation 검증은 별도로 남아 있다.
