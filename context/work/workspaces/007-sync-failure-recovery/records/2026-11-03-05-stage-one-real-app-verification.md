# 2026-11-03 — 1단계 실제 앱 확인과 독립 검증 (Ticket 03)

사용자가 "Start Ticket 03"으로 시작을 승인했다. HEAD `8eac08da`의 서버·앱으로 막힌 큐가 실제 앱에서 풀리는지 확인했다. 운영 서버와 운영 DB는 쓰지 않았다.

## 준비 (Main)

- **환경**
  - iOS 시뮬레이터: iPhone 15 Pro, iOS 26.0, 개발 앱 `com.noline.dev`
  - 로컬 PostgreSQL: Docker `noline-postgres`, `noline_dev`
  - 이미 떠 있던 개발 서버를 멈추고, HEAD 코드로 다시 띄워 로그를 남겼다. 그 서버는 11-02부터 `tsx watch`로 떠 있었고 이 세션에서 띄운 것이 아니었다.
  - Metro도 로그를 남기도록 새로 띄웠다. 앱의 console 로그가 이 로그에 남는다.
- **막힌 DB**
  - [source](../source/index.md)의 11-02 백업을 앱 컨테이너의 `Documents/SQLite/noline.db`에 덮어썼다. SHA-256이 기록과 같은 것을 확인했다.
  - 덮어쓰기 전 시뮬레이터 DB는 따로 저장했다. 그 큐에는 경비 CREATE(FAILED, 3)와 UPDATE만 있었다.
- **IN_PROGRESS 조합**
  - 큐 세 번째 작업(일정 CREATE `01M6DBXS…YQZX`)의 상태를 PENDING에서 IN_PROGRESS로 바꿨다.
  - 같은 일정 행을 로컬 서버 DB에 미리 넣었다. "요청은 서버에 닿았지만 응답 전에 앱이 꺼진" 경우를 흉내 냈다. 생성 재전송(Ticket 01)과 되돌림(Ticket 02)을 함께 지나게 하는 조합이다.
- **시작 상태**

  | 대상 | 상태 |
  | --- | --- |
  | 큐 | 경비 CREATE FAILED/3 → 경비 UPDATE PENDING → 일정 CREATE IN_PROGRESS |
  | 서버 경비 | amount 19, version 1 |
  | 서버 일정 | 1행 |

## 관찰 (Main, 12:33Z 실행)

앱 시작 직후 한 번의 동기화(`reason: conditions-ready`)에서 다음이 일어났다. 아래는 Metro 로그를 발췌한 것이다.

```text
 INFO  [Sync] started {"reason": "conditions-ready"}
 LOG  [Sync] Starting push: 3 tasks
 LOG  [Sync] Processing: CREATE expenses/01M68GTCQ49AKVY8A01VWE488M
 LOG  [Sync API] Success 200
 LOG  [Sync API] Success 200
 LOG  [SyncQueue] Task 01M68GTCQ9AGZX2GHDGH1N95AK deleted (synced successfully)
 LOG  [Sync] Processing: UPDATE expenses/01M68GTCQ49AKVY8A01VWE488M
 LOG  [Sync API] Success 200
 LOG  [Sync] Processing: CREATE schedules/01M6DBXS075XYXRF8Z8QRZYQZX
 LOG  [Sync API] Success 200
 LOG  [SyncQueue] Sync Queue Stats: {"failed": 0, "inProgress": 0, "pending": 0, "total": 0}
 LOG  [Sync] Starting pull... {"activatedTripIds": ["01M3RVD3X9VSV0M44TET19H5DS"], ...}
 LOG  [Sync] Received from server: {"expenses": 3, "schedules": 1, ...}
 LOG  [Sync] Pull completed
 INFO  [Sync] completed {"durationMs": 322, "reason": "conditions-ready", ...}
```

같은 시간의 서버 로그는 `POST /api/expenses`, `POST /api/auth/refresh`, `POST /api/expenses`, `PUT /api/expenses/…`, `POST /api/schedules`, `GET /api/sync/pull` 순서다. 서버 로그에는 method와 path만 남고 상태 코드가 없다.

