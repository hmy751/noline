# 현재 상태와 다음 행동

2026-09-10 Spec의 목표와 변경 전후 검증 기준을 구체화했고, Main은 Spec·관련 문서 7개를 검증 후 `a612ba4` — `리팩토링 목표와 변경 전후 검증 기준 구체화`로 커밋했다고 보고했다. 이는 사용자의 커밋 요청에 따른 문서 작업이며 제품 개선 완료가 아니다.

2026-09-11 추가 코드·사용처 조사에서 [기존 후보](../memory/analysis-items.md)에 더해 도시 검색·용량 집계·대표 여행 선택·카테고리 색상·인증/재시도·로그아웃 등의 관찰을 구체화했다. [추가 조사와 후속 범위](../memory/additional-research.md)에 Main의 근거와 확인 한계를 보존하고 [초안 Ticket 다섯 개](../memory/tickets/index.md)를 연결했다. 경비 합계, 도시 검색, 저장 용량, 경비 API, 서버 일정 응답 순서는 Main 추천이며 강한 기술 의존성이나 사용자의 첫 구현 대상 확정이 아니다. 제품 코드·테스트·설정 수정과 제품 동작 검사·Verify 실행 결과는 아직 없다.

사용자는 코드 범위별 Ticket 안에서 여러 개선 관점을 바텀부터 적용하고 변경 전후 동작·개선 효과를 확인하는 진행 방식을 채택했다. 실행 접근은 [작업 단위와 진행 방식](../memory/spec/05-constraints-design-assumptions.md), 전체 분석 관점·후보의 확인한 범위와 남은 범위 관리는 [품질·완료 판단](../memory/spec/04-quality-and-completion.md)을 따른다. 질문의 오해와 정정, 채택 원문, 임시 전달 자료와 records 보완 경위는 [합의 기록](../../records/2026-09-11-01-ticket-boundary-agreement.md)에 보존한다.

현재 사용자는 다섯 Ticket을 검토 중이며 문서 갱신 마무리를 요청했다. 진행 방식과 문서 갱신의 승인을 개별 Ticket 범위·첫 대상·추천 순서의 최종 확정이나 구현 착수 명령으로 확대하지 않는다. Main은 검토 뒤 구현을 이어가겠다고 밝혔다. 검토 뒤 선택한 범위에서 현재 코드의 보존 계약·개선 기대·검사 방법과 변경 전 검사에 필요한 최소 실행 방법을 구체화한다. 경비 합계 우선은 Main 제안이며 runner는 미선택이다.

기존 다섯 초안과 후속 후보를 유지한다. 폼 초기화·재진입, picker, 날짜 그룹, 저장 후 처리, 공통 데이터·경로·정리, 완료 상태와 설정 등의 후속 분해가 남아 있으며 전체 후보 배치를 실행의 일괄 선행 조건으로 두지 않는다. sync 재시도 설명과 조건의 충돌은 요청 횟수의 실제 확인이 필요한 동작 후보이며 재현된 결함으로 확정하지 않는다.

Main의 추가 조사 기준은 `refactor/codebase`, HEAD `a612ba4c49b92b1193e75e1d56bdefcdcd86bbda`다. 시작과 마지막 Git 확인에서 미커밋 파일은 이 Workspace state뿐이었다고 보고했다. 이는 당시 관찰이며 이후 저장소 상태를 보장하지 않는다. 제품 test/spec·runner 설정 경로와 root/client/server scripts에서는 제품 test 명령을 찾지 못했다고 보고했지만 저장소 밖 검사까지 없다는 뜻은 아니다. 타입·린트의 이전 실패와 설치 불일치는 [구성 기록](../../records/2026-09-10-01-workspace-setup.md)에 있으며 재실행하지 않았다. 실행 시 필요한 만큼 기준선을 확인하고 직접 걸리는 버그의 기대 동작·수정·선행 관계만 연결한다.

[원문](../../source/user-direction.md)은 최초 코드 집중·작은 요소 우선·두 Work 분리와 미커밋 제약을 판별할 때 읽는다. [source 색인](../../source/index.md)에서 기존 분석의 경로와 해시를 찾는다.

