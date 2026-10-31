# Ticket 13 — 006 전체 대조와 종료 판단

2026-10-31 최종 대조. Ticket 01–12와 후속 14의 문서 재구성·읽기 경로·도구 연결을 확인했고, 006 범위에서 추가로 처리해야 할 필수 누락은 발견하지 못했다. 두 README 제거, archive 루트 이동, 로컬 CLAUDE 정리까지 실제 반영·검토·검증을 마쳤다. 사용자의 “다된건지 확인하고 됐으면 기록 보완하고 마무리 하자” 요청에 따라 아래 근거와 한계를 보존하고 문서 작업을 마무리한다. 검사 전체 통과나 제품 오류 해소, 확인하지 않은 동작에 대한 포괄 수락을 뜻하지 않는다.

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

## 첫 통합 검증에서 확인한 소비자와 재진입

[소비자 관찰](ticket-13-live-consumers.json)에서 default 001과 current-generation 002·006을 확인했다. 이들의 현재 Recover·Verify 선언 입력은 regular 파일이며 symlink 부모를 경유하지 않는다. 002 Verify의 삭제된 옛 폼 6개는 실제 코드·삭제/분리 commit을 대조해 현재 책임 파일 9개로 보완했다. [선언 변경 근거](ticket-13-verify-input-reconciliation.json)에 범위와 대응을 남겼고 claim·argv는 바꾸지 않았다. 제품 코드는 수정하지 않았다.

001은 옛 검증 receipt가 `.claude/skills` 원본 경로를 기록하고 있어 원본이 symlink로 전환된 뒤 Recover가 거부하는 현재 문제를 찾았다. 옛 receipt를 고치거나 안전 검사를 완화하지 않고 현행 선언으로 Verify를 실행해 새 receipt를 만들었다. 002도 고정 타입 검사를 실제 실행해 새 receipt를 남겼다. 이후 001·002·006의 Recover는 모두 exit 0이다.

[실행 결과와 receipt 경로](ticket-13-verification-results.json)에서 001 구조 검사는 역사 링크 62건으로 실패했고, 002 client noEmit 타입 검사는 좌표 타입·Mapbox 객체 타입·UI 패키지 rootDir 등으로 실패했다. 이 실패를 현재 제품 수정으로 해결한 것처럼 보고하지 않는다. 001/002 receipt freshness의 fresh는 기록한 입력이 현재와 일치한다는 뜻이며, 검사 pass나 전체 작업 수락을 뜻하지 않는다. 006의 초기 Verify는 `recover.json` 파싱에 한정되므로 전체 006 완료 증거로 대체 사용하지 않았다.

## 남은 .claude 항목의 최종 배치

최초 전체 대조에서는 아래 역할을 근거로 기존 위치의 유지를 제안했다. 이후 실제 root·Context·Document Map·harness 본문을 대조하니 탐색과 관리 기준이 반복됐다. 역할이 필요하다는 사실은 기존 파일·위치 유지의 충분한 이유가 아니므로 문서 지도·harness·archive의 배치 판단을 변경했다. 이후 두 README 제거·archive 이동·로컬 지침 정리를 순서대로 수행했고 각 결과를 커밋했다.

| 항목 | 실제 처리와 Owner |
| --- | --- |
| README | 중복 탐색 설명은 제거하고 필요한 소수 기준만 기존 루트에 보완했다. 파일 제거·소비자 전환은 `db1a4bb`에 보존했다. |
| harness/README | 중복 본문을 제거했다. bridge·경로별 guide·커밋 기준은 root, Maintain 상세는 기존 Work 계약, 제품 기준은 Project, 수행은 공통 스킬이 소유한다. 새 관리 계층을 만들지 않았다. |
| settings.json·hooks/maintain.py | Claude의 host lifecycle·인자 적응과 선택적 개인 dispatcher 진입. 대응 Codex 설정·wrapper와 공통 구현의 역할 차이가 있어 무조건 합치지 않았다. |
| skills symlink | Claude가 공통 정본을 발견하는 필수 host 연결. 실제 내용은 `.agents/skills` 하나에 있다. |
| _archive | 124개 파일을 바이트·기존 provenance 그대로 루트 `_archive/`로 이동하고 현재 참조·검사 경로를 맞췄다(`19b5c7a`). Context·스킬의 유효한 형성 자료와 Work 기록은 각 Owner에 유지한다. |
| ignored 개인설정 | 개인 권한·설치 선택의 영역으로 이번 공유 문서 정리 범위 밖이다. 비밀값은 읽거나 복제하지 않았다. |

