# 이식 문서 전환 보완

2026-09-10 사용자가 승인한 이식 보완 범위에서, 대체된 Project 요약의 내용 귀속과 기존 파일 처리를 마무리한다. 실행 코드·skill·host 설정·제품 코드와 기존 상세 문서 전체 정비는 이번 변경 범위가 아니다. 사용자 승인 범위에 맞는 변경안을 Main에게 전달했고 진행 승인을 확인했다.

## 사용한 근거와 baseline

Reference source는 clean `87d21023f6acd8ae709322d48da9851594f9acb0`이다. 현재 적용 skill의 문서 전환 기준과 live Project·Work·Workspace·Harness 계약을 읽었다. Runtime이나 skill payload를 새로 가져오지 않고 이미 설치된 책임 관계를 유지한다.

Target은 `feat/noline-context-harness`, HEAD `b4ed41f6e4bbae26fd45827b3b9063097a2c1ea4`이며 staged 변경은 없었다. [새 preflight](receipts/preflight/preflight-20260910T034554982054Z-ea1d544844714f7bafca4c45e01d5ad3.json)는 변경·untracked·삭제 104개 entry와 instruction 관찰을 고정한다. 이 receipt는 저자·ignored 파일 전체·atomic snapshot을 증명하지 않는다. 별도 보호 대조는 tracked와 non-ignored untracked 609개 경로의 kind·hash 및 Git index를 기준으로 한다. Private 세션 본문을 해석하거나 기록에 복제하지 않았다.

## 문서별 내용 귀속과 기존 파일 처리

이전 `context/project/overview.md`의 사용자 목적·데이터 불변식은 [common/product.md](../../../../project/common/product.md)의 사용자 장면과 데이터 관계에, 구성·검증 경계와 상세 Owner 경로는 [current/architecture.md](../../../../project/current/architecture.md)에 반영했다. 이전 `context/project/prd.md`의 목적·성공 기준·범위 밖·acceptance 한계도 common과 current가 각각 맡는다. 이전 `context/project/architecture.md`의 구성·실행 흐름·명령·실환경 확인 경계는 current에 있다. 선택 이유와 재검토 신호는 기존 [Decision](../../../../project/decisions/0001-selective-local-first.md)이 유지한다.

Common에서 여행 하나의 활성화와 온라인 Network-First 서비스 의미를 명확히 했다. 이 내용은 이전 요약·root README·CLAUDE와 상세 Policy Owner가 지지하며 새 제품 결정이 아니다. Workspace에만 해당하던 후속 리팩토링의 미정 상태는 Workspace state에 남긴다. Guidance의 조건부 설명 기준과 기존 rules·guards·runbooks Owner는 유지하며 이식 Workspace 한 개의 선택 상태를 Project guidance의 사실로 두지 않는다.

세 이전 문서는 현재 정본이나 Recover 입력이 아니었고 호환 소비자가 없었다. 전환 안내를 제외한 본문은 각각 Git HEAD와 바이트가 같았다. Git `b4ed41f6`에서 원래 경로로 복원할 수 있으므로 별도 source 복사본을 만들지 않고 현재 경로에서 제거한다. 상세 `.claude/context/`·rules·guards·runbooks·제품 정본을 이동하거나 삭제하지 않는다.

Git HEAD의 원문 SHA-256:

- `context/project/overview.md`: `00a5db37a65cebdfb01bf1f202d99a38407402607dd5ccf4da1ab8134063c00d`
- `context/project/prd.md`: `bd9a54194d1f28c2d0cc803e95cebcd657ca27be527a590726451012a3623fea`
- `context/project/architecture.md`: `b14cc87a1b2affc484dffed2b309533681ecd4b099ade10c1103467b22af4882`

2026-09-09 기록은 당시 원문 보존 결정을 설명하는 역사 기록으로 유지한다. 그 Decision에 후속 전환 관계를 추가하고 현재 Spec·Ticket·state·output은 새 처리에 맞춘다. 원문에 과거 안내만 붙이고 현재 경로에 남기는 상태를 전환 완료로 취급하지 않는다.

## Live consumer와 검증 범위

Active/default 및 이번 변경 consumer는 `001-noline-context-harness-application` 하나다. 두 host runtime 디렉터리가 없어 current-generation bound consumer는 관찰되지 않았다. Workspace id·Project 선택은 바꾸지 않고 current·output의 설명을 reconcile한다. Root Project README, common/product, current/architecture와 Selective Local-First Decision이 선택되고 guidance·source·records 전체·Ticket 본문은 기본 Recover에 추가하지 않는다.

