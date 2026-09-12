# 갱신과 작업의 연속성

이 문서는 Spec·Ticket·state를 누가 갱신하는지, 새로운 근거가 기존 판단에 어떤 영향을 주는지, 다른 실행자의 결과를 어떻게 지속 문서에 이어 주는지 정의한다. 작업의 분해·실행·완료 판단은 [실행 기준](EXECUTION-CRITERIA.md)이 소유한다.

문서를 작성하거나 갱신하는 주체는 [문서 작성과 갱신](../DOCUMENT-WRITING.md)을 직접 읽고 적용한다. Spec과 Ticket의 상세 내용은 각각 [Spec 작성](SPEC.md), [Ticket 작성](TICKET.md)을 따른다.

## Main과 Maintain의 갱신 책임

**Main**은 필요한 설계·작업 분해·위임·결과 확인·다음 행동을 조율한다. 새 Workspace의 초기 문서 구성도 [생성·전환](../CREATE-AND-TRANSITION.md)에 따라 Main과 생성 skill이 맡는다.

**Maintain**은 Workspace가 준비된 뒤 Spec·Ticket·state와 필요한 records의 갱신을 맡는다. 대화와 결과를 이해해 무엇을 남길지 판단하며, 기록은 단순 전사에 한정되지 않는다. Main은 같은 내용을 중복 수정하지 않는다.

이 역할 배치는 독점 작성 권한이나 새로운 권한 장치가 아니다. Maintain의 허용된 읽기와 반영 범위는 [Maintain 계약](../../harness/maintain/README.md)이 소유한다.

## 새 근거가 나왔을 때

Ticket 안에서는 정한 입력을 잠정적으로 신뢰하며 구현과 세부 설계를 발전시킨다. 모든 하위 작업이나 Ticket 완료를 자동 재판단 계기로 삼지 않는다.

공통 요구·계약·설계의 전제를 흔드는 근거가 나오면 관련 Spec과 그 판단에 의존한 작업·결과를 다시 본다. 다음 두 상황을 구별한다.

- **수행이 빠진 경우:** 요구한 일을 구현에서 빠뜨렸으므로 필요한 수행을 보완한다.
- **가정이나 설계가 맞지 않는 경우:** 요구대로 구현해도 원하는 결과를 얻기 어려우므로 선택 이유와 접근을 다시 판단한다.

변화는 영향을 받는 문서에 반영한다.

- **Spec:** Work의 기준, 여러 실행이 함께 지킬 요구·계약·설계·가정
- **Ticket:** 이번 실행의 설계·선택 이유·범위·진행·실제 결과
- **state:** 전체 상황과 다음 행동
- **records:** 필요한 중요한 변경 이유와 실제 근거

관련 없이 유효한 결과는 유지한다. 목표나 source 권위에 대한 미해결 선택을 완료 보고로 덮지 않는다. 문서 유지가 제품 검증이나 사용자 acceptance를 대신하지 않는다.

## 다른 실행자의 결과를 이어받을 때

위임할 때는 결과를 Main에게 반환하고 같은 Spec·Ticket을 중복 수정하지 않게 역할을 정한다. 다른 실행자의 결과가 Main에게 도착한 것만으로 Maintain에 전달된 것은 아니다.

Main은 채택한 판단·이유·실제 결과·출처·미확인 범위를 Maintain이 받는 최종 응답에 연결한다. 이 내용을 담은 정확한 로컬 결과 문서로 연결할 수도 있다.

같은 대화에서 알고 있는 내용으로 허용된 논의·실행은 이어갈 수 있다. 다만 문서를 실행자에게 읽히기 전에는 필요한 내용이 실제 파일에 반영됐는지 확인한다. 비동기 접수와 문서 준비를 구별하되, 모든 응답마다 저장을 기다리거나 새 승인·인계 절차를 만들지 않는다.

## 자동 연결과 수동 반영

자동 Maintain은 [session binding 계약](../../harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)의 명시적 Workspace 연결을 따른다. 스킬 설치·호출이나 active 기본값으로 activation을 추론하지 않는다. 연결되지 않은 session의 자동 경로는 no-op이다.

자동 연결이 없는 session에서 허용된 문서 반영을 수행할 때는 Main이 [Maintain의 수동 fallback](../../harness/maintain/README.md#session-binding과-lifecycle)을 적용한다. 자동 no-op, 수동 반영, 비동기 접수와 실제 반영을 구별한다.

## Workspace가 끝나거나 나뉜 뒤

Spec·Ticket은 memory에 유지하며 작업 중 필요하면 고친다. Workspace와 함께 스냅샷처럼 남고, 후속 Workspace나 Project의 변화에 맞춰 계속 최신화할 의무는 없다.

다른 Workspace에서 필요한 의미를 새로 구성해도 서로 자동 전파하거나 공유 정본에 매달리지 않는다. 이 독립성은 작업 중 수정을 막는 불변성 규칙이 아니다. 공통 문서 경로가 바뀔 때 현재 소비 중인 Workspace를 확인하는 범위는 [Workspace collection](../README.md#project-context-변경과-live-consumer)을 따른다.
