# 09. 2〜7단계 코드를 실제 선택의 근거까지 확인하고 정리하기

## 맡은 결과와 범위

이미 구현한 007-07·003-12의 2〜7단계를 한 단계씩 실제 코드로 다시 읽고, 동작·책임·표현을 더 간결하게 할 부분과 유지할 보장을 근거로 판별한다. 필요한 수정·정리를 독립 검토/검증하고 사용자가 코드와 선택 이유를 이해해 다음 지시를 할 수 있게 설명한다. 단순 재검사 통과나 관점 목록 작성만으로 끝내지 않는다.

[선행 2〜7단계 기록](../../../records/2026-11-12-02-staged-review-followups.md)의 high 검토·수정·검증 완료는 유지한다. 후속 2단계 수신 코드의 예비 읽기는 시작했으나, 사용자가 1단계 대화를 Main이 직접 재판단하라고 정정해 보류했다. 이후 1단계에서 진행한 것과 동등한 개별 코드 설명·질문·수정의 후속 검토는 아직 완료하지 않았다. 선행 완료를 취소하거나 기존 정책을 다시 정하는 일이 아니다. [007-07](07-conflict-rule-and-cleanup.md)은 충돌/큐 종결, [003-12](../../../../003-bug-investigation-and-fixes/current/memory/tickets/12-pull-consistency.md)는 pull 무누락·수신 중 pending 보호를 계속 소유한다.

[009의 검토·판단 루프 개선](../../../../009-development-review-improvement/current/memory/tickets/01-stage-one-review-and-judgment-loop.md)은 별도 목표다. 그 결과를 기다리지 않고 코드를 확인할 수 있으며 여기서 스킬·Personal·Project의 규칙을 임의로 바꾸지 않는다.

## 실행 맥락과 접근

### 재개할 때 먼저 복원할 것

1단계 커밋은 8f94af5c, 부모는 경로 커밋 a527e977다. [분리 기록](../../../records/2026-11-12-10-stage-one-isolated-commit.md)에서 포함·제외와 검사(789·독립37·기존 서버73)를 확인한다. workingtree에는 후속 2〜7단계와 다른 사람 변경이 남아 있으므로 HEAD만 읽고 전체 구현이 없다고 판단하거나 전체 reset/복사본 덮어쓰기/일괄 stage하지 않는다. 전체 workingtree의 892 등과 분리판 검사를 섞지 않는다.

[새 실행 합의](../../../records/2026-11-12-12-workflow-application-agreement.md)를 읽고 적용한다. 사용자는 앞선 대화까지 다시 판단한 종합을 앞으로의 작업에 적용하되 스킬은 직접 수정하지 말라고 승인했다. 판단 가능한 작업 분할, 요구와 현재 구현의 구별, 공식 문서·설치 버전을 먼저 쓰는 설계, 같은 선택에 대한 소비자·기존 유틸·Project·Personal 적용, 첫 구현의 세부 품질을 이어간다. 독립 검토와 Main의 채택 책임은 유지하고 요구에서 검사 기대값을 도출한다. 설명 뒤 전제가 바뀌면 관련 코드·검사까지 추적하며 검증판과 전달·커밋판을 맞춘다. 새 고정 체크리스트나 모든 API의 전수조사로 확대하지 않는다.

[선행 판단 과정 기록](../../../records/2026-11-12-11-stage-one-judgment-and-next-tickets.md)과 [중앙 원문](../../../source/2026-11-12-stage-one-review-dialogue.md)은 당시 종합의 아쉬움과 정정 근거를 재확인할 때 읽는다. 새 합의의 채택을 과거 Main 종합·self-check 해석 전체의 승인이나 개선 효과 검증으로 소급하지 않는다.

제품 기준은 [현재 저장소 진입](../../../../../../../CLAUDE.md)의 주제별 안내와 [Project README](../../../../../../project/README.md)·[읽기와 적용](../../../../../../project/REFERENCE/reading.md)에서 고른다. 첫 2단계는 [데이터 저장·동기화·정리](../../../../../../project/guidance/data-lifecycle/INDEX.md)의 수락 서버 원본·미전송 보호·push/pull 계약을 실제 수신 경로와 대조한다. 단계가 바뀌면 현재 Project의 세션·여행 접근·API·오류 전달 본문을 해당 질문에 맞춰 확장하고, 원래 두 Ticket의 선택·예외도 함께 읽는다. Personal은 실제 이름·표현·책임 선택에 필요한 본문을 적용한다. 라이브러리 동작이 근거라면 공식 문서와 설치 버전·타입/구현을 대조하고, 불분명한 부분만 실제 사용 조건의 작은 재현으로 확인한다. 읽었다는 보고와 코드 판단에 적용한 결과를 구별한다.

### 단계별 코드 진입과 근거 선택

번호는 설명 구획이다. 실제 push 후 pull·활성화/직접 조회가 겹칠 수 있으므로 고정 실행 순서로 해석하지 않는다.

