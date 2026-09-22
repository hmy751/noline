# 인증 소비 경계의 좁은 적용과 검증

Ticket 06의 인증 묶음은 라우팅·DB 커밋 뒤에도 미커밋이었다. 직전 medium 서브에이전트가 도입한 별도 session-store와 facade는 사용자 요청으로 원복됐다. 사용자는 현재 구현이 정책 방향에 맞는지 확인한 뒤 작업 진행을 요청했다. 이번에는 기존 Auth Store를 유지하고, 소비자가 같은 값을 다른 뜻으로 읽는 지점과 실제 실패로 재현된 저장 순서·인증 오류만 수정했다. 이 기록은 적용과 검증 사실이며 사용자 최종 수락이나 인증 묶음의 커밋 기록이 아니다.

## 선택한 경계

- `authStore.userId`는 signed-in·reauth-required에서만 값을 반환했지만 `useAuthStore.getState().userId`는 원래 상태를 읽었다. 조건을 숨긴 두 번째 Store 객체를 제거하고, Local 접근이 필요한 소비자는 `selectLocalUserId`를 명시해 두 상태에서만 소유자를 얻는다. 보호된 Remote 요청은 여전히 signed-in 조건을 따로 확인한다. 모든 소비자를 signed-in으로 제한하면 합의한 만료 후 활성 여행 Local CRUD를 막기 때문이다.
- 앱 진입은 `restoreDeviceSession`에서 선택적 검증 callback을 Store에 넘겼다. Store가 `inspectLocalAccount`를 직접 필수 호출해 소유자가 다르거나 불명확하면 세션을 공개하지 않고 restore-failed로 둔다. AppInitialization과 로그인 화면의 재시도는 인자 없는 Store 복원 action을 호출한다. 실패해도 SecureStore·SQLite 데이터를 자동 삭제하지 않는다.
- `completeLogin`은 소유권 검사·sync/cleanup 중단·기기 저장을 포함한다. 공개 Store의 `login`은 저장·적용만 하므로 `saveAndApplySession`으로, Store의 `logout`은 기기 세션 삭제만 하므로 `clearSession`으로 이름을 바꿨다. 전체 절차의 함수와 부분 동작의 차이를 코드에서 드러냈지만, 부분 action 호출을 타입으로 금지한 구조는 아니다.
- Router의 재인증 필요 Remote 경로도 API interceptor와 같은 `AuthRequiredError`를 반환한다. Query retry가 이 오류를 재시도하지 않는 현재 기준과 맞췄다. 활성 여행의 Local 경로는 계속 실행한다.

## 실패 재현과 수정

기존 Store에서는 로그인 A의 SecureStore 쓰기가 진행 중일 때 로그인 B가 시작되고 B의 쓰기가 실패하면, 디스크에는 A가 저장돼도 A는 뒤 요청이 있다는 이유로 공개되지 않았다. 새 회귀 검사는 기존 코드에서 공개 상태 `initializing`을 확인해 실패했다. 저장 성공을 직렬화 순서대로 적용하고, 로그아웃 시작을 별도 세대로 표시해 그 뒤 완료된 로그인은 실패로 알리고 적용하지 않게 했다. A 저장 성공·B 저장 실패이면 A가 앱 상태와 디스크에 남고, 로그인 저장 중 로그아웃하면 삭제 뒤 signed-out으로 끝나는 두 경우를 검사했다.

Router 회귀 검사도 기존 코드에서 일반 `Error`를 받아 실패했고, 수정 뒤 `AuthRequiredError`를 확인했다. 복원 검사는 다른 계정과 소유자 불명 결과 모두 저장값 삭제 없이 restore-failed가 되는지 확인한다. 기존 SQLite Local 접근·API interceptor·로그인·sync·앱 레이아웃 검사를 함께 실행했다.

## 검증과 열린 범위

Project root에서 `git diff --check`와 변경 파일 Prettier 검사를 통과했다. client Jest 전체는 **28개 suite·270개 test 통과**다. 변경 파일 ESLint는 repository의 `eslint-plugin-prettier`와 Prettier 3 API 충돌로 기본 실행이 시작되지 않아 해당 rule만 끄고 실행했고, 오류 0개·기존 화면 경고 5개였다. client TypeScript 검사는 이번 변경과 무관한 기존 `mapbox.ts` 1개와 `offline-map/download.ts` 2개 오류에서 종료했다.

이 검사는 인증·Policy·sync의 다른 미커밋 변경이 함께 있는 작업 트리에서 실행했다. 인증 범위만 반영한 별도 Git 상태의 검사는 아직 없으므로 커밋 가능 상태를 입증하지 않는다. Native SecureStore, 실제 OAuth·서버 token rotation, 실기기 SQLite·화면 흐름도 확인하지 않았다. 일정·경비 목록의 read 정책 소비와 restore-failed·signed-out에서 잔존 로컬 데이터를 명시적으로 정리하는 화면은 남아 있다. 미전송 DELETE 원본 정리와 로그아웃 확인 이후 Local 변경의 보존은 Ticket 16·14와 함께 별도로 검증한다.

이번 수정의 원자료는 현재 `apps/client/src/shared/store/auth.ts`, `apps/client/src/shared/services/auth/local-access.ts`, `apps/client/src/shared/services/offline-prep/router.ts`와 대응 Jest 파일이다. 앞선 철회 경계는 [이전 기록](2026-09-21-02-auth-token-separation-consumer-review-and-rollback.md)에 보존했다.