## 최종 통합 검증과 근거 재사용

[독립 검증 보고](ticket-13-final-independent-verification.md)는 최초 후보·Spec·현재 본문을 대조해 담당 누락과 현재 읽기 의존을 확인했다. root·Project·guide 등 73개 문서에서 로컬 링크 누락과 옛 제품 Owner/archive 읽기 연결이 없고, archive 124개 파일의 크기·SHA 및 Ticket 14 최신 8파일 SHA가 보존 근거와 일치했다. 앞선 의미·대표 사례 검증을 재사용할 수 있는 범위도 판단했다.

[로컬 가이드 결과](ticket-14-local-guides-result.md)의 구현 책임·계약 문서 구분과 위험 요약·Project 정본 관계를 포함해 최신 문안은 독립 재확인을 마쳤다(`05b5787`). Ticket 11의 양 host 대표 명시호출에서 사용한 explain 본문과 연결 구조는 유지됐고 이후 스킬 문서 두 개의 변경은 archive 보존 URL뿐이었다. 그 근거는 대표 호출에 한정해 재사용하며 전체 스킬 효과나 Maintain 자동수행 전반으로 확대하지 않는다.

Main은 최종 001 Verify를 실제 실행해 fail·exit 1·역사 링크 64건의 새 receipt를 만들었다. 별도 검증자의 직접 checker 실행도 동일한 64건이었다. 이어 001·002·006 Recover는 모두 성공했다. [최신 실행 요약](ticket-13-final-verification.json)과 [검사 원문](ticket-13-final-check.txt)에서 근거를 찾는다. 002 제품 타입 검사는 기존 실제 실패 receipt를 재사용했으며 이번에 다시 실행하지 않았다. 006 초기 JSON 파싱 검사는 내용 완료 근거로 사용하지 않는다.

두 README·archive 개별 결과는 각 실행 당시의 확인 범위를 보존한다. 그 뒤 완료한 실행은 각각 [README 결과](ticket-13-readme-integration.md), [archive 결과](ticket-13-archive-result.md), [로컬 가이드 결과](ticket-14-local-guides-result.md)에서 이어 찾을 수 있다. 최종 결과에 남아 있던 미실행 표현은 이번에 현재 상태로 고쳤다.

## 종료 판단과 남는 한계

주제별 의미·선택 이유는 현재 Project에, 수행은 스킬에, 경로별 안내는 guide에 남겼고 옛 문서를 현재 읽기의 필수 경로로 되살리지 않았다. 따라서 Main은 006의 문서 재구성과 정리 실행을 완료로 판단한다. 사용자 최신 요청은 확인 후 기록·마무리의 조건부 지시이며, 확인하지 않은 제품·host 동작이나 실패에 대한 별도 포괄 수락 발화로 기록하지 않는다.

| 남는 항목 | 현재 영향과 후속 조건 |
| --- | --- |
| 역사 링크 64건 | 과거 Workspace·원문 클릭 재접근의 실패다. 현재 제품 읽기에 필요한 연결은 아니며 역사 접근 지도·Git·archive 경로표로 근거를 찾는다. 해당 과거 작업을 재개할 때 현재 읽기 선택을 다시 맞춘다. 전체 harness pass는 아니다. |
| 002 제품 타입 오류 | 좌표·Mapbox·UI rootDir 등의 실제 noEmit 실패다. 제품 수정 작업에서 해결해야 하며 006 문서 정리로 고쳐졌다고 보고하지 않는다. |
| 미커밋 초기 원판 2개 부재 | 초기 session-restoration.ts·screens/read-query.ts의 정확한 바이트 복원이 불가능하다. 핵심 발췌와 부재를 기록했고 후속 코드를 원판 복원으로 부르지 않는다. 현재 제품 계약의 Owner 공백은 아니다. |
| archive 내부 상대 링크 | 원바이트를 보존한 결과 폴더 깊이 변경으로 일부 클릭이 끊긴다. 이동 manifest의 old_path 기준으로 해석하며 현재 정책 안내로 사용하지 않는다. |

전역 CLAUDE 개편과 Work·Maintain 및 work-discussion의 유보 사항은 별도 작업이다. 앱·실기기·외부 서비스 전반을 새로 검증하지 않았다. 이번 종료를 위해 제품 버그 수정이나 역사 원문의 현재화를 추가하지 않으며, 필요한 재검토 사유가 생기면 해당 범위에서 다시 연다.
