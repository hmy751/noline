# Project 관리 계약과 읽기 경로 재적용

2026-09-10 사용자는 Source의 Project 관리 기준 배치를 바꾼 뒤 “재적용까지해”라고 승인했다. 이번 변경은 README·관리 계약의 배치와 이식·갱신 읽기 경로, 직접 연결된 Workspace 설명·기록·검증에 한정한다.

## Source와 target 고정

Source HEAD는 `87d21023f6acd8ae709322d48da9851594f9acb0`이며 현재 Reference 변경 9개와 이식 skill 변경 2개는 사용자 승인된 dirty bytes다. [source-input.json](receipts/application/project-management-reapplication-20260910/source-input.json)에 exact path와 SHA-256을, [source.diff](receipts/application/project-management-reapplication-20260910/source.diff)에 새 관리 계약 본문을 포함한 diff를 그대로 보존했다. Main이 고정한 11개 파일의 hash를 읽기·적용 직전에 대조했고 모두 일치했다. Source Reference bytes 전체가 commit과 같다고 주장하지 않는다.

Target은 `feat/noline-context-harness`, HEAD `b4ed41f6e4bbae26fd45827b3b9063097a2c1ea4`다. [fresh preflight](receipts/preflight/preflight-20260910T054516807467Z-d32ad76ba356495c8e2333e377e42c01.json)는 기존 변경·untracked·삭제 113개 entry와 instruction 11개를 관찰했고 staged 변경은 없었다. 별도로 tracked와 non-ignored untracked 618개 경로 및 Git index hash를 고정했다. Receipt는 저자·ignored 파일 전체·atomic snapshot을 증명하지 않으며 exact 적용 경로와 ancestor·ignore·symlink는 따로 대조한다.

## 내용 귀속과 배치

Project README의 내용 복원 완료 조건, 근거에 따른 변경 범위와 갱신 시점·관리 장치 기준은 [MAINTENANCE.md](../../../../project/MAINTENANCE.md)가 맡는다. 이 본문은 승인된 Source bytes를 그대로 사용하고 Noline의 `.agents/skills/` bridge와 기존 Workspace collection 계약으로 연결한다. [README](../../../../project/README.md)는 층별 책임·실제 Noline 내용 위치·상세 Owner와 권위 관계·관리 계약을 읽을 시점만 유지한다. 제품 common/current/guidance 본문과 Decision의 제품 의미는 바꾸지 않는다.

앞선 문서 전환의 실제 통합·제거·Git 보존 결과는 [첫 적용 기록](2026-09-10-01-document-transition.md)에 이미 있으므로 README의 실행 결과 설명을 내려놓는다. 과거 기록·receipt·source snapshot은 다시 쓰지 않는다. 상세 제품 Owner의 경로·책임도 이동하지 않는다.

Source의 root README와 AGENTS가 맡던 관리 진입 역할은 Noline의 기존 root CLAUDE와 context README에 적응한다. 제품 소개용 root README는 유지한다. Work AGENTS·Workspace collection, `.claude/skills/update-project-context/SKILL.md`와 skill 색인은 관리 계약을 필요한 작업에서 직접 읽도록 연결한다. `.claude/skills/` 원본과 `.agents/skills/` 상대 bridge, 호출 설정을 유지한다. 다른 다섯 Reference skill과 공통 설명 기준 본문·consumer는 변경하지 않는다. Main의 허용된 수동 문서 반영과 Workspace Maintain 쓰기 경계는 그대로다.

Live consumer는 기존 active/default 및 이번 변경 대상 `001-noline-context-harness-application` 하나다. 두 host runtime 디렉터리가 없어 current-generation bound consumer는 관찰되지 않았다. Recover의 선택 이유·사람용 current·output 설명을 맞추되 선택 목록은 root README·common/product·current/architecture·Selective Local-First Decision 네 문서로 유지한다. MAINTENANCE는 관리 주체가 직접 읽으며 일반 Recover packet에는 추가하지 않는다.

## 검증 범위와 결과

문서 배치·읽기 경로 변경이므로 전체 Harness tests·새 독립 review·host activation은 반복하지 않는다. Source hash·기준 보존·지침과 skill의 canonical 링크·상대 bridge·local lexical/resolved target·잔재·existing 변경 보호를 확인하고 Main이 의미와 diff를 좁게 대조한다. 명시/default Recover의 실제 내용과 관리 계약 미포함을 확인한다.

