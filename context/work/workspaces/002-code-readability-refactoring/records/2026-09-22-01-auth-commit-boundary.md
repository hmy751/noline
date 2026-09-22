# 인증 세션 변경의 커밋 경계와 분리 검증

## 이번에 저장하는 동작

이 커밋은 인증 만료를 확인한 뒤 보호된 서버 요청을 멈추고, 같은 계정의 활성 여행에 대한 Local 작업을 유지하며, 같은 계정으로 재로그인해 기기 저장에 성공하면 기존 로컬 데이터와 큐를 보존한 채 정상 흐름으로 돌아가는 변경이다. 다른 계정이나 소유자를 확인할 수 없는 로컬 데이터가 있으면 로그인을 적용하지 않는다. 이전 세션에서 늦게 도착한 갱신·서버 응답도 현재 세션에 적용하지 않는다.

Auth Store는 계정·인증 상태와 토큰의 저장·적용 순서를 소유한다. `selectLocalUserId`와 필수 Local·Remote 계정 검사는 이 상태에서 답하며, `local-access`는 여행 소유권·활성 조건 SQL, `local-account`는 DB·큐의 실제 소유자 검사를 맡는다. `session-lifecycle`은 로그인·로그아웃·회원 탈퇴가 sync·cleanup·Local 저장과 겹치는 전체 순서를 보호한다. 일반 API와 sync는 같은 인증 갱신·거부 판단을 사용한다. 첫 401 뒤 갱신과 재전송은 한 번이며, 일반 HTTP 재시도와 저장된 sync queue 작업 재시도는 서로 다른 책임이다.

화면에서는 복원 실패의 재시도, 재로그인 이동, 만료 안내를 연결한다. `useAppPolicy`에는 새 인증 상태를 읽는 최소 변경만 포함한다. Schedule·Expense의 CRUD별 정책과 제한 화면·Drawer 입력 보존, 실패한 sync 작업의 재선택·원본 보존은 각각 뒤의 화면 정책·동기화 범위로 남긴다. 이 구분은 앞서 합의한 라우팅 → DB 저장 → 인증 → 동기화 → 화면 정책 순서를 따른다.

## 분리 방법과 확인 결과

이전 세션에서 한꺼번에 만든 세 커밋은 사용자의 요청으로 `9936662`까지 풀었고, 코드와 문서는 작업 트리에 남겼다. 이번에는 그중 인증 단계 후보만 Git index에 올렸다. 후보의 전체 파일 내용은 당시 인증 후보 `e79fbb1`의 tree와 `git diff --cached --quiet e79fbb1`로 일치함을 확인했다. 나머지 동기화·화면 정책 변경은 작업 트리에 남아 있다.

해당 tree를 별도 임시 디렉터리에 펼치고 설치된 의존성을 연결해 client Jest 전체를 실행했다. 결과는 **30개 suite·277개 test 통과**다. 따라서 혼합 작업 트리의 통과 결과를 인증 커밋의 근거로 대신하지 않았다. 같은 후보의 TypeScript 검사는 기존 `mapbox.ts` 좌표 tuple 오류 1건과 `offline-map/download.ts`의 `OfflinePack.size`·`tileCount` 오류 2건으로 실패했으며, 인증 변경 파일의 추가 타입 오류는 출력되지 않았다. `git diff --cached --check`도 통과했다.

검증은 제어 가능한 SecureStore·HTTP mock, Node 메모리 SQLite와 실제 Drizzle SQL, React component test 범위다. Native SecureStore·실제 OAuth·서버 token rotation·실기기 SQLite·화면 조작은 확인하지 않았다. 이번 결과는 Ticket 06 전체 완료나 사용자 최종 수락을 뜻하지 않는다. 관련 정책 선택과 앞선 재현은 [인증 논의 기록](2026-09-18-04-auth-session-policy-and-decisions.md), [분할 검토 기록](2026-09-21-01-auth-policy-split-review-and-commits.md), [인증 소비 경계 기록](2026-09-21-03-auth-consumer-boundary-implementation.md)에 있다.
