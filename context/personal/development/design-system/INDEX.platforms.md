# 플랫폼이 달라도 판단은 유지하고 수단은 대입한다

**언제 쓰나:** 웹 구조를 React Native로 옮기거나 그 반대로 옮길 때, 이 묶음의 웹 사례를 다른 플랫폼에 적용할 때.

**핵심 규칙:** 책임의 분리는 플랫폼과 무관하다. 수단은 달라지므로 코드를 그대로 옮기지 않고 같은 의도를 그 플랫폼의 수단으로 다시 만든다. 실제 지원 여부는 해당 Project의 설치 버전에서 확인한다.

시작 본문은 [UI 결정을 맡을 책임에 두고 쌓는다](INDEX.md)다. 아래 React Native 내용은 0.74 설치본의 타입으로 확인한 범위이고, 실제 기기 동작은 별도로 확인해야 한다. 특정 Project에 어떻게 적용할지는 그 Project가 소유한다.

## 유지되는 판단과 달라지는 수단

| 유지되는 판단 | 웹 수단 | React Native 수단 |
| --- | --- | --- |
| 부모가 간격과 흐름을 정한다 | flex, grid, media query | flex와 gap. CSS grid를 쓸 수 없는 버전이면 `FlatList`의 `numColumns`나 `flexWrap`으로 같은 의도를 만든다. |
| 측정 기반이 좌표를 맡는다 | Portal, `getBoundingClientRect` | `Modal`, `measureInWindow`. 측정 좌표계와 표면을 맞추고 안전 영역을 고려한다. |
| 입력과 폼 연결을 나눈다 | `register`, DOM 이벤트 | `Controller`, `onChangeText` |
| Field가 제목·입력행·설명·오류의 자리를 맡는다 | label, `aria-labelledby` | View와 Text. 이름은 플랫폼의 접근성 prop으로 정한다. |
| 대화 표면의 닫기와 포커스 | ESC, 포커스 관리 | `onRequestClose`, 뒤로가기, 키보드. Modal을 쓴다고 포커스·역할이 해결되지는 않는다. |
| 글자의 뜻과 생략 | HTML 태그, line clamp | `Text`, `numberOfLines`, 접근성 역할 |
| 값의 원천을 하나로 둔다 | CSS 변수 | theme과, native prop으로 넘길 값의 공통 원천 |
| 추가 조회 감지와 표시를 나눈다 | `IntersectionObserver` | `FlatList` 스크롤 이벤트 |
| 눌림과 입력 장치를 다룬다 | hover, focus-visible | 눌림 상태, 터치 영역 |

## 그대로 옮기면 안 되는 것을 확인한다

- **위치:** `fixed`가 없다. `static`은 버전과 아키텍처에 따라 다르다.
- **gap:** 숫자 gap은 있고 백분율 gap은 0.75부터다.
- **글자색:** `Text`는 바깥 `View`에서 색을 물려받지 않는다. 글자 스타일은 `Text`에 준다.
- **라벨 관계:** `htmlFor`와 `aria-labelledby`의 관계를 그대로 옮기면 양쪽 플랫폼을 보장하지 못한다. 플랫폼별 지원을 확인한다.
- **유틸리티 class:** class가 네이티브 prop으로 변환되는 범위는 도구에 달렸다. hover, backdrop, CSS 변수처럼 웹 관례가 남은 class는 동작하는지 확인한다.
- **조회 감지와 스크롤:** 웹 전역 스크롤과 `window` 좌표는 쓸 수 없다.

## 옮겼던 구조에서 달라진 것

| 구조 | 웹 | 모바일 앱 | 달라진 이유로 확인한 것 |
| --- | --- | --- | --- |
| Field | Root, Title, ElementsBox, Label, Description, Message | Title, ElementsBox, Description, Message. Label과 고정 입력행 높이 제거 | 합성 구조는 이어졌고, 웹의 label 관계는 그대로 쓰지 않는다 |
| Button | Button의 variant·size·fullWidth·isLoading | Pressable의 variant·size, icon·auto 크기 추가 | 표현 축은 이어졌고, `isLoading`과 `fullWidth`는 끊겼다 |
| Dialog | 합성 Dialog | Drawer, Modal, 플랫폼 Alert | 대응 표면이 플랫폼에 맞게 나뉘었다 |
| Select | native select | Modal 바닥 시트 합성 | 플랫폼의 선택 표면이 달라졌다 |
| 위치 계산 | 측정 Hook | Modal과 호출부에 분산 | 측정 기반을 정리하지 않은 상태다 |

이 표는 구조를 비교한 결과이며, 옮길 때 그렇게 해야 한다는 뜻은 아니다. 복사 경로는 확인하지 못했다.
