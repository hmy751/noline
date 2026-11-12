# 007 — 동기화 실패가 큐를 영구히 막지 않게 하기 재개

다음 세션은 [007 Ticket 09](current/memory/tickets/09-staged-code-review-and-refinement.md)에서 시작한다. **2단계부터 실제 코드 확인→필요 수정/정리→독립 리뷰·검증→사용자 코드 설명**을 한 단계씩 이어간다. 선행 high 완료는 유지하되 이 후속 개별 검토는 미착수다. [판단 과정과 열린 종합](records/2026-11-12-11-stage-one-judgment-and-next-tickets.md) 및 중앙 원문으로 마지막 아쉬움·잠정 감사 해석을 복원하고 승인된 규칙으로 답습하지 않는다. 009 루프 개선과 독립 착수하며 기다리지 않는다.

마지막 제품 코드 기준 8f94af5c(경로 부모 a527e977)와 2〜7단계/다른 작업의 dirty 내용을 구별한다. 전체 reset·복사본 덮어쓰기·일괄 stage하지 않는다. 단계 번호는 설명 구획이며 고정 실행 순서가 아니다. 남은 native 확인·push·배포는 별도다.

007 Ticket 07·003 Ticket 12의 선행 전체 구현·검증 근거는 [11월 10일 후속 보완](records/2026-11-10-05-conflict-pull-review-fixes.md)에서 필요한 범위만 확인한다. SQL → 서버 → 앱 배포는 여전히 미실행이다.

[Ticket 06](current/memory/tickets/06-stalled-sync-visibility.md)의 [실제 Sentry 프로젝트 수신·설정](records/2026-11-10-01-sentry-staging.md) 이후 단계다. 실제 JS 예외의 파일·행은 복원됐다. 인증 갱신과 서버 거절을 구별하는 수정판의 자동·독립 검증 및 최신 앱·서버 staging 이벤트와 trace는 [개발 재점검 기록](records/2026-11-10-02-diagnostics-review.md)에서 확인한다. 신규 이벤트에서 IP는 보이지 않았지만 도시가 계속 표시된다. 반복 경고 전용 알림 규칙은 미설정이다. [Release 빌드와 로컬 수신 기록](records/2026-11-09-01-sentry-local-receiver.md)에서 이미 확인한 오프라인 격리·계정 전환·중단 조건과 운영 환경에 남은 범위를 확인한다.

일반 재개는 [목표와 범위](current/memory/spec/01-problem-goal-scope.md), [현재 상태와 다음 행동](current/state/index.md), [산출물 위치](output/index.md)를 읽는다. 한정 요청은 해당 자료부터 본다.

원본 없는 요청의 격리와 여행 비활성화·기기 DB 초기화의 보존 범위를 확인할 때는 완료된 [Ticket 08](current/memory/tickets/08-orphaned-queue-task-blocks-login.md)에서 해당 대목을 읽는다.

특정 실행의 합의는 [Ticket 색인](current/memory/tickets/index.md), 과거 선택·검사 근거는 [기록 색인](records/README.md)에서 해당 항목만 선택한다. 제품·개발 기준은 [이 작업의 Project 선택](current/memory/project-context.md)에서 해당 주제와 이유를 찾아 읽는다.

검증 요청은 [품질·완료 기준](current/memory/spec/04-quality-and-completion.md)에서 주장과 범위를 확인한다. 기존 직접 검사의 저장소 루트 명령은 `node node_modules/vitest/vitest.mjs run --root apps/server tests/routes/replay.idempotency.test.ts`다. 실행 전에 현재 도구·입력·환경을 대조하고 실제 결과만 기록한다.

선택지 비교와 받아들인 비용은 [설계 판단 기록](records/2026-11-03-01-sync-failure-design-decisions.md), 사고의 관찰 근거는 [관찰 기록](records/2026-11-02-01-simulator-sync-block-observation.md), 사용자 발화 원문은 [source](source/index.md)에서 찾는다.

사용자는 10171행에서 미검토 코드 작업부는 커밋하지 않고 기록·티켓·재개 안내 등 문서만 선별 커밋하도록 승인했다. 마지막 제품 코드 기준은 8f94af5c(경로 부모 a527e977)이며 이후 문서 전용 커밋으로 현재 HEAD는 달라질 수 있다. 새 세션은 실제 HEAD와 diff를 재확인하되 후속 2〜7단계 제품 코드는 검토 후로 남기고 일괄 stage·commit하지 않는다. 문서 선택·검사와 커밋 실행은 Main이 맡으며 이번 갱신 자체는 커밋 완료 보고가 아니다.
