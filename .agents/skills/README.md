# Noline 로컬 운영 skills

이 디렉터리는 Noline의 로컬 운영 스킬 원본을 소유한다. 각 `SKILL.md`가 해당 스킬의 호출 조건·실행 방법을, `agents/openai.yaml`이 Codex 호출 설정을 소유한다. Project·Workspace의 지속 의미와 문서 관리 계약은 해당 context Owner에 남는다.

스킬을 작성하거나 의미·구성을 바꿀 때는 [스킬 관리 정책](SKILLS-CONTENT-POLICY.md)을 읽는다.

## 설치된 역할과 진입점

- [record-work](record-work/SKILL.md): 대화에서 필요할 때 같은 담당자를 불러 지정 Work에 기록하고 재개 안내를 맞춘다.

- [development](development/SKILL.md): 개발 요청의 맥락·구현·개선 검토·검증·결과를 연결한다. Noline 제품·경로별 기준을 함께 적용한다.
- [improvement-loop](improvement-loop/SKILL.md): 사용자가 대화를 돌아보고 개선을 찾자고 요청했을 때 선택한 개선·한정 시도와 경험을 잇는다. 자동 마무리 루프가 아니다.

- [start-app](start-app/SKILL.md): 직접 앱 실행을 요청받았거나 작업 완료에 실제 앱 실행이 필수일 때 DB·서버·클라이언트를 켜고 연결을 확인한다.
- [create-context-workspace](create-context-workspace/SKILL.md): 새 독립 Workspace의 초기 구성과 재진입 검토. [생성·전환 계약](../../context/work/workspaces/CREATE-AND-TRANSITION.md)을 적용한다.
- [work-discussion](work-discussion/SKILL.md): 사용자가 직접 호출했을 때 Work의 결과·선택을 구체화하고 Spec에 연결한다. 일반 작업 대화에서 자동으로 인터뷰를 시작하지 않는다.
- [reconsider-work](reconsider-work/SKILL.md): 실제 결과·새 조건·변경 부담·막힘에 따라 현재 판단과 후속 행동을 다시 본다.

- [context-update](context-update/SKILL.md): 허용된 Personal·Project 본문·형성 자료·읽기 경로를 한정 반영한다.
- [explain](explain/SKILL.md): 개념·코드·결과·앞선 말의 뜻과 선택 이유를 실제 근거로 설명한다.

위 목록은 역할을 찾는 색인이다. 상세 호출 조건과 설명·검토의 권한 경계는 각 스킬을 따른다. 고정 호출 순서나 모든 작업에서 실행하는 공통 workflow는 두지 않는다.

## 교체한 실행 경로

읽기는 [USAGE](../../context/USAGE.md), 한정 갱신은 context-update, 작업물·앞선 말의 설명은 explain을 사용한다. 옛 read-project-context·update-project-context·work-artifact-briefing·explanation-recovery 실행 폴더와 bridge는 제거했다. [Noline 적응 기록](development/_background/records/2026-10-30-existing-work-contract-adaptation.md)에서 현재 검사·참조의 이동과 [당시 본문 보존](../../_archive/skill-transition-2026-10-30/README.md)을 찾는다.

## Context와 문서 갱신

작업의 기록과 재개는 [Work 지침](../../context/work/AGENTS.md)과 [갱신 기준](../../context/work/workspaces/spec-and-tickets/MAINTENANCE.md)을 적용한다. 새 Workspace 초기 구성은 생성 스킬이 맡는다.

`work-discussion`과 `explain`은 각 호출 조건에 따라 [설명과 근거 기준](shared/explanation-and-evidence-criteria.md)을 함께 읽는다. 이 기준의 범위·수명·consumer 관계는 [guidance 색인](../../context/project/guidance/README.md)이 연결한다. `reconsider-work`나 모든 재개에 새 필수 입력으로 추가하지 않는다.

Project 본문의 구성과 읽기 기준은 [Project reference](../../context/project/REFERENCE/README.md)가 연결한다. 공통 읽기는 [USAGE](../../context/USAGE.md)로 수행하고 context-update는 각 영역의 관리 계약에 따라 반영한다. 공통 읽기는 Work 재개 안내을 대체하지 않는다.

## 도구 연결과 이식

Noline의 `.agents/skills/`가 공통 스킬 원본이며 Codex는 이 경로를 직접 발견한다. `.claude/skills`는 `../.agents/skills`를 가리키는 상대 symlink로 Claude가 같은 원본을 읽게 한다. 별도 `.codex/skills/` 사본은 만들지 않는다. 호출 설정과 상대 연결의 존재는 실제 host의 발견·호출·기록 반영을 증명하지 않는다.

다른 Project에 이식할 때는 이 목록과 실제 디렉터리·호출 설정·연결·공통 기준을 함께 확인한다. 기존 동명 또는 같은 책임의 스킬과 비교해 설치·적응·제외를 정하고, 기존 guidance 색인을 병합한다. 이 색인과 스킬 본문이 다른 Project의 현재 제품 맥락을 소유하지 않는다.

스킬을 제거하거나 교체해도 Spec·Ticket·state와 Project·Workspace 운영 계약은 그대로 남는다. 관련 스킬·도구 연결·이 색인을 함께 정리하고, 공통 설명 기준은 해당 문서의 consumer와 제거 조건을 따른다.
