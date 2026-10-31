# Ticket 12 — 남은 역사 자료와 재접근 판정

2026-10-31. 이전에 통합한 audits·decisions·sessions 28개를 다시 처리하지 않고, CHANGELOG와 63개 역사 링크의 현재 소비·보존 범위를 확인했다.

## CHANGELOG

614줄 전체의 용어·계정·Policy·지도·경로·Entity·타입·인증·Store/Service·삭제·하네스 전환을 현재 Owner와 대조했다. 필요한 의미·대안·비용은 Project decisions·guidance·형성 자료에 이미 있어 새 본문은 추가하지 않았다. 당시 버전·통계·성능·완료·고정 폴더 예시는 현재 보장으로 재도입하지 않았다.

[보존 manifest](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-12/manifest.json)에 원래 경로·기준 commit·SHA-256을 남기고 원문을 같은 바이트로 보존했다. 현재 `.claude/CHANGELOG.md`와 Document Map의 일반 읽기 행은 제거했다. 새 CHANGELOG나 일반 읽기용 호환 stub은 만들지 않았다.

## 63개 링크를 모두 현재 결함으로 다루지 않았다

[재접근 지도](ticket-12-historical-access.md)와 [연결별 근거](ticket-12-historical-links.json)에 baseline 63회·고유 target 29개를 분리했다. records 25회·source 2회는 원문 해시를 보존했다. current/output은 당시 live consumer 여부를 실제 metadata로 판단했다. 기본 001과 current-generation 002·006이 live이며, 003·004·005는 당시 현재 소비 대상이 아니다. 이 관찰은 활성화 권한이나 미래 상태의 보장이 아니다.

002의 현재 output에 삭제된 결정 stub으로 가는 중복 행 1개를 제거했다. 같은 문서의 실제 HISTORY·운영 계약 직접 연결은 유지했다. 나머지 역사 문서를 현재 정책으로 고치거나 검사 예외를 늘리지 않아 strict 실패는 63에서 62로 줄었다. 남은 62건은 보존된 역사 문서·이전 Workspace에서의 재접근 문제이며 현재 일반 읽기/실행 consumer의 누락으로 판정되지 않았다.

target 29개 중 27개는 식별한 commit의 exact path Git 객체가 있고, 문서 25개는 별도 보존판 경로·해시도 확인했다. 식별한 commit의 바이트가 기록 당시 미커밋 작업 트리와 항상 같다는 뜻은 아니다. `session-restoration.ts`와 `screens/read-query.ts` 두 초기 시도 원판은 현재 파일·Git에서 확인되지 않는다. 당시 기록에 미커밋임이 명시돼 있으며, 후속 구현은 원판 복구라고 주장하지 않는다. 기존 08 참조표의 ‘옛 코드는 Git으로 복구’ 일반화도 이 한계에 맞췄다.

원문 동결과 현재 재접근을 구별한 정리 범위는 완료했다. 모든 역사 링크가 유효해지거나 두 미커밋 원판이 복구된 것은 아니다. 최종 통합 결과와 사용자 수락은 Ticket 13에서 별도로 판단한다.
