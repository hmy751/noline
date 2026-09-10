# 요구 동작과 대표 사례

새 주체가 명시 id로 Recover하면 Noline의 제품 의미와 현재 구현·검증 경계, 이식 작업 Spec 전체와 Ticket 색인·현재 상태·output 지도를 읽는다. id가 없으면 기존 active Workspace를 사용하며 두 선택의 결과 내용이 대응해야 한다. 상세 source·records 전체와 Ticket 본문은 필요할 때 선택한다.

이식으로 대체된 Project 요약의 유효한 내용은 새 layer가 맡는다. 현재 역할이나 실제 호환 필요가 없는 기존 파일은 현재 경로에서 제거하고 영향받는 선택·링크·검증 입력을 함께 전환한다. 이전 목표·제약 원문은 source에 바이트를 보존하되 Spec과 중복되는 현재 작업 정의로 읽히지 않는다.

기존 Noline dispatcher·agents·Claude adapter와 두 host wrapper는 계속 존재해야 한다. 새 session은 Workspace를 자동으로 선택하지 않고, unbound status 조회는 runtime이나 Workspace write를 만들지 않는다. 실제 activation은 Main의 사용자 선택과 host trust 이후 별도다.

Verify pass는 구조 검사 결과로만 읽는다. 제품 기능 성공이나 후속 리팩토링 효과, 사람 acceptance로 확대하지 않는다.
