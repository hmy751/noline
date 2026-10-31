# 0002. 제품 지식과 개발 기준은 주제별 Owner에서 함께 이해한다

- 상태: 채택. 2026-05-06의 구조 선택 중 제품 상세·규칙·위험을 별도 폴더가 소유하던 배치는 2026-10-31에 대체했다.
- 통합 기록일: 2026-10-31

## 선택과 현재 책임

제품 목적·의미·현재 구조와 개발 기준은 Project의 대응 주제 본문에서 이해한다. 규칙의 적용 조건, 실패 위험과 변경 시 확인할 관계도 같은 주제에서 설명한다. 루트와 경로별 guide는 책임 경계·필요한 본문·명령으로 안내하고, 스킬은 작업의 판단·수행 방법을 맡는다. 중요한 선택 이유는 Project decisions나 해당 주제의 형성 자료에 남긴다.

이 문서는 그 책임 배치를 선택한 이유와 이전 구조의 변천을 보존한다. 실제 제품 계약은 [Project 주제별 입구](../README.md), 구성·이동 기준은 [REFERENCE](../REFERENCE/README.md)와 [관리 계약](../MAINTENANCE.md), 실행층과 bridge는 [Noline AI Harness](../../../.claude/harness/README.md)가 소유한다. Work의 진행·시행착오·검증 이력과 스킬의 수행 책임을 Project Decision으로 옮기지 않는다.

## 작은 입구와 분리된 상세로 시작했던 이유

2026-05-06에는 큰 루트 가이드에 프로젝트 정체성, 점검표, 아키텍처, 실패 사례, 완료 이력과 명령이 섞여 있었다. 당시 선택은 기존 자료를 먼저 역할별로 구별해 유용한 내용을 지우지 않고, 역사 자료가 현재 정책처럼 읽히는 위험을 줄이는 것이었다. 루트는 작은 탐색 허브와 핵심 불변식, workspace guide는 경로별 책임과 진입을 맡겼다. 긴 기능 설명과 교육·디버깅 사례를 모든 작업의 시작 입력에서 분리했다.

그때는 짧은 engineering rule, 고비용 실패를 찾는 guard, 반복 작업의 runbook, 깊은 제품 context를 서로 다른 역할로 두었다. 이 구분은 루트를 줄이면서도 규칙·점검·설명에 접근할 수 있게 하려는 선택이었다. 원래 layer-model의 “기존 링크를 보존하고 현재 local harness surface를 존중하기 위해”라는 문장은 공통 문서를 `.claude/`에 둔 당시 이유를 명시한다. Claude 전용 동작을 공통 기준으로 만들거나 도구별 폴더에 같은 정책을 복제하려는 선택은 아니었다.

같은 날 실행층 후속 결정은 문서 분류만으로는 작업별 자료 선택과 report-only 점검을 시작하는 실행층이 부족하다고 보고 dispatcher와 agent를 더했다. 이는 정책 본문을 실행자에게 옮긴 결정이 아니었다. 당시의 `noline-work`, 폴더 배치와 고정 호출 구조는 역사적 구현이며, 현재 스킬의 역할을 dispatcher로 제한하는 근거가 아니다.

## 설명과 조건을 여러 정책 원천에서 관리하던 비용을 줄였다

2026-10-31의 첫 전환은 깊은 제품 context와 제품 선택 이유를 Project로 모았다. 옛 제품 본문에 유효한 뜻을 남기고 링크만 새로 만들면 다음 작업이 두 체계를 다시 읽어야 하므로, 필요한 이유·조건·비용을 새 본문과 형성 자료로 통합하고 옛 원본을 일반 읽기에서 제외했다. 이 단계에서는 rules·guards·runbooks를 유지했다.

뒤이은 같은 날 전환은 유지했던 제품 rules·guards까지 대응 주제로 합쳤다. 원문이 밝힌 문제는 “짧은 규칙만 읽으면 현재 구현 차이와 예외를 놓치고, 수정할 때 세 곳의 권위를 함께 맞춰야 했다”는 것이었다. 따라서 라우팅·Policy UI는 여행 접근, 원자성·삭제·생성 ID는 데이터 수명, 타입은 schema, 시점·달력 날짜는 날짜, 인증·소유권은 API 본문이 함께 설명하도록 바꿨다. 별도 compact rule 사본과 Guard Map은 두지 않기로 했다.

이 전환은 제품 약속을 현재 구현에 맞춰 약화한 결정이 아니다. 예를 들어 미전송 변경을 보존한다는 계약과 현재 cleanup이 확인하는 상태의 차이는 해당 주제에서 드러내야 한다. 짧은 규칙과 긴 설명을 모두 보존하되 독립 정책으로 따로 고치던 부담을 없애는 것이 선택의 요지다.

## 받아들인 비용과 다시 판단할 신호

작업자는 짧은 규칙만 읽는 대신 주제 본문의 조건·이유·현재 차이를 더 읽어야 한다. 본문을 충분히 구성하고 루트·guide·스킬의 실제 소비 경로도 함께 관리해야 한다. 파일이 한곳에 모였다는 사실만으로 읽기와 적용이 보장되지는 않는다.

새 독자가 필요한 적용 조건을 찾지 못하면 우선 주제 본문의 진입과 구성을 개선한다. 제품 상세가 다시 과거 폴더에 남아 둘을 조립해야 하거나, 같은 기준을 여러 곳에서 독립적으로 갱신하게 되거나, 주제 본문이 무관한 읽기를 늘리면 실제 읽는 작업과 책임 경계를 다시 대조한다. 과거 폴더나 compact 정책 사본을 자동으로 복원하지 않는다. 새 제품 영역·Owner 이동의 권한과 완료 판단은 현행 관리 계약을 따른다.

## 당시 원문과 확인 범위

위 본문은 원문에 있는 선택·전환을 통합했다. 과거 구조 검사의 통과나 당시 도구 조사 결과를 현재 host의 동작 보장으로 가져오지 않는다. 5월의 보존 우선 선택과 10월의 승인된 통합·원본 제외는 서로 다른 시점의 판단이며, 전자를 지우거나 현재 의무로 되살리지 않는다. 다음 보존판은 세부 근거를 확인할 때 읽으며 일반 개발의 필수 입력이 아니다.

- 2026-05-06: [작은 루트와 현재·역사 구분](../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-05-06-ai-harness-restructure.md.txt), [레이어와 `.claude` 위치의 이유](../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-05-06-harness-layer-model.md.txt), [경로별 guide의 범위](../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-05-06-workspace-guide-harness-contract.md.txt), [실행층 후속 선택](../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-05-06-harness-execution-layer.md.txt)
- 2026-10-31: [제품 context Owner 전환](../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-10-31-project-product-context-ownership.md.txt), [제품 규칙·위험의 주제 통합](../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-10-31-product-rules-owner-integration.md.txt)
