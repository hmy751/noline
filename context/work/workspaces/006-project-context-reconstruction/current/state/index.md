# 현재 상태와 다음 행동

**두 `.claude` README의 필요성 판단·최소 통합·제거와 현재 소비자 전환을 적용했다. 다음 단계는 archive의 root 이동이며, 그다음 프로젝트 `CLAUDE.md` 계층을 정리한다. 이번 변경은 아직 커밋하지 않았고 006 전체 수락도 받지 않았다.**

## 현재 결과와 확인 한계

- 제품 본문 통합과 Ticket 12·13 선행 대조는 commit `7e5dd42`에 보존됐다.
- `.claude/README.md`와 `.claude/harness/README.md`를 제거했다. 기존 Owner로 충분한 내용은 복제하지 않았고, 공통 bridge·가이드 경계·커밋·검사 기준만 루트에 보완했다.
- root·Context·Project, 001의 output·Verify 선언, 006 source 색인과 검사기 소비 경로를 전환했다. 원문은 Git commit·경로·blob·SHA-256으로 재접근한다.
- 독립 개선 검토는 의미 누락·과도한 이관을 찾지 못했다. 별도 검증에서 발견한 current의 미적용 표시는 실제 결과에 맞췄다.
- strict 검사는 역사 링크 64건으로 실패한다. 기존 62건에 004 당시 current와 006 최초 조사 지도의 옛 Document Map 링크 각 1건이 더해졌다. 역사 원문을 소급 수정하거나 검사 예외를 늘리지 않았다.
- 001의 현행 선언으로 실행한 Verify 실패는 새 receipt에 남았다. 이후 001·002·006 Recover는 모두 성공했다. 입력 freshness·Recover 성공은 검사 pass나 사용자 수락이 아니다.
- 앞서 확인한 미커밋 초기 원판 2개의 부재와 002 제품 타입 오류는 해소되지 않았다.

실제 반영·제외와 원문·검증 근거는 [두 README 통합 결과](../../output/ticket-13-readme-integration.md)에서 찾는다. 선행 전체 대조는 [Ticket 13 결과](../../output/ticket-13-result.md), 역사 재접근 한계는 [Ticket 12 결과](../../output/ticket-12-result.md)가 소유한다.

## 다음 행동

1. `.claude/_archive`를 현재 읽기와 분리된 root 보존 경계로 이동하고 현재 참조·보존 경로표·검사를 맞춘다. 원문과 원래 경로·해시는 보존한다.
2. 프로젝트 root와 앱·패키지의 `CLAUDE.md`를 전역·Context·스킬 책임과 대조해 정리한다. 루트의 `agent는 report-only` 표현도 실제 적용 범위를 확인한다.
3. 로컬 정리 결과와 남은 한계를 제시한 뒤 006 전체 수락을 별도로 요청한다.

전역 개편은 별도 작업이며 006 종료의 선행 조건이 아니다. 제품 오류·역사 원문 부재를 이번 문서 정리로 해결했다고 보고하지 않는다. 역사 records/source를 현재 정책으로 소급 수정하지 않으며 실제 host 연결은 필요한 소비 경로를 확인한 뒤 변경한다.
