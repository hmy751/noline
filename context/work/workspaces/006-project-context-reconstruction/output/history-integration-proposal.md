# audits·decisions·sessions 내용 통합안

2026-10-31. 적용 전 제안이다. 사용자 요청은 세 폴더를 Ticket 10처럼 실제 내용과 현재 책임에 대조해 정리하는 것이다. “11, 12를 떠나서”라는 정정을 반영해 기존 Ticket 분류를 처리의 전제로 삼지 않았다. 이어 “decision도 project에 있으니까 과거지만 넣어보는것도 좋아보이고”라는 의견을 반영했다. 과거 선택도 현재 이해·재검토에 가치가 있으면 Project Decision으로 통합한다.

원문 28개(audits 6·decisions 19·sessions 3)를 Main과 두 조사 담당이 분담해 전부 읽었다. 현행 Project·guidance·관리 계약·스킬·가이드와 대조했고, 제품 세션의 주요 구현 주장은 Router·지도/경로 downloader 등 실제 코드와 대조했다. 현재 제품 실행이나 역사적 성능 재현은 하지 않았다. 이 제안 파일 외 원문·현재 Owner의 편집·이동·삭제는 수행하지 않았다.

## 추천하는 통합 결과

### Project Decision으로 과거 선택을 이해하게 한다

- **기존 0001 Selective Local-First 보완:** 2025-11-06 활성화 설계에서 모든 여행의 Local·지도 준비 대신 선택적 준비를 택한 이유, 비활성 여행의 temp_cache·merge·TTL 대안을 거부한 이유와 온라인 의존이라는 비용을 보완한다. Router의 요청 시점 저장소 선택과 Sync의 Local 변경 전송 책임도 필요한 만큼 이어 쓴다. 현재 구현 계약은 여행 접근·데이터 수명 guidance가 계속 소유한다.
- **새 Decision 후보 — 제품 지식과 개발 기준을 주제별 Owner에 모은 이유:** 5월의 작은 루트·경로별 guide·역사/현재 구분, 규칙·위험·runbook을 따로 둔 당시 이유와 10월 주제별 통합으로 바뀐 이유를 하나의 선택 흐름으로 구성한다. 중요한 조건과 예외가 분리되고 여러 정책 원천을 함께 갱신하던 비용, 주제 본문을 더 읽는 부담을 받아들인 절충을 남긴다. 공통 문서를 `.claude`에 둔 당시 이유가 기존 링크·로컬 구조 호환성이었다는 사실도 보존한다. 이 결정이 제품 기준·스킬·Work 운영 계약을 새로 소유하지는 않는다.
- **새 Decision 후보 — Project context의 세 층과 의미·사실·읽기 경로 검증을 선택한 이유:** 09-09와 09-14 두 결정을 통합한다. 분류·보관과 다음 개발자가 이해할 본문 구성의 차이, common/current/guidance의 역할, current의 추가 효용·유지비용, 첫 초안의 의미 누락·사실 일반화·consumer 누락에서 검증 관계를 구체화한 경위를 남긴다. 현재 수행 기준은 REFERENCE·MAINTENANCE에 유지한다. 별도 REFERENCE 배경 폴더를 만들기보다 기존 decisions를 활용한다.

새 파일 수·번호는 위 주제의 본문을 구성하면서 확정한다. 원문 개수대로 Decision을 만들거나, 오래됐다는 이유로 모두 archive로만 보내지 않는다. 이전 판단과 후속 대체의 날짜·상태·관계를 보존하고 과거 규칙을 현재 의무로 되살리지 않는다.

### 기존 Owner에 충분한 내용은 더하지 않는다

지도 native pack/metadata 분리, 경로 사전 계산과 증분 복잡도는 현재 지도·경로 본문과 형성 자료에 이미 충실하다. Work의 문서 작성·Spec/Ticket·Maintain 기준, start-app의 실행 조건, development의 적용·검증·기록 책임도 기존 Owner가 설명한다.