문서 전환만 바꾸므로 전체 Harness tests나 새 독립 review는 반복하지 않았다. Main은 Git의 이전 세 본문, 실제 적용된 common/current/guidance와 전환 diff를 직접 대조했고 이번 범위에서 내용 귀속·파일 처리에 추가 수정할 문제를 발견하지 못했다. 이 확인을 실제 제품 기능이나 host acceptance로 확대하지 않는다. 직접 구조 검사, local link의 lexical/resolved target과 의미, 제거 경로 residue, explicit/default Recover, 기존 변경 보존을 확인한다. 새 문서 전환 결과의 인계를 위해 같은 구조 Verify argv의 regular input closure를 갱신하고 Verify 뒤 Recover로 현재 cursor를 확인한다. 실제 host trust·activation·runtime event, skill discovery·invocation·문서 유지, 제품 기능과 사람 acceptance는 이 확인으로 닫히지 않는다.

## 검증 결과

직접 `node scripts/check-harness.mjs`는 통과했다. explicit/default Recover가 읽은 context는 동일한 15개이며 default만 active index를 control path로 추가했다. 이전 요약·원문 source·Ticket 본문은 기본 packet에 없고, Project 선택과 Spec·state·output의 실제 Owner 설명을 대조했다.

기존 수정 대상 외 baseline 경로 591개는 kind·hash가 같았고 Git index도 그대로였다. 여기에는 제품 코드·상세 문서·기존 미커밋 사용자 파일·skill·host 설정과 구현이 포함된다. 의도한 세 파일의 제거와 이번 문서 수정, Verify가 소유하는 status 갱신은 보호 비교에서 구분한다. Preflight 보존본은 임시 원본과 바이트가 같았다. 새 receipt·기록은 baseline에 없던 이번 결과다.

검사 명령의 regular content input 110개는 선언 basis+evidence 122개에 모두 포함됐다. 제거한 세 Markdown은 evidence에서 제외하고 새 Ticket과 이 기록을 추가했다. 명령·schema·timeout·claim은 유지했다. Directory membership·symlink topology·link target 존재는 검사 당시의 관찰이며 regular-file freshness가 이후 동일성을 보장하지 않는다. Git·index·whitespace는 직접 검사했고 제품 코드·외부 서비스 동작은 이 argv가 검증하지 않는다.

최종 문서의 local link는 lexical·resolved target의 존재와 Project 내부 경계를 기계적으로 확인하고, 제품 기준·구현 지도·machine Owner 설명과 output의 target을 의미상 대조했다. 제거 경로의 남은 참조는 과거 또는 이번 receipt의 exact snapshot·전환 기록, 이전 선택의 source 원문뿐이며 각 파일과 이유를 exact allowlist로 남긴다. Source sample의 제품·Workspace 잔재는 이번 소비 표면에서 발견되지 않았다.

이 기록과 current를 최종 반영한 뒤 실행한 구조 Verify의 result·receipt는 [machine status](../current/state/status.json)에서 찾는다. 그 뒤 explicit/default Recover의 cursor·freshness 대조는 아래 후속 검증 증거가 소유한다. 증거를 이 문서에 다시 복사해 스스로 입력 freshness를 바꾸지 않는다.

- [문서 전환 manifest](receipts/application/document-transition-manifest-20260910.json): exact path·내용 귀속·설치 책임 유지와 제외
- [보호·경로·Recover 검증](receipts/application/document-transition-validation-20260910.json): baseline 대조, local link 수·오류, 소비 경로와 residue exact allowlist
- [Local link 상세](receipts/application/document-transition-links-20260910.json): source·line·label·lexical/resolved target
- [실행 입력 closure](receipts/application/document-transition-input-closure-20260910.json): 실제 regular read와 선언 파일의 교집합·누락
- [Verify 이후 Recover](receipts/application/document-transition-final-recover-20260910.json): 최종 검증 사건과 현재 snapshot 대조

Stage·commit·branch 변경·host activation은 수행하지 않았다. 두 host runtime 디렉터리는 여전히 없으며 hook 상태는 `activation_pending`이다. 설치된 skill·공통 기준 본문·도구 연결의 변경과 실제 host discovery·invocation 검증은 이번 범위가 아니다. 후속 제품 작업의 목표·사람 acceptance·Workspace 완료는 사용자 판단으로 남는다.
