# 현재 상태와 다음 행동

**두 README 정리·검증·기록을 commit `db1a4bb`에 보존했고, archive 124개 파일을 root `_archive`로 이동했다. archive 변경은 아직 커밋하지 않았으며 다음은 프로젝트 CLAUDE 계층 정리다. 006 전체 수락은 남아 있다.**

## 현재 결과와 한계

- 중복 README 두 개를 제거하고 필요한 소수 기준만 루트에 통합했다. 실제 결과와 원문 식별자는 [README 통합 결과](../../output/ticket-13-readme-integration.md)에 있다.
- archive 124개 전부 이동 전과 Git 기준 commit의 바이트·해시가 같다. 기존 manifest·원래 경로·원문은 유지했고 host 폴더에 사본·symlink를 남기지 않았다.
- 현재 스킬·006 output·002 기록 색인·001 Verify 입력·checker는 root 경로로 전환했다. 과거 records와 receipt는 그대로 보존한다. [Archive 이동 결과](../../output/ticket-13-archive-result.md)에서 새 경로와 확인 근거를 찾는다.
- strict 검사는 65개 역사 링크로 실패한다. 앞선 64건에 001 frozen 기록의 옛 archive 링크 1건이 추가됐다. 이동 경로표로 같은 원문에 재접근할 수 있으며 검사 예외를 늘리지 않았다.
- 001 현행 선언의 Verify 실패는 새 receipt에 남겼고, 001·002·006 Recover는 모두 성공했다. freshness·재진입은 검사 pass나 사용자 수락이 아니다.
- 미커밋 초기 원판 2개의 부재와 002 제품 타입 오류는 계속 유효한 한계다.

## 다음 행동

1. 프로젝트 root와 앱·패키지 CLAUDE 지침의 필요성·중복·구성을 전역·Context·스킬의 책임과 대조해 정리한다. 루트의 agent report-only 표현도 실제 적용 범위를 판단한다.
2. 로컬 정리 결과와 남은 한계를 제시한 뒤 006 전체 수락을 별도로 요청한다.

전역 개편은 별도 작업이며 006 종료의 선행 조건이 아니다. 제품 오류와 역사 원문 부재를 문서 이동으로 해결했다고 보고하지 않으며, 당시 records/source·machine receipt를 현재 정책으로 소급 수정하지 않는다.
