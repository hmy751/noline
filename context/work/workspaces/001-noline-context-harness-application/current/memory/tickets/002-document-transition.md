# 이식 문서 전환 보완

## 맡은 결과와 범위

이식으로 대체된 Project 요약의 유효한 내용과 현재 역할을 대조하고 layer 귀속·기존 경로 처리·직접 영향받는 Workspace와 검증 입력을 함께 전환한다. 제품 리팩토링, 기존 상세 문서 전체 정비, 실행 코드·skill·host 설정 변경은 포함하지 않는다.

## 실행과 보존 기준

기존 미커밋 작업을 baseline으로 고정했다. 대체 문서의 본문이 Git HEAD와 같은지 먼저 확인한 뒤, current 역할이나 호환 필요가 없는 경로만 제거한다. 기존 상세 Owner와 사용자 파일은 유지하고 stage·commit·host activation은 하지 않는다.

## 현재 결과와 남은 판단

이전 요약 세 파일의 유효 내용을 현재 layer에 통합하고 원래 경로에서 제거했다. 직접 구조 검사, explicit/default Recover, local link·residue·보호 대조·regular input closure를 확인했고 Main의 내용·diff 검토에서 추가 수정할 문제는 발견되지 않았다. 최종 구조 Verify 결과와 후속 Recover는 [적용 기록](../../../records/2026-09-10-01-document-transition.md)이 연결하는 증거와 machine cursor에서 확인한다. 제품·host acceptance와 Workspace 완료는 별도 판단이다.
