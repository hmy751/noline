# 007 — 동기화 실패가 큐를 영구히 막지 않게 하기 재개

4단계 전송·서버 판정의 코드·검사·필수 저장 계약 **22파일을 e994171c로 분리 커밋**했다. 후보 client72개·server73개, schema build와 독립 감사(필수 수정0)를 확인했다. server 타입은 통과했고 client 기존7오류는 남는다. 별도 PostgreSQL 검사는 pnpm 준비 문제로 실행 전에 실패했고 임시 자원은 정리했다. 추가 검사·재시도 없이 커밋을 마무리했으며 새 PG 통과를 주장하지 않는다. [4단계 분리 기록](records/2026-11-13-15-stage-four-isolated-commit.md)에서 포함·제외와 한계를 확인한다. 관련 문서는 별도로 선별하며5〜7단계 후속과 전체 가독성 기록·산출물은 미커밋으로 보존한다. **다음은5단계 설명 대기**다.3단계 제품941e8557·기록904202f9는 완료됐다.

3단계 코드는 **941e8557**로 분리 커밋했다. HEAD 8ab15b33 위 코드·검사 14파일이며 후보판 client 147개·server 73개 통과와 독립 범위 감사를 확인했다. 관련 기록도904202f9로 분리 커밋했다. 당시4〜7단계 코드는 미커밋이었고 현재4단계도 e994171c로 분리했다.5〜7단계와 전체 가독성 기록·산출물은 미커밋으로 보존한다. [분리 범위·검증·선택 이유](records/2026-11-13-14-stage-three-isolated-commit.md)에서 이어 확인한다. 이후4단계 상세 설명을 제공했고 현재4단계 코드는 e994171c로 커밋했고 다음은5단계 설명이다.

[Ticket09](current/memory/tickets/09-staged-code-review-and-refinement.md)의 **3〜7단계 순차 보완 검토·수정·독립 검증·단계별 설명과 마지막 연결 회귀를 완료**했다. [3단계 후속](records/2026-11-13-08-stage-three-consumer-and-expression-rereview.md)에서 활성화 반환과 실제 소비자·검사의 차이를, [4〜7단계 최종 후속](records/2026-11-13-09-stages-four-through-seven-sequential-rereview.md)에서 유지·변경 대안과 중복 보류 알림 수정, 최종 client309·재사용 서버39/독립PG22의 범위를 확인한다.

[완료 판단 정정](records/2026-11-13-07-review-depth-and-completion-correction.md)은 유지한다. 이번 완료는 각 선택을 다시 비교하고 확인한 결과이며 과거 수행의 충분성을 소급 승인한 것이 아니다. “단계별”은 결과를 닫고 계속 진행하는 뜻으로 정정했다. 후속 기록·안내 9문서는 bf1e13b1로 선별 커밋했다. 당시 제품 코드는 미커밋이었다. 현재 3단계는 941e8557이며 나머지 제품 선별 커밋·사용자 최종 수락·배포는 별도다.

코드·결과 설명을 이어갈 때는 [실제 코드를 함께 검토하기 위한 설명 참고](records/2026-11-13-10-code-explanation-as-shared-review.md)를 읽는다. 3단계의 목적과 핵심 동작 설명을 마쳤고 사용자는 문답에서 항목별 이해를 명시했다. [reconcile 이해 과정](records/2026-11-13-11-reconcile-understanding-and-explanation-gaps.md)은 Local 보존·B 추가 시점·표현 정정을, [pull 경계 이해 과정](records/2026-11-13-12-pull-boundaries-and-understanding.md)은 기존 증분 조회의 누락·DB 경계와 반복 비용·기기 반영 조건을 다시 볼 때 읽는다. 모든 세부 분기 이해나 제품 수락·설명 효과 입증으로 확대하지 않는다. 당시4단계는 분량 안내만 했으며 이후 전송 순서·고정 표식 재전송·서버 항목별 판정의 상세 설명을 제공했다. 앞선 설명 기록은 8ab15b33으로 커밋했다. 3단계 관련 기록은904202f9로 완료했고 현재는4단계 관련 기록을 별도로 선별한다.

