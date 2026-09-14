# 12 — 경비 카테고리 표시와 컴포넌트 Owner

## 맡은 결과와 범위

실제로 사용되는 경비 카드와 상세 화면의 카테고리 표시 규칙이 canonical Owner에서 관리되고, 같은 이름의 컴포넌트와 중복 palette 중 무엇을 수정해야 하는지 consumer를 따라가며 추측하지 않게 한다. 화면별 시각 차이는 의도된 variant로 드러내고 사용되지 않는 경쟁 export는 사용처 확인 뒤 제거하거나 역할을 명시한다.

범위는 `ExpenseDetailScreen`, entity와 shared의 두 `ExpenseCard`, 관련 index export와 실제 consumer 및 render test다. 카테고리 색상을 모든 화면에서 같게 만드는 디자인 변경이나 `packages/ui` 전체 primitive 정리는 포함하지 않는다.

## 실행 맥락과 접근

현재 상세 화면은 카테고리 배경색과 글자색을 별도 함수로 유지한다. entity `ExpenseCard`에도 유사 palette가 있지만 카테고리 coverage가 다르고, 실제 목록은 shared `ExpenseCard`를 사용한다. shared 카드는 neutral badge를 표시해 세 구현을 단순 병합하면 기존 화면 표현이 달라진다.

먼저 import/export와 runtime consumer를 확인하고 실제 canonical component를 정한다. 같은 시각 의미만 공유하고 상세·목록의 의도된 차이는 가까운 variant나 명시적 local 책임으로 둔다. 사용처가 없는 export도 검색 결과만으로 즉시 삭제하지 않고 public import 가능성과 package 경계를 확인한다.

## 완료 조건과 확인 방법

- ExpensesScreen과 일정의 경비 목록에서 실제 사용하는 카드 Owner와 export 경로가 하나의 기준으로 설명된다.
- 상세 화면의 관광·쇼핑·식사·교통·숙박·체험·기타·fallback 표현과 기존 목록의 markup·interaction을 변경 전후 비교한다.
- 동일 카테고리 palette를 함께 수정해야 하는 위치가 줄고, 의도적으로 다른 표현은 이름과 variant에서 이유가 드러난다.
- 같은 이름의 competing component/export는 제거·이관·명시적 유지 중 하나로 판정되고 그 근거가 Ticket 결과에 남는다.
- render fixture 또는 snapshot, `rg` 사용처 확인, 관련 정적 검사와 client typecheck를 실행한다. 실제 기기 시각 확인이 없으면 미확인으로 남긴다.

## 현재 상태와 실제 결과

Ticket 문서만 구성했고 제품 코드·test는 변경하지 않았다. canonical component와 시각 variant 선택은 실행에서 현재 consumer를 다시 확인해 정하며 검증·사용자 수락은 없다.
