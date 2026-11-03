# 선택한 원자료

이 Work가 작업 입력으로 선택한 원문과 식별 정보다. 해석과 판단은 records와 current에 있다. Project 본문은 복제하지 않았으며 [Project 선택](../current/memory/project-context.md)에서 연결한다.

| 자료 | 역할과 읽을 시점 |
| --- | --- |
| [사용자 방향 원문](user-direction.md) | 범위·작업 방식·판단 형식이 사용자의 기대와 맞는지 확인할 때. 특히 "판단만"과 "선택지 비교" 정정 |
| 막힌 시뮬레이터 DB 백업 (아래) | Ticket 03에서 막힌 큐가 실제로 풀리는지 확인할 때 |
| 생성 시점 코드 (아래) | Ticket 01이 이어 쓸 작업 트리 변경이 생성 뒤 바뀌었는지 확인할 때 |

## 막힌 시뮬레이터 DB 백업

- 위치: `/private/tmp/claude-501/-Users-hammyeong-yeon-Desktop-10-work-noline/a3669485-d435-43dd-9b82-a2891a7e403e/scratchpad/sim-db-backup/noline.db`
- 크기 3,170,304 bytes, 2026-11-02 14:34(로컬 시각)에 만들었다.
- SHA-256 `ed7ec68f46594ea74ad21989c4fa39e42481b8816607ac040ee9c358eafc55a5`
- 확보 방법: iOS 시뮬레이터 개발 앱(`com.noline.dev`)의 로컬 SQLite를 테스트 행을 넣기 전에 복사했다. 큐 맨 앞에 FAILED·retryCount 3인 경비 CREATE가 있고, 뒤에 PENDING 작업이 있다.
- 한계: 임시 폴더라 지워질 수 있다. 개발 데이터라 저장소에 복사하지 않았다. 지워지면 Ticket 03의 재현 절차로 대신한다.

## 생성 시점 코드

기준 commit은 `b453aa25`다. 아래 파일은 이 commit 위의 미커밋 변경이며, Ticket 01의 생성 재전송 부분이다. 2026-11-03에 SHA-256을 구했다.

| 파일 | 상태 | SHA-256 |
| --- | --- | --- |
| `apps/server/src/routes/schedules.ts` | 수정 | `2ddf65476e40262f4c2e062c0be59161de3f7b7f1537f7534696d130d0d557f6` |
| `apps/server/src/routes/expenses.ts` | 수정 | `b2c1e40363a15ecf5abe980ea167ace52a45ce1fd7e2bb81403d41c495e8c7cc` |
| `apps/server/tests/support/test-app.ts` | 수정 | `8dd062e1abce29fa41ac49584e4f36114f76bc88abc270c8f406d0bc08965f94` |
| `apps/server/tests/routes/create.idempotency.test.ts` | 새 파일 | `b9435c04bcb632ba30dc133ef5e1b1358728b67febd3c9fda2c3b79938ee082b` |
| `apps/server/tests/integration/create.idempotency.test.ts` | 새 파일 | `4b24ceb604bb441fde861ae0cc8a14eb2c96a5797142fff9155c91ab3ed25fd8` |

위 표는 생성 시점의 식별 정보다. 이후 Ticket 01 진행으로 다섯 파일 모두 바뀌었고, 두 테스트 파일은 2026-11-03 개선 검토 뒤 `replay.idempotency.test.ts`로 이름을 바꿨다.

## 대화 기록

이 Work의 논의는 Claude Code 세션 `a3669485-d435-43dd-9b82-a2891a7e403e`에서 이뤄졌다. 로컬 대화 기록은 저장소 밖에 있으며 다른 사람이 열 수 없다. 판단에 필요한 사용자 발화는 위 원문 파일에, 관찰과 설계 판단은 records에 옮겨 두었다.
