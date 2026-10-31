# Ticket 09 소비자 전환과 기계 검사 결과

제품 기준을 찾는 현재 진입점을 Project 주제 본문으로 전환했다. root·앱·패키지 guide, Document Map·하네스 지도, runbooks·workflow 호환 안내, 개발 skill의 제품 입력 안내, 세 report-only agent가 같은 Owner를 읽는다. Project 본문 자체의 내용 충분성과 원본 9개의 보존·삭제는 Main과 별도 담당의 결과로 확인한다.

## 바뀐 읽기와 보존한 경계

여행 접근·Activation Router·Policy UI는 `guidance/travel-access/INDEX.md`, 원자성·queue·삭제·생성 ID는 `guidance/data-lifecycle/INDEX.md`, schema·타입은 `guidance/development-boundaries/schema-and-types.md`, 날짜·시점은 `common/date-and-time.md`, 인증·소유권은 `guidance/api-contracts.md`로 연결했다. root/server/schema guide의 생성 ID는 해당 본문의 생성 ID 절로 직접 진입한다.

단순 경로 치환 외에 rules·guards를 별도 현재 레이어로 두던 표와 구조도를 제거했다. runbooks는 실행 순서, Project는 제품 계약·적용 조건·실패 위험·확인 조건을 소유하도록 주변 역할 설명도 맞췄다. 삭제 파일명을 그대로 보여 주는 링크 이름과 같은 목적지로 중복된 workspace 안내를 정리했다. commands·audits의 현재 README 안내도 전환하되 당시 decisions·sessions·audit 본문은 수정하지 않았다.

`development` skill은 제품 입력 선택 한 문장만 전환했다. deprecated `noline-work`는 맨 위 현재 안내만 전환하고 과거 workflow는 이력으로 보존했다. observer의 기존 “skill은 dispatcher”라는 축소 표현은 root의 기존 skill 계약과 맞춰 호출 조건·판단·수행 방법·필요한 workflow를 소유하고 제품 기준은 Project에서 읽는다고 정정했다. 이 변경은 스킬 workflow 재설계나 제품 라우팅과 개발 수행의 혼합을 뜻하지 않는다. Claude와 Codex 세 agent의 입력 의미를 함께 맞췄으며 역할은 report-only로 유지한다. Codex 수정본은 별도 전달 후 Main이 실제 적용했다고 보고했다.

`context/README.md`의 중복 Owner 안내와 현재 session-bound된 002의 `current/memory/project-context.md`도 전환했다. inactive 003과 역사 Work 기록은 현재화하지 않았다.

## machine consumer와 Verify

현재 기본 Work 001의 `verify.json`은 삭제한 rule·guard evidence를 대응 Project 입력으로 바꾸고 중복을 제거했다. 새 검사 입력인 workflows·commands README·audits README와 제품 규칙 Owner 통합 결정을 evidence에 추가했다. 002는 schema canonical basis를 현재 Project 본문으로 전환했다. claim과 실행 명령을 넓히지 않았고 과거 receipt는 갱신하지 않았다. 006의 Verify는 Recover JSON parse 전용이어서 이번 제품 기준 경로의 변경 대상이 아니다.

`check-harness.mjs`는 `.claude/rules`·`.claude/guards`의 부활을 forbidden surface로 검사하고 현재 주제별 정본 다섯 개의 존재를 요구한다. 기존 입력에 빠져 있던 `.claude/workflows`와 commands·audits의 현재 README도 링크 검사에 포함했다. 과거 링크의 새 예외를 추가하거나 기존 실패를 무시하지 않았다.

## 실행 확인과 남은 실패

- `node --check scripts/check-harness.mjs`와 `git diff --check`가 통과했다.
- 임시 workflow 문서의 의도적인 missing 링크가 실제 검사에서 실패함을 확인하고 임시 문서를 제거했다.
- 임시 `.claude/rules` 디렉터리의 부활을 실제 검사에서 거부함을 확인하고 임시 디렉터리를 제거했다.
- 변경 전 `check-harness --no-git-diff`는 기존 역사·과거 Work missing 링크 47건으로 실패했다. 원본 삭제와 현재 소비자 전환 뒤에는 기존 47건과 inactive 003의 옛 rule·guard 링크 5건을 합쳐 52건으로 실패한다. 새 5건은 `003-bug-investigation-and-fixes/current/memory/project-context.md`의 기존 링크이며, 현재 제품 소비자가 아니다. 이 결과를 green으로 보고하지 않는다.

실행 로그는 당시 임시 작업 경로 `/tmp/noline-ticket09-before.log`, `/tmp/noline-ticket09-after.log`에 있다. 장기 판단에는 위 실패 구분을 사용하며 로그 파일의 영구 존재를 전제하지 않는다. 기계 링크·구조 검사는 내용 충실성과 제품 동작을 증명하지 않는다. 남은 역사 읽기·보존 링크의 정합성은 Ticket 12와 전체 통합 검증에서 별도로 판단해야 한다.