| 단계 | 확인할 실제 연결 | 필요한 선행 근거 |
| --- | --- | --- |
| 2 서버 변경 수신 | [reconcile](../../../../../../../apps/client/src/shared/services/sync/reconcile.ts)·[server-state](../../../../../../../apps/client/src/shared/services/sync/server-state.ts)·[DB upsert](../../../../../../../apps/client/src/shared/db/utils.ts)의 수락 원본/표시값·raw pending 투영·조회 연결 | 02 기록의 2단계; reconciliation·response-freshness 검사 |
| 3 조회 범위 | [서버 pull](../../../../../../../apps/server/src/routes/sync.ts) → [client pull](../../../../../../../apps/client/src/shared/services/sync/engine.ts)·[cursor](../../../../../../../apps/client/src/shared/services/sync/storage.ts)·[활성화](../../../../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)의 snapshot/XID·사본 수명·세션·원자성 | 02의 3단계, 11월10일 후속 기록의 지연 pull; 실제 PG cursor 검사 |
| 4 전송·서버 판정 | [engine](../../../../../../../apps/client/src/shared/services/sync/engine.ts)·[queue](../../../../../../../apps/client/src/shared/services/sync/queue.ts) → [서버 mutation](../../../../../../../apps/server/src/services/entity-mutations.ts)·[표식 계약](../../../../../../../packages/schema/src/sync/field-edits.ts)의 FIFO·고정 표식·같은 값/동률/그룹·소유 잠금 | 02의 4단계; SQLite→REST/PG 응답 유실·재전송 |
| 5 응답·완료 | engine의 applyPushResponse → reconcile의 후속 pending·해당 task ACK·rollback·query-refresh | 02의 5단계; 30응답중35저장·wrong id/owner·ACK 실패 |
| 6 호환·삭제 | [direct-update-failure](../../../../../../../apps/client/src/shared/services/sync/direct-update-failure.ts)·[보류 입력](../../../../../../../apps/client/src/shared/services/sync/legacy-holds.ts)·reconcile·[복구 UI](../../../../../../../apps/client/src/features/sync-recovery/LegacyUpdateRecovery.tsx)·서버 mutation의 증거/보존/사용자 선택 | 02의 6단계·007-07 정책; raw404/410·모순 귀속·삭제 도착 양 순서 |
| 7 검증·진단 | engine → [Sentry](../../../../../../../apps/client/src/shared/diagnostics/sentry.ts)·[필터](../../../../../../../apps/client/src/shared/diagnostics/sanitize-sentry-event.ts)의 정상/해결/중단·중복·민감값·실행 수명 | 02의 7단계; 이중 Local 실패·REST→capture/필터 |

표의 02는 [단계별 선행 기록](../../../records/2026-11-12-02-staged-review-followups.md), 11월10일 후속은 [정리 뒤 지연 응답 등 보완](../../../records/2026-11-10-05-conflict-pull-review-fixes.md)다. 기본으로 모든 과거 자료를 읽기보다 해당 선택의 이유·반례를 확인할 절만 선택한다.

### 첫 행동과 단계 전환

다음 세션은 **2단계부터** 시작한다. 현재 diff와 수신 코드의 호출·데이터 수명을 읽고 서버 원본/화면 표시를 나누는 이유·pending 원문 보존·실패 rollback이 어디서 함께 성립하는지 복원한다. 선행 유지 결론을 검토하지 않은 정답으로 반복하지 않는다.

한 단계의 실제 선택을 필요한 소비자까지 연결해 확인한 뒤 이득이 있는 수정만 반영한다. 정리할 필요가 없으면 유지 이유·보장을 남긴다. 독립 reviewer는 선택·범위·실제 경로를, verifier는 요구에 맞는 실행 근거·한계를 확인한다. 현재 development·관련 역할의 적용 계약과 사용자 요청에 따라 배정하며 자기 검사를 독립 검사라고 부르지 않는다.

코드·이유·검사·남은 한계를 사용자에게 설명하고 해당 단계 결과를 남긴 뒤 다음 단계로 이동한다. 설명은 이미 고른 구현을 납득시키는 과정이 아니라 전제를 다시 확인할 수 있는 자리다. 구현을 따라 기대값을 맞추는 것과 실제 사용자/실행 경계를 검증하는 것을 구별한다.

## 완료 조건과 확인 방법

- 2〜7 각 단계의 실제 판단/실행 경로와 요구·보존 계약을 확인하고 필요한 수정/정리 또는 유지 이유가 근거로 남는다. 후속 수행·독립 검토·검증·사용자 설명을 구별한다.
- 필요 이상으로 넓힌 요구·공통 장치·조건·wrapper는 대안과 소비자를 비교한다. API 검증/Local 변환/트랜잭션처럼 다른 이유의 처리를 모양만 같다고 합치지 않는다.
- 수정 결과는 실제 사용자 이벤트와 강제 경계 주입을 구별한 검사로 확인한다. 입력 원문·FIFO·time/sequence/id·그룹·호환·삭제/소유권·cursor/pending 계약은 보존하며 정책 변경이 필요하면 사용자 결정과 연결한다.
- 한 단계의 범위를 닫고 설명한 뒤 다음으로 이어가며 마지막에는 연결부와 현재 diff의 적절한 회귀를 확인한다. 선행 검사 수·다른 판본 통과를 새 결과로 재사용하지 않는다.
- native 수정창·Keychain·Mapbox/live Directions·실서버/Cloud의 미확인은 별도로 남긴다. 자동 검사로 확대하지 않는다. 사용자 수락·커밋·push·SQL→서버→앱 배포도 별도 결과다.
- 루프 개선 Ticket은 이 코드 Ticket의 착수/완료 선행 조건이 아니다. 관련 개선 제안은 이 결과에 실제 필요한 근거를 보고 적용한다.

## 현재 상태와 실제 결과

2단계 예비 코드 읽기 뒤 사용자 정정으로 1단계 대화의 직접 재판단을 먼저 진행했다. 그 결과 앞으로의 작업에 적용할 실행 방식을 합의했고 기록 정리·커밋을 승인받았다. **2단계 후속 검토는 보류한 읽기부터 재개해야 하며, 이번 대화에서 제품 수정·제품 테스트·독립 코드 리뷰·검증은 하지 않았다.** 스킬 직접 수정·009 완료·개선 효과 확인은 이번 결과가 아니다. 선행 high 검토·수정·검증과 원래 007-07·003-12 정책은 유지한다. 남은 native 실행·배포를 문서 작성으로 완료 처리하지 않는다.
