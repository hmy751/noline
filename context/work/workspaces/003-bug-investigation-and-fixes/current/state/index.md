# 현재 상태와 다음 행동

2026-09-10 기존 분석과 추가 발견을 담은 버그 확인·수정 Workspace를 구성했다. 제품 수정·첫 실행 Ticket·제품 Verify는 아직 없다. 사용자가 선택한 진행 순서는 리팩토링 우선이며 이 Work 전체를 먼저 실행하는 계획이 아니다.

다음에 이 Work를 실행 대상으로 선택하면 [후보 목록](../memory/analysis-items.md)에서 해당 문제의 확인 수준과 기대 동작을 읽고 좁은 첫 Ticket을 정한다. 트랜잭션·queue 관련 판단 전에는 [실험 원자료](../../source/index.md)와 [추가 조사 해석](../../records/2026-09-10-02-additional-findings.md)을 직접 읽는다. 분리 실험의 raw script는 과거 결함을 확인하는 assertion을 포함하므로 수정 후 통과 테스트로 그대로 사용하지 않는다.

현재 강한 근거는 설치 드라이버의 비동기 transaction callback 조기 commit과 여행별 부분 UPDATE/FAILED 조회 누락의 분리 재현이다. 그 결과를 실제 기기 데이터 손실이나 cleanup 전체 재현으로 확대하지 않는다. 나머지 소스상 결함과 실행/계약 확인 후보는 각 항목에 구별해 남겼다.

[사용자 원문](../../source/user-direction.md)은 두 Work 분리·전체 분석 포함·리팩토링 우선·이번 생성 범위를 바꾸기 전에 확인한다. 원래 분석의 역할·정확한 접근점·해시는 [source](../../source/index.md)에 있다. 다른 Workspace를 먼저 복구할 필요는 없다.

active/default index와 session binding은 변경하지 않았다. `status.json`은 제품 Verify의 마지막 결과만 소유하며 null receipt는 이 Work의 제품 검증 미실행 상태다.

## 원래 분석 경로의 삭제에 대비한 보존

사용자가 `.claude/sessions`의 기존 분석 경로를 나중에 삭제할 계획을 밝혀 원자료를 이 Workspace 안에 보존했다. [분석 목차](../../source/codebase-analysis/README.md)에서 전체 내용을 읽고, [source 색인](../../source/index.md)에서 원문 사본과 해시를 찾는다. 후보·검증 기준을 판단할 때 원래 경로 대신 이 보존본을 읽는다. 원래 파일은 아직 삭제하지 않았으며 제품 구현·Ticket·activation·완료 상태는 바꾸지 않았다.

원래 분석 경로를 제외한 임시 Project에서 원문 7개 일치, 읽기용 본문 일치와 local 링크·명시적 Recover 성공을 확인했다. 상세 범위는 [분석 보존 검증](../../records/2026-09-10-05-analysis-preservation-validation.md)에 있다.