커밋 규칙은 기존 harness 본문에 현재 기준이 있다. 원문의 cross-workspace 변경에서 의미 있는 domain scope를 사용할 수 있다는 예외와 분류·추적을 쉽게 하려는 이유만 보완할 수 있다. 커밋 이력을 바꾸거나 새 commit 스킬을 만들 필요는 없다.

개인 증거 수집기의 설치 경과·모델·검사 수치는 공유 제품 결정으로 올리지 않는다. 현재 운영은 Work 진입과 로컬 설치 안내가 충분히 설명하며, 당시 기록은 재검토 근거로 보존한다.

## 원문별 대응

아래 파일명은 각 원래 폴더 아래의 파일이다. ‘보존’은 역사 원문을 현재 지침과 구별해 재접근 가능하게 두는 것이며, 원래 폴더를 계속 현재 읽기 경로로 유지한다는 뜻이 아니다.

| 원본 | 현재 내용에 대한 처리 | 남길 역사 역할 |
| --- | --- | --- |
| audits/README.md | audit 역할 구분은 현재 안내와 중복. 옛 inventory 선행 읽기는 해제 | 묶음의 당시 안내 |
| audits/2026-05-06-doc-corpus-inventory.md | 새 기준 추가 없음. 당시 분리 이유만 필요하면 Owner 통합 Decision 근거 | 당시 corpus·전환 조사 |
| audits/2026-05-06-harness-restructure-handoff.md | 현행 harness·development로 충분 | branch·선택·검증 이력 |
| audits/2026-05-06-harness-layer-followup-handoff.md | 현재 Owner 안내로 전환 | 과거 재진입·레이어 전환 |
| audits/2026-05-06-harness-execution-plan.md | 루트의 ‘최근 실행 기록’ 진입에서 제외 | PR #28·merge·당시 검증 증거 |
| audits/doc-refactor-test.md | 대표 질문 검증은 기존 기준 사용. 고정 질문·등급 추가 없음 | 당시 비교 실험; 평가를 현재 보장으로 사용하지 않음 |
| sessions/2025-11-06-activation-architecture-design.md | 기존 Project Decision 0001에 대안·비용 보완 | 당시 설계·예상·사용자 판단 |
| sessions/2025-11-07-offline-map-implementation.md | 지도 본문·형성 자료에 이미 충분 | 당시 native pack 문제·실행 근거 |
| sessions/2025-11-08-offline-routing-implementation.md | 경로 본문·형성 자료에 이미 충분 | 구현 과정·당시 검증. 성능·완료 과장 제외 |
| decisions/2026-05-06-ai-harness-restructure.md | 작은 루트·현재/역사 분리 이유를 Owner 통합 Decision에 선별 | 최초 구조와 후속 대체 관계 |
| decisions/2026-05-06-harness-layer-model.md | 분리했던 책임과 `.claude` 위치의 당시 호환 이유를 같은 Decision에 통합 | 옛 물리 구조·제약 |
| decisions/2026-05-06-harness-execution-cleanup.md | 현행 검사·기록 책임은 기존 본문 사용 | branch·root tracker·archive 전환 |
| decisions/2026-05-06-harness-execution-layer.md | 고정 dispatcher/agent 정의가 필요했던 당시 맥락과 이후 제거를 구별 | 설치·폐기 이력. 스킬을 dispatcher로 제한하는 전제 제외 |
| decisions/2026-05-06-workspace-guide-harness-contract.md | 경로별 guide 역할은 현행 harness에 충분; 분리 이유는 통합 Decision에 필요분만 | 당시 line-count·noline-work 배치 |
| decisions/2026-05-06-commit-message-convention.md | 기존 커밋 기준에 domain scope 예외·선택 이유 최소 보완 | 당시 규칙 채택 근거 |
| decisions/2026-09-04-context-harness-application.md | Project/Work·bounded Recover 의미는 현행 context/Work에 충분 | 최초 설치와 확인 상한 |
| decisions/2026-09-09-context-harness-upgrade.md | Project 세 층 선택 부분을 새 Project 구성 Decision에 통합 | 그 밖의 host·Workspace 전환 |
| decisions/2026-09-10-deprecate-noline-work.md | 현재 실행 기준 추가 없음. 이후 실제 삭제와 대체 관계 보존 | 사용 중단 당시 범위 |
| decisions/2026-09-10-evidence-collector-installation.md | 공유 Work 진입과 개인 설치 운영 안내로 충분 | 설치·수정·검증 이력 |
| decisions/2026-09-11-workspace-writing-contract.md | DOCUMENT-WRITING과 기존001기록에 충분 | 당시 설정 선택·검증 |
| decisions/2026-09-12-spec-ticket-execution-criteria.md | 이미 spec-and-tickets/HISTORY로 옮긴 위치 안내. 직접 연결로 전환 | 중복 stub은 제거 가능 |
| decisions/2026-09-14-project-context-authoring-and-reading.md | 새 Project 구성 Decision에 대안·비용·보류 통합 | 정확한 당시 발화·형성 자료 |
| decisions/2026-09-14-project-context-semantic-and-routing-verification.md | 같은 Decision에 첫 실패와 검증 관계·재검토 조건 통합 | 제한된 재시험의 원자료 |
| decisions/2026-10-01-start-app-skill.md | 현재 start-app 본문에 충분 | 도입·사용자 정정·당시 시험 |
| decisions/2026-10-30-context-and-explanation-refresh.md | context의 기존 부분 반영 기록·USAGE·해당 스킬로 연결 | 당시 부분 적용·호환 유지 |
| decisions/2026-10-30-development-skill-transition.md | development 기존 형성 기록·현행 색인으로 연결 | 후속 전환·확인 이력 |
| decisions/2026-10-31-project-product-context-ownership.md | Owner 통합 Decision에 전환 이유와 범위의 변천 통합 | 006 이관 단계와 근거 |
| decisions/2026-10-31-product-rules-owner-integration.md | 같은 Decision에 중복 정책 비용·주제 읽기 부담·재검토 조건 통합 | Ticket09 실행·원본 대응 |

