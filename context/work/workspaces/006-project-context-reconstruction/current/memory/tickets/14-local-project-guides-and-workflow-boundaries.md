# Ticket 14 — 로컬 프로젝트 지침과 개발 워크플로의 책임 정리

## 맡은 결과와 범위

Noline 루트와 client·server·schema·UI의 CLAUDE.md에서 현재 필요한 프로젝트 안내·경로별 책임·명령을 유지하면서, development 및 Context와 중복되는 수행 규칙과 오래된 사실을 정리한다. 다음 작업자가 실제 요청에 맞는 스킬과 현재 제품·관리 기준을 찾을 수 있고 같은 판단을 여러 문서에서 따로 관리하지 않는 상태가 결과다.

[006의 범위](../spec/01-problem-goal-scope.md)와 [공통 내용 판단·리뷰 기준](../spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)을 적용한다. 루트와 하위 가이드 4개 및 AGENTS.md bridge를 주 대상으로 하며, 책임·진입 변경의 영향을 받는 현재 Context·스킬 연결과 checker는 필요한 범위만 함께 맞춘다. 제품 규칙을 바꾸거나 지침의 길이·파일 수를 줄이는 것이 목표는 아니다.

전역 CLAUDE.md는 적용되는 배경 기준으로 대조하되 실제 전역 개편은 별도 작업이다. Work·Maintain 개편과 work-discussion의 유보 사항, 제품 오류 수정은 이 Ticket에 포함하지 않는다. 기존 자동 기록·session 연결을 제거하거나 역할 권한을 재설계하지 않는다.

## 실행 맥락과 접근

두 README 통합은 commit `db1a4bb`, archive 이동은 `19b5c7a`로 보존됐다. [Ticket 13](13-integrated-verification-and-acceptance.md)에 이어 남은 로컬 지침 정리를 이 Ticket으로 분리했다. 이 결과와 자체 확인을 마친 뒤 13이 006 전체 검증·수락 판단을 이어간다. 번호 순서와 달리 다음 실행 대상은 14이며, 13의 전체 종료 판단은 그 뒤다.

Main은 루트·하위 가이드, Context의 역할·사용·관리 기준, development 본문과 구현·검토·검증·실행 배치 상세 및 형성 기록, 실제 package 명령과 대표 코드를 대조했다. 아래는 그 근거에서 정리한 적용 계획이며 실제 지침 수정 결과가 아니다. [논의와 교정 기록](../../../records/2026-10-31-11-claude-guide-scope-and-development-boundary.md)에서 사용자 원문과 초기안의 수정 이유를 찾는다.

### 책임을 유지하는 기본안

- 루트는 Noline의 정체성, 프로젝트 고유 기준·Context·스킬·코드 영역 접근점과 저장소 공통 규칙을 맡는다. 개발 요청에 development를 적용한다는 연결은 남기되 요청 해석·맥락 재선택·역할 배정·수정·검증·완료·기록 연결을 다시 정의하지 않는다.
- development는 Main의 전체 수행을 조율한다. Context의 USAGE는 읽기·대조·재사용 방법을, 각 영역의 관리 계약은 지속 내용의 권한·갱신 기준을 소유한다. 직접 설명·문서 갱신 요청도 해당 스킬로 접근할 수 있게 하며 모든 요청을 development에 통과시키지 않는다.
- 하위 가이드는 해당 코드 경로의 구현 책임·위험 경계·실제 명령과 필요한 Project 본문 접근을 맡는다. 제품 상세·예외는 Project의 같은 주제에서 관리한다. 경로 가까이 필요한 짧은 요약은 가능하지만 별도 정책 원천으로 만들지 않는다.

### 내용별 적용 계획

| 대상 | 유지·정리와 확인할 내용 |
| --- | --- |
| 제품 소개·용어 | 제품 목적과 현재 이름을 유지한다. 과거 명칭과 변경 이유는 기존 Project 결정으로 연결한다. |
| Core Invariants | 항목별 현재 권위·조건을 대조한다. 제품 경계의 요약과 기준 본문 연결로 구성하며 중복 규칙을 새 문서로 옮기지 않는다. 활성/비활성 설명을 여행 목록·새 여행 생성 전체에 일반화하지 않는다. |
| 여러 진입 표·구조·기술 스택 | 작업 주제·코드 영역에서 실제 기준을 찾도록 중복을 합친다. 구조 안내에는 context를 포함하고 기술 표현을 현재 코드와 맞춘다. |
| Context Harness 운영 진입 | 스킬 적용·영역의 역할과 위치·관리 계약 접근을 남긴다. Main의 조율과 Maintain 내부 동작을 루트에 재작성하지 않는다. |
| 충돌하는 규칙 | 모든 agent를 report-only로 제한한 문장과 코드 충돌 시 guide만 고치라는 문장은 제거하는 안이다. 대체 역할 규칙·충돌 해결 절차를 만들지 않고 해당 실행·관리 계약으로 연결한다. |
| 저장소 공통 운영 | bridge·커밋 규칙과 지침 변경 시 harness:check의 적용·검사 범위를 유지하며 설명 중복을 줄인다. |
| client·server | 최근 반영된 실행·데이터 책임을 보존한다. package scripts에 있는 client test·test:typecheck, server test·test:integration을 실제 사용 조건에 맞게 안내한다. |
| schema·UI | 공유 계약·저장 표현·공개 export 영향과 primitive·앱 조합 경계를 유지한다. 현재 경로 지도와 소비 기준을 대조한다. |
| 자료 관리 표현 | 긴 자료를 Project 또는 archive로 보내라는 포괄 문구를 현재 역할·권위에 따른 안내로 고친다. app/package와 Work Workspace의 용어도 구별한다. |

