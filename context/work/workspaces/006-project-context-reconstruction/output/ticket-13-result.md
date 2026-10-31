# Ticket 13 — 006 전체 대조와 종료 판단

2026-10-31. 최초 후보 지도·추가 정리·09–13 구성과 실제 현재 본문·진입을 대조했다. 독립 개선 검토와 별도 요구 검증의 발견을 수정하고 재확인했다. 제품 본문 통합과 host 연결의 선행 결과는 유지한다. 이후 사용자와 남은 문서의 배치를 재검토해 `.claude` 문서·archive 정리를 이어가기로 했으므로, 전체 정리와 006 종료는 아직 완료되지 않았다.

## 처음 요청한 결과와 현재 대응

| 후보·질문 | 현재 Owner와 확인 결과 |
| --- | --- |
| 제품 장면·활성화·오프라인에서 무엇이 남는가 | Project common/product·decisions 0001·travel-access에서 목적·Local/Remote·Policy·미전송 보호·초안 보존과 선택 비용을 함께 읽는다. |
| 저장·queue·sync·삭제·cleanup | data-lifecycle에서 원자성·생성 ID·미전송 보호와 현재 구현 공백을 구별한다. |
| 지도·경로 준비·일정 변경 | offline-maps-and-routes에서 자원/metadata·성공 범위·재사용·실패·오래된 geometry의 차이를 설명한다. |
| 입력·수동 장소·날짜·부모 화면 | writing-and-input에서 초안·검색·채택·picker·저장 요청·닫기/재열기와 현재 차이를 연결한다. |
| 계층·UI·schema·TypeScript | development-boundaries와 패키지 guide에서 실제 책임·예외·타입/런타임 경계를 구별한다. |
| 날짜·금액·API·인증·오류 | common date/currency와 API/error guidance에 계약·대안·현재 차이를 통합했다. |
| 개발 시작·앱 실행·세션 | START_GUIDE·서버/SQL README·app-runtime·start-app은 각 독자의 진입·실행·현재 지원 범위를 나눠 소유한다. |
| rule·guard·runbook·commands | 제품 기준은 주제 Owner, 일반 개발은 development, PR은 조건부 reference가 소유한다. 옛 실행 경로는 제거됐다. |
| 과거 선택·실험·세션 | Project decisions와 형성 자료에서 필요한 뜻을 직접 설명하고 원판은 Work 역사 보존물로 분리했다. |
| 공통 스킬·host 설정·검사 | `.agents/skills` 정본과 Claude 단일 연결, 각 host 설정·wrapper, Work Maintain으로 분리했다. 원본·발견·실제 명시 호출·회귀 근거는 Ticket 11 결과를 재사용했다. |

이 표는 전체 원문 완독이나 제품 구현 완료의 주장이 아니다. 각 주제의 실제 대조·선택 이유·제외·제품 공백은 해당 Ticket 결과가 소유한다. 독립 전체 검토는 의미·비용·현재 Owner를 대표 본문과 필요한 코드로 직접 대조했으며 기존 결과 요약만 정답으로 삼지 않았다.

## 마지막에 발견해 수정한 현재 결함

client/server workspace guide의 Ownership 표가 제거된 rule·guard를 계속 지시하고, transaction 원자성을 ‘가능한 한’으로 약화한 문장을 발견했다. Project 데이터 수명·여행 접근·API Owner로 직접 연결하고, sync-owned Entity Local mutation과 queue를 같은 transaction으로 확정하는 필수 계약에 맞췄다. client의 제거된 sessions 기록 관행도 제품 Project·실행 Work·원문 보존의 책임으로 고쳤다. 독립 리뷰어가 실제 diff와 현재 본문을 재확인해 발견을 닫았다.

새 Project Decision의 선택적 archive appendix도 006의 엄격한 읽기 분리 조건과 충돌할 수 있다는 독립 검증을 받았다. 대안·이유·비용·최소 인용은 모두 유지하고 원문을 추가로 읽도록 하는 링크·안내를 삭제했다. Project 전체에서 archive로 가는 Markdown 읽기 연결은 0이며, 원판은 Work 보존 지도에서 관리한다. 독립 검증자가 본문과 색인 수정을 재확인했다.

## 현재 소비자와 실제 재진입

[소비자 관찰](ticket-13-live-consumers.json)에서 default 001과 current-generation 002·006을 확인했다. 이들의 현재 Recover·Verify 선언 입력은 regular 파일이며 symlink 부모를 경유하지 않는다. 002 Verify의 삭제된 옛 폼 6개는 실제 코드·삭제/분리 commit을 대조해 현재 책임 파일 9개로 보완했다. [선언 변경 근거](ticket-13-verify-input-reconciliation.json)에 범위와 대응을 남겼고 claim·argv는 바꾸지 않았다. 제품 코드는 수정하지 않았다.