- **큐:** 0건이 됐다.
- **서버 경비:** amount 20, version 2다. 뒤의 UPDATE까지 반영됐다.
- **서버 일정:** 1행이고 `created_at`은 넣을 때의 값이다. 중복 행이 생기지 않았다.
- **IN_PROGRESS 되돌림:** 되돌림 자체를 남기는 로그는 없다. 대신 수정 전 선택 규칙이었다면 맨 앞 FAILED/3에서 막혀 `Starting push`가 나오지 않았을 것이다. 로그는 3 tasks였고, 세 번째 작업이 다시 IN_PROGRESS를 거쳐 삭제됐다.
- **첫 CREATE 앞뒤의 `Success 200` 두 줄:** 서버 로그에 refresh가 끼어 있다. 그래서 첫 요청은 인증 갱신 경로를 지난 것으로 보이지만, 어느 줄이 어느 요청인지 분리되지 않는다. 아래 검증자의 재실행에서는 요청마다 한 줄씩이었다.

## 동기화 시작 횟수

12:33Z부터 약 4분 동안 `[Sync] started`는 1번이었다. 그동안 앱을 2분 그대로 두었고, 홈으로 보냈다가 다시 열었다.

코드를 읽어 확인한 시작 계기는 다음과 같다. 검증자도 같은 결론이다.
- [provider.tsx](../../../../../apps/client/src/shared/services/sync/provider.tsx)가 실행 조건이 false에서 true로 바뀌는 순간에 시작한다. 실행 조건은 인증 status, sessionId, 실제 연결 상태, override, 일시 중단이다.
- 디버그 화면의 수동 실행이 있다.
- 5분 주기 sync 코드는 있지만 기본으로 꺼져 있다. `app/_layout.tsx`가 prop 없이 쓴다.
- 앱 복귀는 연결 상태의 `refresh()`만 부른다. 상태가 offline이나 unknown을 거쳐 online으로 돌아올 때만 동기화가 시작된다.