시작 자료는 저장소 루트 `CLAUDE.md`, `apps/client/CLAUDE.md`, `apps/server/CLAUDE.md`, `packages/schema/CLAUDE.md`, `packages/ui/CLAUDE.md`, `.agents/skills/development/SKILL.md`와 역할 상세·형성 기록, `context/README.md`, `context/USAGE.md`, `context/SYSTEM-GUIDANCE.md`, Project README·MAINTENANCE와 각 내용 Owner다. 실제 명령은 각 package.json, 제품 주장은 관련 코드와 대조한다.

development가 현재 root의 제품 불변식 선택을 언급하므로 루트 변경 뒤 그 문장과 Context·스킬 색인의 실제 연결을 함께 확인한다. 연결 조정이 필요하면 그 범위만 맞추며 스킬의 개발 워크플로를 새로 설계하지 않는다. 새 관리 README·공통 workflow·빈 지침 계층을 만들지 않는다.

## 완료 조건과 확인 방법

- 기존 내용마다 유효한 의미를 유지·갱신·기존 Owner 연결·제외한 이유를 설명할 수 있다. 단순히 오래됐거나 중복 문구라는 이유만으로 필요한 경계·예외를 없애지 않는다.
- 루트와 하위 가이드만으로 역할과 필요한 기준의 위치를 이해할 수 있다. 제품 기준을 독립 관리하거나 development의 수행을 다시 강제하는 문장이 남지 않는다.
- 개발 재개, sync 변경, 설명만 요청, Project 갱신, 한정 구현 위임의 대표 장면에서 실제 진입과 기준 선택을 대조한다. 불필요한 전체 Workspace 인수·구현·새 Workspace 생성으로 확대되지 않아야 한다.
- 제품 설명·명령·경로는 실제 소스와 설정에 대조한다. 검사 명령의 존재와 이번 실행 성공을 구별하고 이번 지침 정리를 앱 전체 동작 검증으로 보고하지 않는다.
- 의미 있는 책임·연결 변경에는 development의 독립 개선 검토와 별도 검증을 적용한다. 변경된 설명도 검토 대상이며 작성자의 의도를 정답으로 삼지 않는다.
- 로컬 링크·bridge·필요한 anchor, 영향받은 checker·현재 소비 경로와 diff를 확인한다. Project의 경로·권위가 바뀌면 기존 live consumer 계약을 적용한다.
- `pnpm harness:check`의 기존 역사 실패 65건과 새 변경으로 생긴 실패를 구분한다. 기존 실패를 숨기거나 검사 예외 확대·역사 원문 수정으로 통과를 만들지 않는다.
- 실제 변경·검토·검증과 남은 한계를 Work에 반영하고 Ticket 13으로 반환한다. 14의 완료는 006 전체 사용자 수락을 뜻하지 않는다.

## 현재 상태와 실제 결과

사용자가 2026-10-31에 티켓 추가와 기록 정리를 요청해 이 실행 범위를 문서화했다. 범위·적용 계획·확인 방법을 정리한 상태이며 CLAUDE.md, 스킬, Context 기준 본문은 아직 수정하지 않았다. 이번 요청은 기록 정리이며 지침 적용 완료나 006 수락으로 처리하지 않는다. 다음 적용 요청에서 이 Ticket을 기준으로 실제 문안·연결을 수정하고 확인한다.

기록 반영 뒤 Main이 저장된 본문과 색인을 대조했고, guarded apply의 경로·preimage·로컬 링크 검사와 `git diff --check`를 통과했다. 006 Recover도 성공했으며 packet에 Ticket 14 진입 연결이 포함됐다. 이 확인은 기록의 저장·재진입 범위이며 지침 적용 결과의 검증은 아니다.
