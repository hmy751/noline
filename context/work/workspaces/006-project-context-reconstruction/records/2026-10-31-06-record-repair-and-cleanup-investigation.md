# 기록 복구의 실제 반영과 추가 정리 조사

Main은 자동 Maintain generation 1의 잘못된 START_GUIDE 상대 링크 실패와 실제 current의 08 누락을 확인했다. 기존 failure를 삭제하거나 성공으로 바꾸지 않고 해당 연결을 해제했다. Explicit 006 bootstrap 뒤 수동 guarded apply가 `updated`를 반환했으며 Ticket 08·Ticket 색인·state·Project 선택·복구 기록과 그 색인이 실제 반영됐다. 이 결과는 자동 Maintain event의 재실행 성공과 구별한다.

Ticket 08 작업 커밋은 `bebf123`이다. 기록은 사용자 요청대로 별도 커밋에 담는다. 개인 경험 문서 두 개와 미추적 `.pnpm-store/`는 이번 변경에 포함하지 않았다. 원격 push는 요청받지 않아 수행하지 않았다.

[추가 조사](../output/claude-cleanup-candidates.md)에서 문서 command 네 개의 정책·저장 경로 지시가 현재 Owner와 충돌하고, deprecated noline-work는 bridge·checker가 아직 요구하며, observer의 dispatcher 기준은 현재 스킬 수행 계약과 다르다는 점을 확인했다. 실행층 전체 삭제보다 해당 호출·발견·검토 경로를 한정 정리하는 안을 권장한다. 최근 실제 command 호출과 외부 링크는 미확인이다.

조사 중 runbooks가 연결하는 workflows가 다시 삭제된 context 색인을 가리키는 것을 Main이 직접 확인했다. 앞선 현재 읽기 검사에서 놓친 간접 경로이므로 해당 링크를 Project로 고쳐 08 작업 커밋에 포함했다. 이전 검증을 모든 하위 경로의 전수 증명으로 확대하지 않고, 누락과 교정·제한을 08 결과와 추가 조사에 남겼다. 새 command/skill 제거·격리와 observer 역할 변경은 수행하지 않았다.

전체 Harness의 역사 참조47건과 제품/배포 보호 공백은 계속 별개다. 006 전체 목표의 수락을 대신하지 않는다.