[1단계 실행 합의](records/2026-11-12-12-workflow-application-agreement.md)는 유지한다. 사용자는 2단계 새 판단 가운데 구체적 보존 결과, 동작 필요성과 표현 품질의 별도 판단, 책임에 따른 중복 판별, 사건·권한·효과를 잇는 설명을 기존 역할과 판단 시점에 더해 적용하도록 승인했다. 마무리 피드백은 제외한다. 적용 범위와 원문은 [3단계 기록](records/2026-11-13-05-stage-three-pull-review.md#기존-워크플로에-더해-적용한-판단)을 읽는다. 스킬·Personal·Project 규칙 변경이나 009 완료가 아니다.

2단계 제품은 **44d2a5ef**, 완료 기록은 **9f3e87f2**, 후속 검토·정정 기록과 안내는 **945922fe**로 커밋했다. 후속 3〜7단계 재검토 결과와 설명 참고 9문서는 **bf1e13b1**로 커밋했으며 당시 3〜7단계 제품 보완은 미커밋이었다. 현재 3단계는 941e8557로 분리했고 당시4〜7단계는 미커밋이었다. 현재4단계도 e994171c로 분리했고5〜7단계는 미커밋이다. [2단계 개발 판단 기록](records/2026-11-13-04-stage-two-judgment-and-handoff.md)은 당시 해석과 관찰의 재검토 자료이며 모든 종합을 정답으로 이어받지 않는다.

마지막 제품 코드 기준은4단계 e994171c이며3단계는941e8557,2단계는44d2a5ef다. 후속 단계와 다른 작업의 dirty 내용은 남아 있으므로 HEAD만 보고 전체 구현이 없다고 판단하거나 일괄 stage·reset·복사본 덮어쓰기를 하지 않는다. 단계 번호는 설명 구획이며 고정 실행 순서가 아니다.

007 Ticket 07·003 Ticket 12의 선행 전체 구현·검증 근거는 [11월 10일 후속 보완](records/2026-11-10-05-conflict-pull-review-fixes.md)에서 필요한 범위만 확인한다. SQL → 서버 → 앱 배포는 여전히 미실행이다.

[Ticket 06](current/memory/tickets/06-stalled-sync-visibility.md)의 [실제 Sentry 프로젝트 수신·설정](records/2026-11-10-01-sentry-staging.md) 이후 단계다. 실제 JS 예외의 파일·행은 복원됐다. 인증 갱신과 서버 거절을 구별하는 수정판의 자동·독립 검증 및 최신 앱·서버 staging 이벤트와 trace는 [개발 재점검 기록](records/2026-11-10-02-diagnostics-review.md)에서 확인한다. 신규 이벤트에서 IP는 보이지 않았지만 도시가 계속 표시된다. 반복 경고 전용 알림 규칙은 미설정이다. [Release 빌드와 로컬 수신 기록](records/2026-11-09-01-sentry-local-receiver.md)에서 이미 확인한 오프라인 격리·계정 전환·중단 조건과 운영 환경에 남은 범위를 확인한다.

일반 재개는 [목표와 범위](current/memory/spec/01-problem-goal-scope.md), [현재 상태와 다음 행동](current/state/index.md), [산출물 위치](output/index.md)를 읽는다. 한정 요청은 해당 자료부터 본다.

원본 없는 요청의 격리와 여행 비활성화·기기 DB 초기화의 보존 범위를 확인할 때는 완료된 [Ticket 08](current/memory/tickets/08-orphaned-queue-task-blocks-login.md)에서 해당 대목을 읽는다.

특정 실행의 합의는 [Ticket 색인](current/memory/tickets/index.md), 과거 선택·검사 근거는 [기록 색인](records/README.md)에서 해당 항목만 선택한다. 제품·개발 기준은 [이 작업의 Project 선택](current/memory/project-context.md)에서 해당 주제와 이유를 찾아 읽는다.

검증 요청은 [품질·완료 기준](current/memory/spec/04-quality-and-completion.md)에서 주장과 범위를 확인한다. 기존 직접 검사의 저장소 루트 명령은 `node node_modules/vitest/vitest.mjs run --root apps/server tests/routes/replay.idempotency.test.ts`다. 실행 전에 현재 도구·입력·환경을 대조하고 실제 결과만 기록한다.

선택지 비교와 받아들인 비용은 [설계 판단 기록](records/2026-11-03-01-sync-failure-design-decisions.md), 사고의 관찰 근거는 [관찰 기록](records/2026-11-02-01-simulator-sync-block-observation.md), 사용자 발화 원문은 [source](source/index.md)에서 찾는다.

과거 문서 전용 커밋 승인은 당시 범위다. 이후 1·2·3단계 코드는 각각 사용자의 승인으로 분리 커밋했고당시4〜7단계는 미커밋이었다. 현재4단계도 e994171c로 분리했고5〜7단계는 미커밋이다. 다음 커밋도 Main이 범위를 선별한다.
