# 007 — 동기화 실패가 큐를 영구히 막지 않게 하기 재개

2단계 서버 수신 코드의 분리 커밋은 **44d2a5ef**로 완료됐다. 다음은 [Ticket09](current/memory/tickets/09-staged-code-review-and-refinement.md)의 **3단계 조회 범위·cursor·사본 수명**이며 아직 착수하지 않았다. 현재 결과와 검증 범위는 [state](current/state/index.md), 분리 경계는 [커밋 준비 기록](records/2026-11-13-03-stage-two-isolated-commit.md)에서 확인한다. 해당 기록의 실행 대기 이후 실제 커밋 확인은 아래 판단 기록에 연결했다.

다음 단계의 접근을 검토할 때 [2단계 개발 판단과 재검토 자료](records/2026-11-13-04-stage-two-judgment-and-handoff.md)를 참고할 수 있다. 이 기록의 종합은 당시 Main의 해석·선택이며 다음 세션의 정답이나 새 실행 규칙이 아니다. 사용자 원문·현재 요구·실제 코드·공식 근거를 직접 대조해 다시 판단하고, 필요하면 해석을 수정하거나 기각한다. 명시적 사용자 합의와 확인된 사실은 해석·제안과 구별한다.

[앞으로의 작업에 적용할 실행 합의](records/2026-11-12-12-workflow-application-agreement.md)는 계속 유효하다. 공식 문서·설치본과 요구·실제 소비자를 같은 선택의 근거로 연결한다. 스킬 직접 수정·Personal 기준 채택이나 009 개선 완료를 뜻하지 않는다.

마지막 제품 코드 기준은 44d2a5ef다. 후속 단계와 다른 작업의 dirty 내용은 남아 있으므로 HEAD만 보고 전체 구현이 없다고 판단하거나 일괄 stage·reset·복사본 덮어쓰기를 하지 않는다. 단계 번호는 설명 구획이며 고정 실행 순서가 아니다.

007 Ticket 07·003 Ticket 12의 선행 전체 구현·검증 근거는 [11월 10일 후속 보완](records/2026-11-10-05-conflict-pull-review-fixes.md)에서 필요한 범위만 확인한다. SQL → 서버 → 앱 배포는 여전히 미실행이다.

[Ticket 06](current/memory/tickets/06-stalled-sync-visibility.md)의 [실제 Sentry 프로젝트 수신·설정](records/2026-11-10-01-sentry-staging.md) 이후 단계다. 실제 JS 예외의 파일·행은 복원됐다. 인증 갱신과 서버 거절을 구별하는 수정판의 자동·독립 검증 및 최신 앱·서버 staging 이벤트와 trace는 [개발 재점검 기록](records/2026-11-10-02-diagnostics-review.md)에서 확인한다. 신규 이벤트에서 IP는 보이지 않았지만 도시가 계속 표시된다. 반복 경고 전용 알림 규칙은 미설정이다. [Release 빌드와 로컬 수신 기록](records/2026-11-09-01-sentry-local-receiver.md)에서 이미 확인한 오프라인 격리·계정 전환·중단 조건과 운영 환경에 남은 범위를 확인한다.

일반 재개는 [목표와 범위](current/memory/spec/01-problem-goal-scope.md), [현재 상태와 다음 행동](current/state/index.md), [산출물 위치](output/index.md)를 읽는다. 한정 요청은 해당 자료부터 본다.

원본 없는 요청의 격리와 여행 비활성화·기기 DB 초기화의 보존 범위를 확인할 때는 완료된 [Ticket 08](current/memory/tickets/08-orphaned-queue-task-blocks-login.md)에서 해당 대목을 읽는다.

특정 실행의 합의는 [Ticket 색인](current/memory/tickets/index.md), 과거 선택·검사 근거는 [기록 색인](records/README.md)에서 해당 항목만 선택한다. 제품·개발 기준은 [이 작업의 Project 선택](current/memory/project-context.md)에서 해당 주제와 이유를 찾아 읽는다.

검증 요청은 [품질·완료 기준](current/memory/spec/04-quality-and-completion.md)에서 주장과 범위를 확인한다. 기존 직접 검사의 저장소 루트 명령은 `node node_modules/vitest/vitest.mjs run --root apps/server tests/routes/replay.idempotency.test.ts`다. 실행 전에 현재 도구·입력·환경을 대조하고 실제 결과만 기록한다.

선택지 비교와 받아들인 비용은 [설계 판단 기록](records/2026-11-03-01-sync-failure-design-decisions.md), 사고의 관찰 근거는 [관찰 기록](records/2026-11-02-01-simulator-sync-block-observation.md), 사용자 발화 원문은 [source](source/index.md)에서 찾는다.

과거 문서 전용 커밋 승인은 당시 범위다. 이후 1·2단계 코드는 각각 사용자의 승인으로 분리 커밋했으며 후속 단계는 아직 미커밋이다. 다음 커밋도 Main이 범위를 선별한다.
