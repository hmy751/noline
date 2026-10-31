# Ticket 05 — 구조·계층·UI·schema 재구성

상태: 완료. 2026-10-31, 구조·계층·UI·schema 설명을 현재 코드와 소비 경로에 대조해 Project로 이관하고 독립 검토·검증과 재검증을 마쳤다. 이 완료는 문서 이관 범위이며 기존 계층 예외의 제거, 제품 코드 수정, 전체 import·API 검증이나 native 앱 실행, 006 전체 이관 완료를 뜻하지 않는다.

## 맡은 결과와 범위

현재 Project context에서 실제 app·package 구조, 앱 준비와 routing 조합, 계층별 책임, UI 구성 책임, 공유 schema와 TypeScript 타입의 보장 범위를 이해하고 관련 변경 기준을 선택할 수 있게 한다. 현재 코드와 다른 구조·export·타입 설명은 바로잡되, Zustand 소유 기준, 조회 조합의 제한적 재사용, UI 조합 책임, 정적 타입·런타임 검증·DB·전송 표현의 차이에 관한 유효한 선택 이유와 비용은 보존한다.

완료 상태에서는 새 Project 본문과 형성 자료만으로 대표 개발 질문에 답할 수 있어야 한다. 옛 구조·component·TypeScript 본문과 Store 결정 또는 그 아카이브를 일반 제품 읽기 경로로 사용하지 않는다. 문서 기준, 현재 구현의 예외와 불일치, 새 제품 선택이나 코드 정리를 구별한다.

## 실행 맥락과 접근

Ticket 04의 지도·경로 이관에 이어 구조·계층·UI·schema의 일반 개발 기준과 현재 한정 예외를 맡았다. 기존 구조·component·TypeScript 본문과 Store 계층 결정을 실제 app 초기화, store·policy, UI export와 form adapter, schema package, client·server 소비 경로 및 앞선 배치 기록에 대조했다.

[공통 내용·구성 판단 기준](../spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)에 따라 기존 내용의 현재 적합성과 형식의 역할을 함께 판단했다. 책임 표와 유효한 비교는 유지하고, 반복 체크리스트는 적용 조건 가까이에 통합했다. 긴 교육 예제, 존재하지 않는 export와 오래된 구현 설명은 실제 경로와 한정된 예시로 교정했다. 현재 구조를 찾는 지도와 변경 판단에 적용하는 기준을 분리하고, 계층·UI·schema는 읽을 질문과 책임이 달라 각각의 본문으로 구성했다.

## 완료 조건과 확인 방법

- app·package 구조와 application·화면·feature·entity·shared 책임을 현재 코드에 대조해 설명할 수 있다.
- UI primitive, 앱 조합, domain 표시, workflow와 form adapter·picker의 책임을 구별한다.
- 정적 타입 추론, 런타임 parse, 물리 DB 표현과 HTTP payload의 보장 범위를 구별한다.
- 현재 계층 예외와 제한적 재사용을 일반 허용이나 이미 해결된 구조로 과장하지 않는다.
- 유효한 규칙·선택 이유·비용과 현재 코드 차이, 후속 제품 정리 범위를 구별한다.
- 현재 Project 읽기 경로가 옛 본문·결정이나 아카이브를 제품 정본으로 안내하지 않는다.
- 독립 검토, 변경 문서 링크 검사와 Harness·Verify 입력의 남은 한계를 실제 결과에 남긴다.

제품 코드 정리나 새 계층 계약 채택은 문서 이관 완료로 대신하지 않는다.

## 현재 상태와 실제 결과

[Project 개발 기준](../../../../../../project/guidance/development-boundaries/INDEX.md)은 계층·재사용, UI 책임, 공유 schema·타입 본문을 연결하고 [현재 구조](../../../../../../project/current/architecture.md)는 실제 app·package와 DB 책임 및 지원·검증 한계를 설명한다. 형성 자료에는 Store·service·Policy 선택과 조회 조합의 제한적 재사용에서 얻는 이점, 결합 비용과 재검토 조건을 보존했다. 상세 판단과 원본 대응은 [이관 결과](../../../output/ticket-05-result.md)가 맡는다.

현재 코드 대조를 통해 존재하지 않는 `packages/db`와 Prisma 설명, 빠진 application 계층, 단순 screen export로 축소한 root layout, 실제로 없는 Button·schema import와 불완전한 타입 예제를 정정했다. `z.infer`가 런타임 검증까지 보장한다는 설명과 schema·HTTP·DB 표현을 동일시한 설명도 실제 parse·payload·저장 표현에 맞게 구별했다. Zustand 소유 기준과 관련 hook의 발견 가능성은 유지하되 모든 실행을 금지하는 규칙이나 영구적인 파일 수 규칙으로 확대하지 않았다.

shared에서 entity를 참조하는 현재 예외와 공개 조회 hook의 제한적 재사용은 숨기지 않았고 새 역방향 참조의 일반 선례로 올리지 않았다. UI primitive·domain·workflow와 부모 간격, RHF adapter·임시 선택·확정 경계를 구별했다. 폼 전체 수명은 Ticket 06의 별도 책임으로 남겼다.

옛 구조·component·TypeScript 본문과 Store 결정 4개는 안내문 뒤 원문을 보존한 아카이브로 옮겼고 옛 경로는 제거했다. Project README·guidance 색인·현재 구조, client·UI·schema guide와 관련 context·runbook의 현재 읽기 경로는 새 Owner로 전환했다. default 001 Verify 선언에서 이번에 이동한 네 evidence 경로는 새 개발 기준 7개 본문으로 바꿨으며 claim·argv·receipt·status는 변경하지 않았다.

Main 결과 문서에 따르면 최종 변경 문서 상대 링크 315개와 `git diff --check`가 통과했고, 보존판은 안내문 이후가 기존 원본과 byte 단위로 같음을 별도 검증자가 확인했다. 대표 UI 배치·조회 재사용·Expense schema 경계 읽기와 관련 Recover도 확인했다. 독립 검토에서 약해졌던 Zustand 규칙 강도를 복원한 뒤 재검증했으며 Ticket 05 범위의 blocking 발견은 남지 않았다.

전체 import 순환 검사, 전체 API 검증, 제품 test·build와 native 앱 실행은 수행하지 않았다. 전체 Harness 검사는 역사 링크 오류 25건 때문에 실패했고, 이번 이동과 무관하게 남아 있던 Verify evidence 입력 누락 8건은 Ticket 08의 전체 읽기·검증 선언 점검 범위로 남겼다. 제품 코드는 변경하지 않았고 Ticket 05 작업 변경은 `0e49e13`으로 커밋했고 Workspace 기록은 별도 커밋으로 분리한다. 다음 문서 이관은 Ticket 06의 작성·입력·날짜다.
