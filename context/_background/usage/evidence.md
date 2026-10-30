# 공통 읽기 구성의 직접 근거

[USAGE](../../USAGE.md)의 형성 판단에 사용한 최소 근거다. 사용자 발화는 2026-10-25~26 설계 대화에서 선택한 원문이며 전체 대화 전사가 아니다. 실제 수행 결과와 배치 제안을 구별한다.

## 개발 중 사용과 직접 요청

사용자는 read를 Work에 한 번 정리하는 용도로만 설명한 데 대해 다음과 같이 방향을 밝혔다.

> 주로 개발 워크플로 안에서 자연스럽게 읽고 갱신되는 게 중요한 포인트같아

> 그럼 별도 요청도 가능하게 하는건 어떨까? 다른 층위? 뭐 어쨋든 억지로 스킬을 나누진 말고, 다시 전체가 어떻게 연결될지 생각해봐

이 발화는 개발 중 사용을 중심에 두고 직접 요청도 같은 방법에 연결할 근거다. 읽기마다 Work 기록이나 반영 스킬을 실행하라는 요구는 아니다.

## 파일 형태에 남은 유보와 실제 적용 요청

디렉터리 배치 설명 뒤의 사용자 발화:

> 음 크게 나쁜것 같진 않은데 뭔가 USAGE랑 conex-update가 나뉘니까 음 느낌이 딱 백프로 괜찮다? 정도의 느낌은 아닌것 같아 뭐 일단 그렇네

> 그래 그럼 이정도 틀로 일단 잠정 합의를 보자 여태 논의들 잘 기록 남겨놔줘

네 항목 구체화·리뷰와 전체 적용 계획 설명 뒤에는 다음과 같이 요청했다.

> 먼저 커밋할거 부터 하고 그럼 프로토 타입 적용해봐

마지막 요청은 현재 잠정 틀을 prototype 본문에 적용할 권한이며, 모든 파일 이름의 영구 확정·실제 운영 설치·사용감 문제의 해소를 뜻하지 않는다.

## 기존 기능과 외부 고정판

기존 read-project-context의 보존 원형은 이미 질문별 선택, 같은 세션의 유효한 읽기 재사용, 실제 Owner 대조, 원래 과업 복귀, 기본 읽기 전용을 소유했다. 현재 공통 방법은 그 역할을 새로 발명했다고 주장하지 않고 Personal·Project·Work의 독립 내용과 연결한다. 기존 원형의 자동 runtime 실행은 가져오지 않았다.

외부 확인판은 Matt skills 1.3.1, commit `5beb35b040e3de97e54fa9e386d7e42d15c295c2`와 pstack 0.15.29, commit `190d28736eff128ec94f502a22c7fe0c4b56cd37`다. 설계 작업이 보존한 해당 판본 원문을 읽었으며 최신판이나 운영 효과를 재조사한 것은 아니다.

- [Matt Domain Docs](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/setup-matt-pocock-skills/domain.md): 주제에 관련된 glossary·ADR을 읽어 용어와 결정의 의미에 적용한다. 기존 문서 사용을 능동적 domain-modeling과 구별하는 참고점이다. 우리 모든 역할에 Project 전체 문서를 필독시키는 근거로 사용하지 않는다.
- [Matt Skill mechanics](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/productivity/writing-for-agents/SKILL-MECHANICS.md): 공유 참조를 일반 파일에 둘 수 있고 독립 호출에는 비용이 있다는 구성 근거다. 원문의 도구별 invocation 규칙을 우리의 실제 host 동작으로 단정하지 않는다.
- [Lauren Poteto mode](https://github.com/cursor/plugins/blob/190d28736eff128ec94f502a22c7fe0c4b56cd37/pstack/skills/poteto-mode/SKILL.md): 상위 흐름과 맡은 수행, 적용할 원칙의 직접 읽기를 참고했다. mode 전체 상속·기본 다중 agent·고정 모델을 이 방법에 옮기지 않았다.