기존 구조 Verify argv는 유지한다. 새 관리 계약·Ticket·기록은 실제 검사 입력이므로 regular input closure에 포함하고 재적용 인계의 Verify·후속 Recover에서 현재 사건을 연결한다. 선언 파일 freshness는 directory/symlink topology, Git index, 실제 host discovery·호출·문서 유지나 제품 기능·acceptance를 증명하지 않는다.

직접 `node scripts/check-harness.mjs`가 통과했다. MAINTENANCE와 update skill은 승인된 Source bytes와 같고, 관리 기준의 내용은 새 계약으로 보존됐다. README에는 상세 관리 기준의 중복 본문이나 이번 이식의 실행 결과가 남아 있지 않으며 Noline의 실제 layer와 상세 Owner는 유지됐다. Main은 manifest·주요 diff에 이어 실제 target README의 Noline layer·상세 Owner 보존, 관리 계약·갱신 skill의 Source bytes 일치와 기존 bridge·routing을 확인했다. Baseline도 별도로 재계산해 승인 변경·상태 파일 외 602개 경로와 Git index SHA-256이 같음을 확인했으며 현 범위에서 추가 수정 의견은 없었다.

갱신 skill의 frontmatter·호출 설정 보존과 `.agents/skills/update-project-context`의 상대 연결을 확인했다. 실제 host discovery·invocation은 관찰하지 않았다. Explicit/default Recover의 loaded context는 동일한 15개이고 선택한 Project 문서는 네 개 그대로다. MAINTENANCE는 해당 작업의 직접 읽기 경로에 있으며 자동 packet에는 포함되지 않는다. Root README·갱신 skill·Work 지침·Workspace collection과 current/output의 링크가 가리키는 실제 Owner를 대조했다.

변경 대상 외 baseline 602개 경로는 kind·hash가 같았고 Git index도 그대로였다. 제품 본문·코드·상세 문서·다른 skill·runtime·설정과 기존 사용자 변경·source/records/receipts가 이 보호 범위에 포함된다. 이번 의도한 문서 수정과 Verify가 갱신하는 status는 따로 구분한다. Preflight와 승인 Source 입력·diff의 target 보존본은 임시 원본과 바이트가 같다.

Node의 실제 regular content read 113개는 선언 basis+evidence 125개에 모두 포함됐다. 새 관리 계약·Ticket·이 기록을 evidence에 추가했고 claim·basis·argv·실행 제한은 바꾸지 않았다. Local link의 lexical/resolved target은 존재하며 Project 경계 안에서 해석됐다. 적용한 Markdown과 live consumer에서 Source sample 잔재와 관리 기준의 옛 Owner 설명은 발견되지 않았다. 승인 원문인 source.diff의 sample 경로·이전 문구는 source provenance로 exact allowlist에 남긴다.

최종 기록·current 반영 뒤의 구조 Verify result·receipt는 [machine status](../current/state/status.json)에서 찾는다. 후속 Recover가 확인한 실제 사건과 freshness는 아래 별도 증거가 소유한다. 과거 Verify나 직접 검사의 통과를 새 선언 snapshot의 현재성으로 대신하지 않는다.

- [Exact manifest](receipts/application/project-management-reapplication-20260910/manifest.json): Source 책임별 target 적응·보존·제외와 실제 경로
- [직접 검증](receipts/application/project-management-reapplication-20260910/validation.json): 기준·skill 연결·live consumer·baseline 보호와 검증 결과
- [Local link 상세](receipts/application/project-management-reapplication-20260910/links.json): source·line·label·lexical/resolved target
- [실행 입력 closure](receipts/application/project-management-reapplication-20260910/input-closure.json): 실제 regular read와 선언 입력
- [Verify 이후 Recover](receipts/application/project-management-reapplication-20260910/final-recover.json): 최종 receipt·freshness와 선택 목록

두 host runtime 디렉터리는 여전히 없고 Maintain은 `activation_pending`이다. Stage·commit·host activation·제품 리팩토링은 수행하지 않았다. 실제 host discovery·문서 유지·제품 기능과 사람 acceptance·Workspace 완료는 남은 판단이다.
