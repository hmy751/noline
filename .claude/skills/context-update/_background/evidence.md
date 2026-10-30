# Context Update의 판단 근거

[실행 본문](../SKILL.md)에 영향을 준 2026-10-26 사용자 논의와 고정판 원문의 필요한 부분이다. 전체 대화·조사 기록을 복제하지 않으며 당시 후보와 후속 선택을 구별한다.

## 구현자의 제안과 Main의 검토

구현자가 전체 맥락을 모를 수 있다는 논의 뒤 사용자가 제안했다.

> 그럼 어때? 구현자가 제안하고  메인이든 추후 합의될 담당자든 검토 한번하고 반영하는거지 그럼 구현자가 이미 아는정보로 바로 제안하는거니까 조사할 필요도 없고

이어 구현자가 제안을 이미 남겼다면 나중 루프에서 매번 다시 물을 필요가 없다는 취지를 밝혔다. 현재는 Main이 검토·반영하고 중요한 제안·근거·처리 결과를 기존 Work에 보존하는 방향으로 구체화했다. 이것은 근거의 누락·충돌이 있어도 추가 확인을 금지하거나 영구적으로 Main만 편집할 수 있다는 뜻은 아니다.

## Project에 남길 내용의 선별

데모의 미구현 안내를 갱신하는 예시에 대해 사용자가 지적했다.

> 왜냐면 project의 핵심이 그런 구현 사항까지 있어야 하는건가? 그게 있는게 좀 안 맞아보여서 그랬어 demo는 그냥 막 만들다보니 뭐 그렇게 적혀잇는것 같긴한데

이 정정 뒤에는 문장의 존재보다 지속할 내용의 적합성을 먼저 판단하게 했다. Project에 필요한 제품·구조·계약·지원 제약과 이번 Work의 구현·검사 진행을 구별한다. 사용자가 데모의 실제 작성 경위를 확정한 것으로 해석하지 않는다.

## 일상 반영과 이후 개선 단계

사용자는 루프의 후속 방향을 설명했다.

> 나중 루프에서도 이걸 상기해야하는 것 같아 단계를 아예 만들거거든 뭐 스킬을 통하거나 해서 매 작업마다는 아니고 대화 기준으로 할것 같아 이건 또 구체화 해야되는거고

이에 반영 내용의 선별·권한·확인 방법은 이후 루프에서도 재사용하되, 구체 발동 시점·대화 경계·담당·스킬 형태는 후속으로 남겼다. 모든 응답 종료에 루프를 실행하거나 모든 일상 갱신을 루프까지 미루는 합의가 아니다.

## 기존 원형과 외부 참고

기존 update-project-context 보존판의 핵심은 근거·보존할 의미·허용 범위, 본문과 실제 소비 경로의 확인, Work·제품 코드·machine 상태로 쓰기 범위를 넓히지 않는 것이었다. 현재 스킬은 그 방법을 대상별 관리 계약에 연결하며 Personal에도 적용한다. 기존 설치·자동 Maintain 전제는 가져오지 않았다.

외부 확인판은 Matt skills 1.3.1, commit `5beb35b040e3de97e54fa9e386d7e42d15c295c2`와 Lauren pstack 0.15.29, commit `190d28736eff128ec94f502a22c7fe0c4b56cd37`다. 설계 작업이 보존한 해당 원문과 조사에서 다음 관계를 사용했다.

- [Matt domain-modeling](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/domain-modeling/SKILL.md)과 [retro](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/retro/SKILL.md): 해결한 의미의 즉시 반영과 경험에서 개선 후보를 고르는 작업을 구별한다. 우리 Work 기록·채택 후 효과 관찰 전체를 대신하지 않는다.
- [Lauren maintain-verification-skill](https://github.com/cursor/plugins/blob/190d28736eff128ec94f502a22c7fe0c4b56cd37/pstack/skills/maintain-verification-skill/SKILL.md): 유지 대상 안에서 수정하고, 제품 결함을 문서 수정으로 감추지 않는 경계를 참고했다. 모든 기능의 실시간 실행·고정 병렬 배치·자동 PR 같은 운영 절차는 가져오지 않았다.

이 원문들은 우리에게 Main 검토를 의무화하거나 USAGE/context-update 형태의 우월성을 입증하지 않는다. 현재 책임 배치는 사용자 논의와 기존 workflow를 함께 적용한 선택이다. 형태에 대한 사용자 유보는 [공통 구성의 근거](../../../../context/_background/usage/evidence.md)에 보존한다.