**판단 (Main):**
- 한도 제거의 비용은 "실행 조건이 새로 갖춰질 때마다 요청 1건"(5xx면 최대 4건)이다. 개선 검토에서 보류한 간격 재시도는 지금 두지 않는다. 연결 회복 뒤 전송을 늦추는 손해가 더 크다.
- sync 계기를 늘리거나 주기 sync를 켤 때 다시 판단한다. 이 내용을 [데이터 수명](../../../../project/guidance/data-lifecycle/INDEX.md#push를-바꾸면-전송-상태와-두-종류의-재시도를-구별한다)과 [Spec 02](../current/memory/spec/02-behavior-and-cases.md)에 반영했다.
- 10-31의 "57초 안에 실패 3번"은 조건 전환이 세 번 있었다는 뜻이다. 원인은 당시 로그가 없어 확인하지 못했다.

**같은 날 정정 (사용자 지적 뒤):**

위 판단은 근거보다 앞서 나갔다. 사용자는 이렇게 물었다.

> "근데 빈도는 여전히 염두해두어야 하는거 아닌가? 지금은 괜찮았다 할지라도 아직 정확히 모르잖아"

정정 내용은 다음과 같다.
- 4분 관찰은 연결이 안정적인 시뮬레이터에서 숨은 반복 실행이 없다는 것만 보여 준다. 이 앱이 겨냥하는 상황은 연결이 자주 끊기는 여행이고, 그때 조건이 얼마나 자주 새로 갖춰지는지는 측정하지 않았다. 10-31의 원인도 모른다.
- 그래서 "비용이 작다"는 근거가 없다. 간격 재시도는 거절이 아니라 보류다. 보류하는 이유는 그대로다. 연결 회복 뒤 전송이 늦어지는 손해는 확실하고, 헛요청의 크기는 모른다.
- 헛요청이 늘어도 데이터가 망가지지는 않는다. 배터리·데이터·서버 부하가 늘 뿐이다.
- 다시 볼 조건을 붙였다.
  - 실제 sync 시작 횟수를 얻었을 때. 예를 들어 Ticket 06에서 시작 이유·횟수를 함께 남길 때다.
  - 실제 사용에서 같은 작업의 실패가 자주 반복될 때
  - sync 계기를 늘릴 때

데이터 수명, Spec 02, Ticket 02·03·06, state를 이 뜻으로 고쳤다. 위 문단은 당시 판단으로 남긴다.

## 독립 검증 (Sonnet medium, 구현에 참여하지 않은 새 컨텍스트)

검증자는 저장소 파일을 고치지 않았다. 시뮬레이터 DB와 로컬 개발 서버 DB는 재실행 때문에 바뀌었다.

- **Main 증거 판독:** Main의 읽기와 같았다. 200은 앱 로그(`api.ts`의 `Success <status>`)로만 직접 증거가 된다. 서버 로그에는 상태 코드가 없다.
- **독립 재실행 (12:39Z):** 준비한 같은 DB를 다시 넣고 앱을 실행했다.
  - 동기화 시작은 1번이었다. 세 작업이 각각 `Success 200`으로 끝났고 refresh 호출은 없었다. 이어서 pull이 돌았고 큐는 0건이 됐다.
  - 서버 일정은 1행을 유지했다. 경비는 version 3이 됐다. 같은 UPDATE 재전송이 version만 올리는 것은 Spec 02와 API 계약에 이미 적힌 동작이다.
  - 이번에는 세 요청 모두 이미 반영된 상태에 대한 재전송이다. 수정 전 서버가 500을 내던 상황과의 대조는 아니다.
- **HEAD 검사 재실행:** 결과는 아래와 같다. build는 실행하지 않았다.

  | 검사 | 결과 |
  | --- | --- |
  | 서버 typecheck | 통과 |
  | 서버 단위 테스트 | 69개 통과 |
  | 서버 PostgreSQL 통합 테스트 | 21개 통과. 별도 compose DB를 썼다. |
  | client Jest | 655개 통과 |

- **판정:**
  - **충족 근거 있음:** Ticket 01·02·03의 완료 조건 대부분이 해당한다. 문서와 동작의 일치도 포함한다.
  - **미확인:** "서버 수정을 되돌리면 같은 증상으로 실패한다"이다. 저장소를 고치지 않는 역할이라 되돌려 보지 않았다. Main의 [11-03 자기 확인](2026-11-03-03-stage-one-implementation.md#main의-자기-확인)만 근거다.
  - **불충족 근거 있음:**
    - client typecheck: 이전부터 실패하던 8건이다.
    - Spec 02의 "Ticket 03에서 센다" 문장: 이 기록과 함께 고쳤다.
- **발견:** Spec 02 46행이 낡았다는 점(중간), Ticket 03 상태가 "실행 전"으로 남은 점(낮음)이다. 증거가 임시 폴더에 있으니 핵심 로그를 Workspace에 보존하라는 권고도 있었다. 셋 모두 이 기록과 함께 반영했다. 위 로그 발췌가 그 보존이다.

## 제품 Verify

[verify.json](../verify.json)의 claim을 서버 재전송 route 단위 테스트로 바꿨다.
- **고정 argv:** `node node_modules/vitest/vitest.mjs run --root apps/server tests/routes/replay.idempotency.test.ts`. 저장소 루트에서 Docker 없이 결정적으로 돈다.
- **claim의 한계:** 다음은 증명하지 않는다고 claim에 적었다.
  - 실제 PostgreSQL의 충돌 처리
  - 앱 큐의 되돌림
  - 실제 앱 경로
  통합 테스트는 compose DB를 띄우는 스크립트라 저장소 루트의 고정 argv에 맞지 않는다. 클라이언트 테스트는 다른 runner라 함께 넣지 못했다.
- **선택 이유:** 다음 단계(Ticket 05)가 서버 배포를 먼저 하기 때문이다. 서버 재전송 경로가 바뀌었는지를 Recover의 freshness가 알려 주는 쪽이 쓸모가 크다.
- **실행 결과:** 12:42Z에 `verification_passed`였다. receipt는 [records/receipts/verify/](receipts/verify/)에 있다. receipt 디렉터리가 없어 처음 실행이 거부됐고, 디렉터리를 만든 뒤 다시 실행했다.

## 증명하지 않은 것

- 수정 전 서버와의 대조: 실제 앱 경로에서 500이 200으로 바뀌는 것을 직접 비교하지 않았다.
- 실제 앱의 실패 경로: 실패하면 그 자리에서 멈추는 것과 인증 오류 경로는 Jest 근거만 있다.
- 실제 응답 유실: 앱이 실제로 종료돼 응답을 잃는 경우를 재현하지 않았다. 서버 행을 미리 넣어 흉내 냈다.
- 이전 실행: 운영 서버, build 13, TestFlight는 Ticket 05에서 다룬다.

## 원자료 위치

다음 원자료는 세션 scratchpad `t03/`에 있다. 임시 폴더라 지워질 수 있으며, 판단에 필요한 발췌는 위에 남겼다.
- `metro.log`, `server.log`
- `queue-before.txt`, `server-before.txt`
- `sim-db-before-t03.db`, `sim-db-seeded.db`