## 대화 반영과 자동 동작의 확인 범위

초기 구성 당시 active/default index와 session binding은 변경하지 않았다. 이후 Main은 현재 session이 `002-code-readability-refactoring` generation 1 active라고 보고했다. 앞선 점검에서는 개별 hook 7개 승인 뒤에도 자동 Maintain 접수·처리 기록이 없고 Evidence collector가 시작되지 않았다. 초기 승인 누락만을 당시 미동작의 전체 원인으로 확정하지 않는다.

'한번더 테스트 해볼래?' 요청에 대해 Main은 Maintain 자동 접수 1건과 Evidence 서비스 시작·수집 사건 1건의 `done` 처리를 보고했다. 해당 turn은 `01a08b95-9282-7ec0-910f-de5802a73719`다. 해당 응답 종료 처리 완료는 이 보고만으로 확인되지 않는다. 별도 테스트 두 번은 응답·도구 기록 없이 종료되어 재검증이 불완전했고 이후 연결 해제 후 닫았다는 보고가 있다. 모든 작업 정상이나 과거 원인 해소까지 입증한 것은 아니다.

후속 점검에서 Main은 위 메시지부터 수집이 시작됐으며 이후 수집 사건 3개가 완료됐고 앞선 Spec 목표·source 배경·테스트 기준 합의 원문은 당시 미수집이라고 보고했다. 원문 재접근 위치는 `/Users/hammyeong-yeon/.codex/sessions/2026/09/10/rollout-2026-09-10T21-56-54-01a08b64-7f25-7972-ac3e-496cb4af1de7.jsonl`이다.

이후 Main은 누락 대화 60개를 Evidence의 retrospective note로 보존하고 당시 bytes/hash 일치를 확인했다고 보고했다. 전달된 Project 상대 위치는 `evidence-collector/store/recollections/846e3c64734effd3f30168c7ca0e341939c101f93d3e8f7124ab117f5a6e4466/20260910T135903.326183Z-b0d87f1f4f7e48518611b68b3a1a5261/note.md`다. Git 제외 저장소의 사후 보존이며 자동 수집 당시 기록과 구별한다. 이번 추가 조사는 그 저장을 새로 수행하거나 재검증하지 않았고 Maintain도 메모 본문·해시를 독립 확인하지 않았다.

사용자는 전체 대화를 Maintain에 먼저 읽히고 필요한 내용을 갱신하게 한 뒤 Main이 미동작 원인을 조사하도록 정정했다. 이에 기존 semantic session에 작업 대화가 수동 전달되어 Spec·state 통합에 사용됐고 이후 Main이 문서 검증·커밋 완료를 보고했다. 수동 전달, 문서 반영, Evidence 사후 보존과 자동 hook 동작은 별개의 확인 범위다.

운영 문제를 제품 리팩토링 목표·완료 기준으로 추가하지 않는다. 상세 경계는 [session binding 계약](../../../../harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)을 따른다. `status.json`은 제품 Verify의 마지막 기계 결과만 소유하며 제공된 null receipt는 제품 Verify 결과가 없음을 뜻한다. 이번 변경안은 machine status를 수정하지 않는다.

## 원래 분석 경로의 삭제에 대비한 보존

사용자가 `.claude/sessions`의 기존 분석 경로를 나중에 삭제할 계획을 밝혀 원자료를 이 Workspace 안에 보존했다. [분석 목차](../../source/codebase-analysis/README.md)와 [source 색인](../../source/index.md)에서 보존본·원문 사본·해시를 찾는다. 후보 판단은 원래 경로 대신 보존본에서 시작한다. 보존 당시 원래 파일은 삭제하지 않았고 제품 구현·Ticket·activation·완료 상태를 바꾸지 않았다.

기존 상태에는 원래 분석 경로를 제외한 임시 Project에서 원문 7개와 읽기용 본문의 일치, local 링크·명시적 Recover 성공을 확인했다고 기록되어 있다. [분석 보존 검증](../../records/2026-09-10-04-analysis-preservation-validation.md)의 범위를 따르며 제품 동작 검증으로 확대하지 않는다.
