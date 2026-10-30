# 생성·전환 책임을 수동 prototype에 연결

2026-10-26. [create-context-workspace](../../SKILL.md)와 [Work 생성·전환 계약](../../../../../context/work/workspaces/CREATE-AND-TRANSITION.md)의 최초 prototype 적용 기록이다. 기존 Work 구조와 원본을 보존하면서 요청된 생성·선택적 계승·인수 확인을 실행 본문으로 옮겼다.

이전 생성 원형은 설치된 Harness를 전제로 했다. 현재 prototype은 Main의 수동 기록과 사람용 진입을 사용하므로, 없는 runtime을 추가하기보다 Work 계약에서 현재 의미·전환 경계를 정의하고 스킬이 그 계약을 수행하도록 나눴다. 컬렉션의 기본 선택은 기존001을 유지하되 한곳에서 정의하고 다른 진입이 이를 찾게 했다.

완료·연속의 후속 논의와 독립 개선 리뷰에서 늦은 결과의 귀속과 계속 수정할 최신 권한을 구별했다. 새 Work 생성이 원래 Work의 미완료를 해소하지 않으며, 생성만 요청한 경우 기본 선택을 바꾸지 않는 조건도 실행에 옮겼다. 사용자 요청과 비교 근거는 [evidence](../evidence.md)에 선별했다.

이번 작성은 계약·스킬·Work 안내의 적용이다. 실제 새 Workspace 생성·제품 수정·운영 설치·host activation은 수행하지 않았다. 가까운 형성 자료는 스킬에만 추가했고 Work의 current·Spec·Ticket·source·output·records와 새 형성 자료 적용 보류는 유지했다. 실제 사용 확인에서 얻은 결과는 그 수행의 대상·조건·범위와 함께 별도로 남긴다.
