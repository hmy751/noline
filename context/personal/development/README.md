# 개발 판단 — 공통 관점과 주제별 기준

여러 Project에서 가져갈 개인의 개발 판단을 제공한다. [공통 관점](INDEX.md)은 책임·계약·코드 명료함을 보는 출발점을 설명하고, 아래 다섯 주제는 이번 쟁점에 적용할 기준과 조건별 사례를 소유한다. 필요한 판단에서 시작해 관련 본문을 고른다.

| 지금 판단할 일 | 시작 본문 | 선택 차이가 더 필요할 때 | 주제 구성·관리 |
| --- | --- | --- | --- |
| 공통 컴포넌트·Hook의 범위, 부품 교체, 같은 업무 흐름의 관련 개선 | [공통 제공과 사용처 선택](shared-boundaries/INDEX.md) | [Field·Container·주문](shared-boundaries/INDEX.cases.md) | [주제 안내](shared-boundaries/README.md) |
| 공통 오류의 형태·의미, 타이머·상태·자원 수명, 지원 범위 안 정확성 | [계약과 수명](contracts-and-lifetime/INDEX.md) | [fetcher·Toast·이벤트 Hook](contracts-and-lifetime/INDEX.cases.md) | [주제 안내](contracts-and-lifetime/README.md) |
| 함수·Hook이 맡은 일, 상태·오류의 표현, 반환·완료 알림 | [이름·책임·완료 범위](naming-and-completion/INDEX.md) | [이름·완료 판단 사례](naming-and-completion/INDEX.cases.md) | [주제 안내](naming-and-completion/README.md) |
| 코드 묶음·배치, 주석이 보완할 내용, 실패 처리 뒤 진단 정보 | [코드 표현과 진단](code-expression/INDEX.md) | 본문의 조건·대조 설명 | [주제 안내](code-expression/README.md) |
| 화면·폼·목록·메뉴를 만들거나 위치·간격·값·상태 표시를 고칠 때, 공통 UI 부품·토큰을 정할 때 | [UI 결정을 맡을 책임에 두고 쌓는다](design-system/INDEX.md) | [메뉴·자리·값·Button·Field 사례](design-system/INDEX.cases.md) | [주제 안내](design-system/README.md) |

일반 기준에서 판단할 조건을 잡고, 선택이 갈리는 이유가 더 필요할 때 관련 사례를 읽는다. 사례에는 확인한 코드의 동작과 비교를 위해 둔 가정을 구별했다. 가정한 사용처나 미정인 제품 조건이 현재 작업에서도 성립하는지 확인하며, 모든 주제와 사례를 기본 입력으로 만들지 않는다.

형성 자료는 본문을 만든 목적·배경·논의·선택과 필요한 원문을 보존한다. 현재 내용이 왜 남았는지 이해하거나 의미·조건을 수정·재검토할 때 사용하며, 현재 적용할 기준과 사례는 위 본문 층이 소유한다.

공통 관점의 책임·기존 도구·일반 기준과 주제 구성은 [공통 형성 자료](_background/README.md)에서 찾는다. 공통화의 목적·조건을 다시 볼 때는 [공통 제공 형성 자료](shared-boundaries/_background/README.md), 오류·시간·지원 범위의 선택 이유는 [계약·수명 형성 자료](contracts-and-lifetime/_background/README.md), 명료함·개명·완료의 판단은 [이름 형성 자료](naming-and-completion/_background/README.md)를 읽는다. 표현·주석·진단의 계승 범위는 [표현 형성 자료](code-expression/_background/README.md)에서 찾는다. 각 입구는 현재 이유·당시 선택·정확한 근거 중 질문에 필요한 범위를 안내한다. 같은 논의의 발췌는 한 위치에 보존하고 관련 주제에서 연결한다.

이 영역의 구성·보존·갱신은 [공통 관리 원칙](../../CONTENT-POLICY.md)을 따른다. 개인 기준과 제품 계약·이번 작업의 책임 관계는 [Personal 안내](../README.md)에서 읽는다.
