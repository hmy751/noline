# 2026-10-30 본문 형식 도입과 첫 형식 전환

이 자료는 prototype에서 형식 기준을 만든 경위와 대조를 보존한다. Reference의 현재 읽기 경로·Project 작성 기준 연결은 [Reference 반영 기록](/Users/hammyeong-yeon/Desktop/ai-workspace/reference-project/context/_background/records/2026-10-30-writing-format-application.md)에서 확인한다. 당시 “이 데모”와 미반영 상태는 도입 당시의 범위를 뜻한다.

## 결정

- context 루트에 [본문을 쓰는 형식](../../../WRITING-FORMAT.md)을 체계 지침으로 두고, 기준 본문에 먼저 적용한다.
- [context 안내](../../../README.md)와 [형성 자료 안내](../../README.md)에서 이 문서를 연결한다.
- 이 데모의 Project 작성 기준에는 형식 재서술이 없어 고치지 않았다. `reference-project/`의 Project 작성 기준에 있는 재서술은 06-01에서 이 문서를 Reference에 적용할 때 연결로 바꾼다.
- 같은 날 글로벌 `ai-system_instruction-clarity.md`에도 같은 방향의 일반 규칙과 예시를 더했다. 이 데모의 문서는 글로벌 없이 적용할 수 있게 규칙을 직접 담는다.

## 검토한 대안

| 대안 | 고르지 않은 이유 |
| --- | --- |
| CONTENT-POLICY에 절 추가 | 맡은 판단이 다르고, 긴 서술형 문서에 덧붙이는 방식이 원인과 같다. |
| CONTENT-POLICY를 폴더로 전환 | 링크·설치본 변경이 크고 가독성 문제를 직접 풀지 않는다. |
| 글로벌만 수정 | 로컬 지침이 더 많이 읽히고 충돌 시 로컬이 우선한다. 설치된 Project에는 글로벌이 없을 수 있다. |
| personal/development 안에만 두기 | 형식은 개발 판단이 아니라 문서 체계 기준이며 Project 본문에도 걸린다. |

## 형식을 옮긴 본문

| 본문 | 판본 | 대조 |
| --- | --- | --- |
| [naming-and-completion/INDEX.md](../../../personal/development/naming-and-completion/INDEX.md) | 01-02 마감 판(`6e6dccb8`)을 옮김 | 초기 대조표는 `a26d2f95` 시안 기준이므로 이 최종판 전체의 확인 근거와 구별한다. 01-02에서 더해진 상수 판단·주석 상세 연결·블록 중괄호는 반영했고, 후속 [마감 판 대조·보정](2026-10-30-format-preservation.md)에서 최종 본문의 판단·강도를 다시 확인했다. |

판단을 바꾸지 않고 형식만 옮겼으므로 naming-and-completion의 형성 자료는 고치지 않았다.

## 확인하지 않은 것

- 새 형식을 읽은 AI가 다른 기준 본문을 새 형식으로 쓰는지
- 새 형식의 본문이 AI 판단을 원본과 같게 유지하는지
