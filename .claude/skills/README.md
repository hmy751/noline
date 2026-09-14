# Noline Context Harness skills

이 디렉터리는 Noline의 Context Harness 운영 스킬 원본과 deprecated 스킬의 이력을 소유한다. 각 `SKILL.md`가 해당 스킬의 호출 조건·실행 방법을, `agents/openai.yaml`이 Codex 호출 설정을 소유한다. Project·Workspace의 지속 의미와 문서 관리 계약은 해당 context Owner에 남는다.

## 설치된 역할과 진입점

- [create-context-workspace](create-context-workspace/SKILL.md): 새 독립 Workspace의 초기 구성과 재진입 검토. [생성·전환 계약](../../context/work/workspaces/CREATE-AND-TRANSITION.md)을 적용한다.
- [update-project-context](update-project-context/SKILL.md): 여러 Workspace에 지속될 맥락의 갱신·누락 복원과 승인된 주제별 Owner 이동. [Project 관리 계약](../../context/project/MAINTENANCE.md)을 적용한다.
- [work-discussion](work-discussion/SKILL.md): 사용자가 직접 호출했을 때 Work의 결과·선택을 구체화하고 Spec에 연결한다. 일반 작업 대화에서 자동으로 인터뷰를 시작하지 않는다.
- [reconsider-work](reconsider-work/SKILL.md): 실제 결과·새 조건·변경 부담·막힘에 따라 현재 판단과 후속 행동을 다시 본다.
- [work-artifact-briefing](work-artifact-briefing/SKILL.md): 기존 작업물의 역할·연결·상태와 근거가 뒷받침하는 범위를 조사해 설명한다.
- [explanation-recovery](explanation-recovery/SKILL.md): 앞선 실제 설명에서 놓친 뜻·전제·논리 연결을 필요한 만큼 복구한다.

위 목록은 역할을 찾는 색인이다. 상세 호출 조건과 설명·검토의 권한 경계는 각 스킬을 따른다. 고정 호출 순서나 모든 작업에서 실행하는 공통 workflow는 두지 않는다.

## Deprecated

- [noline-work](noline-work/SKILL.md): 2026-09-10 사용자 요청으로 사용 중단. 호출하지 않으며 기존 본문과 bridge는 이력으로 보존한다. 작업별 기준은 root·workspace guide와 rules·guards·runbooks·context에서 직접 찾는다.

## Context와 문서 갱신

작업을 다루는 스킬은 root [AGENTS.md](../../AGENTS.md)에서 관련 context를 찾고, [Spec·Ticket 계약](../../context/work/workspaces/spec-and-tickets/README.md)의 내용·읽기·Main·Maintain 관계를 적용한다. 새 Workspace 초기 구성과 준비된 Workspace의 문서 유지를 구별한다. 자동 연결이 없을 때의 허용된 문서 반영은 같은 계약이 연결하는 Maintain 수동 fallback을 따른다. 스킬 설치·호출은 session activation이나 실제 문서 반영을 뜻하지 않는다.

`work-discussion`, `work-artifact-briefing`, `explanation-recovery`는 각 호출 조건에 따라 [설명과 근거 기준](../../context/project/guidance/explanation-and-evidence-criteria.md)을 함께 읽는다. 이 기준의 범위·수명·consumer 관계는 [guidance 색인](../../context/project/guidance/README.md)이 연결한다. `reconsider-work`나 모든 Recover에 새 필수 입력으로 추가하지 않는다.

## 도구 연결과 이식

Noline의 `.claude/skills/`가 스킬 원본이며 `.agents/skills/`의 상대 symlink가 같은 원본을 Codex에 연결한다. 기존 bridge 모델을 유지하므로 별도 `.codex/skills/` 연결은 만들지 않는다. 호출 설정과 상대 연결의 존재는 실제 host의 발견·호출·Maintain 동작을 증명하지 않는다. Codex adapter와 Noline 전용 Claude hook은 같은 Maintain 계약에 연결되며, actual-host proof는 별도다.

다른 Project에 이식할 때는 이 목록과 실제 디렉터리·호출 설정·연결·공통 기준을 함께 확인한다. 기존 동명 또는 같은 책임의 스킬과 비교해 설치·적응·제외를 정하고, 기존 guidance 색인을 병합한다. 이 색인과 스킬 본문이 다른 Project의 현재 제품 맥락을 소유하지 않는다.

스킬을 제거하거나 교체해도 Spec·Ticket·state와 Project·Workspace 운영 계약은 그대로 남는다. 관련 스킬·도구 연결·이 색인을 함께 정리하고, 공통 설명 기준은 해당 문서의 consumer와 제거 조건을 따른다.
