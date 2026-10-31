# 두 README의 필요성 판단과 통합 결과

2026-10-31. 사용자는 내용을 먼저 옮기지 말고 필요한지·더 나은지 판단하라고 정정한 뒤, 대부분의 중복 제거와 소수 기준 보완안을 채택했다. `.claude/README.md`와 `.claude/harness/README.md`를 제거했다. 이 문서는 두 README 정리 당시 판단과 확인 범위를 보존한다. 이후 archive 이동과 로컬 가이드 정리까지 완료했으며 최신 전체 판단은 [최종 대조](ticket-13-result.md)에 있다. 전역 개편은 별도 작업이다.

## 남길 내용부터 판단한 결과

| 기존 내용 | 판단과 실제 Owner |
| --- | --- |
| 제품·레이어·Owner·읽기 지도 | root·Context·Project에 이미 충분하다. 중복 이관 없이 제거했다. |
| CLAUDE 원본·AGENTS bridge | 루트의 기존 설명을 유지하고, 원본·adapter·의도적 차이와 양쪽 소비 경로를 확인하는 기준만 보완했다. |
| 스킬 공통 원본·host 발견·이식 | 기존 공통 스킬 색인이 충분해 수정하지 않았다. |
| Maintain binding·wrapper·subagent 처리 | 기존 Work session binding 계약이 이미 소유하므로 두 번째 설명을 없앴다. |
| 경로별 가이드의 역할 | 책임·위험·명령·Project 선택을 안내하고 상세·기록을 중복 축적하지 않는 공통 기준을 루트에 보완했다. |
| 커밋 메시지 | 책임·의도 추적을 위한 Conventional Commit 권장, 가장 작은 scope와 domain 예외를 루트에 통합했다. |
| 변경 뒤 검사 | 루트에 harness:check 적용 조건과 검사 상한을 보완했다. |
| 반복·안정 뒤에만 규칙/실행자 추가 | 새 책임이나 한 번 드러난 중요 공백까지 막을 수 있는 과도한 선행 조건이어서 옮기지 않았다. 실제 목적·근거·조건은 기존 관리 기준으로 판단한다. |
| agent 전체 report-only 일반화 | 새 공통 규칙으로 옮기지 않았다. 당시 루트에 있던 문장은 후속 CLAUDE 검토 대상으로 뒀으며 Ticket 14에서 제거했다. |
| 폐기 스킬·agent·부분 적용 경위 | 기존 Work·형성 자료가 있어 현재 지침에 복제하지 않았다. |

새 관리 문서를 만들지 않았다. root·Context·Project Decision은 기존 책임으로 직접 이어지고, 검사기는 두 옛 경로를 현재 검사 입력에서 빼고 재등장을 금지한다. 기존 링크 검사와 보존 예외는 완화하지 않았다.

## 원문과 역사 참조

두 원문은 [원문 식별자](ticket-13-readme-originals.json)의 commit·경로·Git blob·SHA-256으로 재접근한다. 프로젝트 루트에서 `git show 7e5dd42:.claude/README.md`, `git show 7e5dd42:.claude/harness/README.md`로 읽는다. 해당 commit에 보존된 바이트이며 더 오래된 조사 당시 판본과 같다는 주장은 아니다.

이 단계에서는 004의 당시 project-context와 006 최초 조사 지도에 제거된 Document Map 링크가 각각 하나 남았다. 이후 Ticket 14에서 변경 가능한 006 조사 지도 연결을 고쳤으며 004의 당시 기록은 유지했다. 당시 자료를 현재 정책으로 고쳐 쓰지 않고 이 재접근 경로로 확인한다. 006의 변경 가능한 source 색인은 이 결과의 역사 접근 안내로 전환한다. raw source나 records는 수정하지 않는다.

## 확인과 후속

독립 개선 검토자는 두 원문·실제 diff·관련 Owner를 대조해 필요한 고유 의미 누락이나 과도한 이관을 찾지 못했다. 별도 요구 검증자는 두 Git 원문의 blob·SHA 일치, 현재 Owner 연결, 001 선언 191개 regular 입력과 최신 receipt hash 일치, strict 검사 64건의 동일 재현을 확인했다. 기존 62건 외 추가 2건은 위 역사 참조이며 다른 새 실패와 검사 예외 완화는 없다. 검증자가 발견한 current의 미적용 표시와 이 결과의 실행 전 문구를 실제 결과에 맞춰 갱신했다.

[실행 요약](ticket-13-readme-verification.json)과 [검사 원문](ticket-13-readme-check.txt)에 결과를 남겼다. 001의 실제 Verify는 fail·exit 1로 새 receipt를 생성했다. 001·002·006 Recover는 모두 exit 0이다. 001·002의 입력 freshness가 fresh여도 검사 결과는 fail이며 006 전체 수락을 뜻하지 않는다. current 갱신 뒤 006 Recover를 다시 실행해 반영된 상태도 확인했다.

제품 동작·host 호출 의미는 변경하지 않았으며 새 실제 모델 호출을 완료 증거로 요구하지 않는다. 이 결과는 `db1a4bb`에 보존됐고 후속 [archive 이동](ticket-13-archive-result.md)과 [로컬 가이드 정리](ticket-14-local-guides-result.md)도 완료됐다. 당시 64건은 이 단계의 검사값이며 최신 판정은 최종 대조를 따른다.