001은 옛 검증 receipt가 `.claude/skills` 원본 경로를 기록하고 있어 원본이 symlink로 전환된 뒤 Recover가 거부하는 현재 문제를 찾았다. 옛 receipt를 고치거나 안전 검사를 완화하지 않고 현행 선언으로 Verify를 실행해 새 receipt를 만들었다. 002도 고정 타입 검사를 실제 실행해 새 receipt를 남겼다. 이후 001·002·006의 Recover는 모두 exit 0이다.

[실행 결과와 receipt 경로](ticket-13-verification-results.json)에서 001 구조 검사는 역사 링크 62건으로 실패했고, 002 client noEmit 타입 검사는 좌표 타입·Mapbox 객체 타입·UI 패키지 rootDir 등으로 실패했다. 이 실패를 현재 제품 수정으로 해결한 것처럼 보고하지 않는다. 001/002 receipt freshness의 fresh는 기록한 입력이 현재와 일치한다는 뜻이며, 검사 pass나 전체 작업 수락을 뜻하지 않는다. 006의 초기 Verify는 `recover.json` 파싱에 한정되므로 전체 006 완료 증거로 대체 사용하지 않았다.

## 남은 .claude 항목의 역할과 재검토한 배치

최초 전체 대조에서는 아래 역할을 근거로 기존 위치의 유지를 제안했다. 이후 실제 root·Context·Document Map·harness 본문을 대조하니 탐색과 관리 기준이 반복됐다. 역할이 필요하다는 사실은 기존 파일·위치 유지의 충분한 이유가 아니므로 문서 지도·harness·archive의 배치 판단을 변경했다. 사용자 요청에 따라 먼저 현재 결과를 기록·커밋하고 다음 정리를 순서대로 수행한다.

| 항목 | 유지할 이유와 Owner |
| --- | --- |
| README | 제품 탐색·읽기·보존 안내가 root와 Context에 반복된다. 필요한 고유 의미와 현재 소비자를 기존 Owner로 연결한 뒤 제거한다. 아직 적용하지 않았다. |
| harness/README | 공통 bridge·경로별 guide 기준·커밋 규칙은 root, Maintain 연결 상세는 기존 Work 계약으로 통합한 뒤 제거한다. 제품 기준은 Project, 수행은 공통 스킬이 계속 소유한다. 아직 적용하지 않았다. |
| settings.json·hooks/maintain.py | Claude의 host lifecycle·인자 적응과 선택적 개인 dispatcher 진입. 대응 Codex 설정·wrapper와 공통 구현의 역할 차이가 있어 무조건 합치지 않았다. |
| skills symlink | Claude가 공통 정본을 발견하는 필수 host 연결. 실제 내용은 `.agents/skills` 하나에 있다. |
| _archive | 정확한 과거 원문·복구 근거를 루트 `_archive/`로 옮기고 현재 참조·검사 경로를 맞춘다. Context·스킬의 유효한 형성 자료와 Work 기록은 각 Owner에 유지한다. 아직 이동하지 않았다. |
| ignored 개인설정 | 개인 권한·설치 선택의 영역으로 이번 공유 문서 정리 범위 밖이다. 비밀값은 읽거나 복제하지 않았다. |

## 종료에 대한 Main 판단

현재 일반 읽기·실행 경로의 발견 결함은 수정 및 독립 재확인을 마쳤다. 남은 역사 참조 62건과 미커밋 원판 2개의 부재, 002의 현재 제품 타입 오류는 서로 다른 한계로 분리해 명시했다. 전체 Harness 및 제품 검사가 green이라고 주장하지 않는다. 제품/native/DB·다른 host 동작 전반은 이번 문서 통합의 필수 검증으로 새로 추가하지 않았다.

사용자는 현재 결과와 후속 방향을 먼저 기록·커밋하도록 요청했다. 다음 단계는 `.claude` 문서의 고유 의미 통합과 archive 이동이며, 프로젝트 로컬 `CLAUDE.md` 계층 정리는 그 뒤에 다룬다. 전역 `CLAUDE.md` 개편은 다른 프로젝트에도 영향을 주므로 별도 작업으로 구분한다. 이번 커밋은 중간 결과의 보존이며 006 전체 수락이나 검사 실패의 위험 수용을 뜻하지 않는다.