## 실제 적용 때 함께 바꿀 연결

1. 필요한 Project Decision과 기존 본문의 부족분을 먼저 구성한다. 원문에 없는 대안·이유는 만들지 않는다. 과거 구현 예상·테스트 결과를 현재 지원 약속으로 가져오지 않는다.
2. Project decisions 색인과 REFERENCE의 형성 이유 링크를 실제 새 Owner로 맞춘다. 하네스 결정의 범위를 자동 유지한다고 적힌 기존 안내도 이번에 채택하는 범위에 맞춰 고친다.
3. 루트·Document Map·harness에서 세 폴더를 현재 판단의 필수 경로로 삼는 연결과, 새 기록을 옛 폴더에 계속 쓰도록 하는 지시를 정리한다. 프로젝트 선택은 Project Decision, 실행 방식의 형성 이유는 해당 스킬·관리 Owner, 이번 작업 진행·검증은 Work 기록으로 연결한다.
4. 원문 28개는 경로·시점·hash와 대응 본문을 추적할 수 있게 보존한다. 통합된 현재 설명과 원문 보존판을 구별한다. 중복 위치 안내는 기존 정본과 Git 복구 경로가 확인되면 제거한다. 이 작업을 마친 뒤 세 기존 디렉터리를 현재 위치에서 제거하는 방향을 추천한다.
5. 검사 코드의 audits/decisions 현재 입력, 001 Verify의 canonical_basis·evidence와 그 밖의 실제 live consumer를 함께 대조한다. 001의 canonical_basis에 09-09 결정이 있으므로 링크만 치환하고 동일 claim이 유지된다고 가정하지 않는다. 역사 Workspace 본문을 일괄 최신화하지 않으며 역사 재접근 문제는 별도로 드러낸다.

이번 제안은 내용·권위·읽기 관계를 정한 것이다. 실제 이동·보존 경로, 최종 Decision 본문과 소비자 변경은 적용 때 확인한다. 기존 Harness의 역사 링크 실패 55건 해결이나 실제 host 동작 검증을 이번 조사로 완료했다고 주장하지 않는다.
