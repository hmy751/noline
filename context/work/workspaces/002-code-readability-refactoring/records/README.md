# 작업 기록

- [초기 구성과 분석 항목 배치](2026-09-10-01-workspace-setup.md): 원자료를 선택한 이유, 이전 분석과의 대응, 현재 검증 기준의 한계.
- [구성 검토 결과](2026-09-10-02-creation-validation.md): 명시적 Recover, 계약·링크·원본 보존 확인과 독립 재진입 검토의 범위.

- [분석 내용 보존](2026-09-10-03-analysis-preservation.md): 원래 분석 경로의 향후 삭제를 전제로 한 원문 사본·읽기용 문서와 접근점 변경.

- [분석 보존 검증](2026-09-10-04-analysis-preservation-validation.md): 원문 일치·링크 외 본문 일치와 원래 경로 없는 재진입 확인.

- [Ticket 경계와 진행 방식 합의](2026-09-11-01-ticket-boundary-agreement.md): 개선 관점과 코드 범위의 관계, 질문의 오해와 정정, 범위별 검증·전체 주제 검토의 사용자 채택 및 records 보완 경위.

- [Ticket 03 테스트 전략과 설정 소유 범위](2026-09-11-02-storage-stats-test-strategy.md): 실제 hook 검증을 고른 이유, 대안별 tradeoff, 설정·디렉터리 선택과 monorepo 소유 경계.

- [Ticket 03 테스트 환경 구축 결과](2026-09-11-03-storage-stats-test-setup.md): client 소유 Jest 설정과 확정 버전, smoke 검증 결과, 실행 중 확인한 제약과 아직 입증하지 않은 범위.

- [Ticket 03 특성화 테스트와 저장 용량 리팩터링](2026-09-11-04-storage-stats-refactor.md): 에디터 진단에 맞춘 설정 보완, 변경 전 hook 계약, 같은 파일 안의 책임 분리와 React 최신 요청 처리, 검증 결과와 남은 한계.

- [Ticket 03 최초 적용 범위 재확인](2026-09-12-01-ticket-03-initial-scope-reanalysis.md): 원래 작업 로그에서 복원한 최초 적용 diff와 완료 주장, 이어진 사용자 정정, Ticket 범위와 개선 깊이 간격에 대한 재분석.

- [Fresh Main 기준의 Ticket 운영 문구 검토](2026-09-12-02-fresh-main-contract-review.md): 현재 맥락에 의존한다는 reviewer 지적, 첫 리뷰 반영 운영 문구 후보, 가상 사례의 fresh-Main 계획 결과와 실제 적용 전 한계.

- [AI 지침 명확성 기준을 적용한 Ticket 운영 문구 개정](2026-09-12-03-instruction-clarity-contract-revision.md): 명확성 reference의 목적·적용 조건·행동·제약 기준, 다시 작성한 전체 후보와 이전 후보 검증을 승계하지 않는 상태.

- [기능·결함·코드 개선에 공통 적용하는 Ticket 계약 후보](2026-09-12-04-generalized-ticket-contract-candidate.md): 코드 개선에 치우친 문안을 맡은 결과 완성 책임으로 일반화한 후보, 작업 유형별 적용과 reviewer 보고, 미채택·미검증 상태.

- [일반화한 Ticket 계약 후보의 fresh-Main 계획 검토](2026-09-12-05-generalized-candidate-fresh-main-review.md): 현재 후보만 받은 새 Main들의 다섯 사례 계획과 reviewer의 목표 해석·작업 발견·범위·완료 근거 판단, 계획 단계에 한정된 입증 범위.

- [대화 맥락 없는 새 세션의 Ticket 재구성 검토](2026-09-12-06-fresh-session-ticket-recomposition-review.md): 실제 Workspace의 남은 Ticket 재구성안, 저장된 기준에서 복원된 책임 범위, Main이 확인한 성과와 실행 전 보완할 세 간격.

- [지침 보완 범위 정정과 후속 반영](2026-09-12-07-guidance-scope-correction.md): Ticket 구성안을 직접 고치는 것으로 해석한 오류, 사용자의 공통 지침 보완 정정, 실행 기준·Ticket 작성 기준에 추가된 결과·분리·구성안 관계와 재검증 한계.

- [남은 Ticket 06–17 구성 확정](2026-09-12-08-remaining-ticket-definition.md): 보완된 공통 기준과 현재 Spec·코드에 따라 구현 전 생성한 남은 Ticket, 05 보존, 선행·차단 관계와 현재 미배정 범위.

- [서버 테스트 기반과 Schedule 응답 검증 방식 결정](2026-09-13-01-server-test-strategy.md): Vitest 4.1.11·Supertest 7.2.2 채택, Node/Jest 등 대안과 역할별 tradeoff, ESM mock·route 계약·PostgreSQL 통합 검사의 증명 경계.

- [서버 테스트 기반 구축과 Ticket 05 범위 확정](2026-09-13-02-server-test-setup.md): Node 20 호환 exact dependency·ESM mock·Express 계약 test의 실제 적용, 실행 결과·기존 typecheck 실패와 날짜 직렬화·schema·ownership 범위 확정.

- [Schedule 직렬화와 응답 계약 적용](2026-09-14-01-schedule-serialization-and-response-contract.md): 일곱 Schedule 소비 경로의 변경 전 특성화, 공통 serializer 책임, response schema 중복·누락 정리, activation Expense 계약 보정과 검증 한계.

- [Trip·Expense 직렬화 책임 분리](2026-09-14-02-trip-expense-serialization.md): Ticket 16에서 선행한 좁은 변환 조각, Trip 다섯 곳·Expense 여섯 곳의 공통 serializer 적용, 변경 전후 검사와 남은 response·ownership 경계.

- [Schedule 소유권·soft-delete 접근 경계](2026-09-14-03-schedule-access-boundary.md): 부모·자식 user scope, scoped mutation, 일반 조회와 sync 삭제 전파의 구분, 일회성 PostgreSQL 14 통합 검사와 검증 한계.

- [05 완료 뒤 남은 Ticket 점검과 장면 순서 재배치](2026-09-14-04-ticket-scene-reordering.md): 기존 06–17의 책임 보존, 새 앱 진입 06·저장 후 연결 보완, 현재 06–18 대응, 실제 선행 관계와 003 담당 연결. 이전 기록의 Ticket 번호는 이 대응으로 읽는다.

- [Project context 구성·읽기·갱신 방향 합의](2026-09-14-05-project-context-structure-reading-and-maintenance.md): 세 폴더 유지의 경위, 주제별 가이드와 common·guidance의 본문 소유, current의 관리비용과 열린 검증, 주제별 읽기·영향별 갱신, 읽기용 스킬·기준 reference의 후속 설계 방향.

- [외부 자료를 참고한 Project context 반영 기준과 재구성 검증 방향](2026-09-14-06-project-context-reference-insights-and-retest-direction.md): Matt·Peter 자료에서 참고한 내용 선별·분리·읽기 조건과 조사 한계, 후속 지침·스킬·reference 반영 기준, current를 유지한 채 원복·재구성 테스트에서 역할을 재판단할 방향.

- [Ticket 06 네트워크 정책과 구현 범위 합의](2026-09-16-01-network-policy-and-implementation-boundaries.md): Selective Local-First의 대상별 분기, unknown과 10초 안내, 제한·복구 화면, Router 중앙 차단, 일반 요청 오류·캐시 관리의 범위 축소, 화면용 debug 선택과 NetInfo·환경 조사 한계. 자동 반영 누락 뒤 Main이 복원한 현재 기준의 근거다.

- [Network Store 첫 단계 구현](2026-09-16-02-network-store-first-step.md): unknown 관측·10초 안내·재확인과 lifecycle, 실제/화면 상태 분리, 필수 Router·Policy·Sync 호환, mock 회귀 검사와 남은 실제 소비 연결.

- [Network Store 첫 결과의 가독성 보완](2026-09-16-03-network-store-readability.md): 기능 구현 뒤 남은 요청 수명·실패 처리·Router 분기·debug 상태 표현의 읽기 부담과 같은 동작을 유지한 내부 책임 정리.

- [네트워크 품질 개선·전문가 리뷰·다음 세션 인계](2026-09-17-01-network-quality-review-and-handoff.md): 실제/표시 API 이름, action factory의 private session, Router 대조 검사·Provider effect 보완, 현재 90개 검사와 최신 미해결 sync 지적, 소스·권한·미커밋 경계를 연결한 prepared 인계 packet.

- [네트워크 소비 연결 구현과 철회](2026-09-17-02-network-consumer-quality-improvements.md): 당시 구현·독립 검증과 사용자 범위 정정에 따른 전체 원복. 현재 적용된 제품 산출물로 읽지 않는다.

후속 분석·결정·실행 기록은 이 디렉터리에 날짜별로 남긴다. 원문·변경하지 않은 snapshot은 [source](../source/index.md), 현재 기준과 진행은 [current](../current/memory/index.md)가 소유한다.

- [파일별 검토·Provider 보완·레이아웃 검사와 커밋](2026-09-18-01-network-provider-layout-review-and-commits.md): 사용자 승인 코드 교체, 레이아웃 내부 유지 결정, 현재 108개 검사와 분리 커밋, 철회 이력 및 남은 정책 연결.

- [앱 초기화의 실패 정책·책임 정리·독립 리뷰와 스타일 반영](2026-09-18-02-app-initialization-and-style.md): DB/auth 실패와 선택·종료 정책의 사용자 결정, application 분리 이유, 테스트 우선 구현·리뷰 반영 경계, 154개 검사와 남은 startup 범위.

- [sync 시작 조건과 세션 종료 대기 연결](2026-09-18-03-sync-start-and-session-teardown.md): 추가 승인한 진행 중 sync 종료 순서, 테스트 우선 실패 근거, 공통 실행·Debug·강제 종료 표시와 185개 검사, 남은 엔진 내부 한계.

- [인증 만료 후 로컬 이용과 세션 모델 결정 과정](2026-09-18-04-auth-session-policy-and-decisions.md): 로컬 CRUD 지속과 대안 비교, SecureStore 세션 기록·다섯 상태·초기화 수명, 기간 제한 없음·다른 계정 전환 시 폐기·늦은 갱신 응답 방어 채택, 앱 종료 중 로그아웃 복구 제외와 구현 전 경계.

- [인증 세션 정책의 테스트 우선 구현](2026-09-18-05-auth-session-implementation.md): 단일 세션 저장·다섯 상태·재로그인 복귀·계정 전환과 큐 소유권, SQLite에서 재현한 transaction 조기 commit 수정, 235개 검사와 남은 native 검증.

- [인증 구현의 관리 복잡도 재검토와 재로그인 범위 결정](2026-09-19-01-auth-complexity-review-and-decisions.md): 전체 관리 우려, 로컬 이용 유지와 계정 전환 편의의 tradeoff, 일반 인증 실패·API 요청 수명의 설명 정정, 기존 구현에서 개선하는 선택과 책임별 후속 범위.

- [인증·API·로컬 DB 검토의 실행 근거](2026-09-19-02-auth-review-checks.md): 기존 235개 검사와 추가 8개 검사의 기대/실제 결과, 5개 결함 재현·3개 동작 확인, 임시 경로 없이 재구성할 코드·fixture·명령과 입증 한계.

- [인증 개선 뒤의 Policy 정리와 분할 검토·커밋](2026-09-21-01-auth-policy-split-review-and-commits.md): 핵심 엔티티 CRUD 유지, 이름·스타일 기준, 검토 순번과 Ticket 구분, 라우팅·DB 커밋 및 Promise·transaction 설명의 보장 범위.

- [토큰 비공개 분리와 인증 소비 구조 재검토·원복](2026-09-21-02-auth-token-separation-consumer-review-and-rollback.md): 토큰 노출 우려와 승인 범위, 종료 실패 보완, 소비 계약 감사, medium 구현의 철회와 선택적 복원, 남은 데이터 보존 문제.

- [인증 소비 경계의 좁은 적용과 검증](2026-09-21-03-auth-consumer-boundary-implementation.md): 기존 Store 안의 필수 복원 검증·Local 소유자 읽기·부분 명령 구분, 겹친 로그인 저장과 Router 인증 오류의 실패 재현·수정, 혼합 작업 트리 검사와 열린 범위.

- [인증 책임 기준 재점검과 구현](2026-09-21-04-auth-responsibilities-and-regression-fixes.md): 실제 동시성·보존 결함 재현, 책임 배치, 인증·동기화·화면 커밋별 검증과 미확인 범위.

- [인증 세션 변경의 커밋 경계와 분리 검증](2026-09-22-01-auth-commit-boundary.md): 인증 단계의 동작 범위, 동기화·화면 변경과의 경계, 별도 후보에서 확인한 277개 검사와 타입 검사 한계.

- [다섯 단계 분리 커밋과 검증 마무리](2026-09-22-02-five-stage-commits-and-verification.md): 실제 다섯 커밋의 동작 경계, 마지막 staged 후보 재검사, 남은 제품·검증 범위.

- [일정 온라인 복구의 책임 분리 논의](2026-09-29-01-schedule-recovery-responsibilities-discussion.md): 기존 정책과 현재 구현, 시스템별 책임, 미확정 단순화 후보의 동작 차이와 남은 판단.

- [일정 복귀의 Query 기준과 추가 조회 허용](2026-09-29-02-schedule-recovery-query-sync-decision.md): 기존 데이터 우선 표시·전역 reconnect 설정 유지·sync 뒤 추가 조회 허용을 선택한 이유, 개선 리뷰와 채택 원문, 갱신 누락 보완 및 남은 오류 안내·토스트 판단.

- [일정 Query 복귀와 변경 후 갱신 구현](2026-09-29-03-schedule-query-recovery-implementation.md): 복구 추적 제거, 기존 내용과 재시도 안내, sync·활성 전환 뒤 이전 조회 취소, 검사 결과와 미커밋·수락 경계.

- [일정 화면의 Policy·Query 직접 조합](2026-09-29-04-schedule-policy-query-composition.md): 독립 아키텍처 리뷰와 중간 상태 표현 제거, 표시용·실제 관측 정책의 선택, Debug 계약 복원과 최신 검증.

- [일정 수정 폼과 Query의 수명 분리](2026-09-29-05-schedule-form-query-lifecycle.md): 기존 구현 커밋, 폼 입력·조회 수명 분리와 공통 갱신 연산, 실제 일정 폼 연결 검사 및 증거 범위 보완.

- [경비 목록·상세의 온라인 복구](2026-09-29-06-expense-query-recovery.md): 2-B의 Policy·Query 연결, 첫 실패·정상 빈 결과 구분, 일정 조회 차단과 sync·활성 전환 뒤 경비 갱신, 검사 경계.

- [세 화면의 접근 조건·표시 판단 공통화 비교](2026-09-29-07-read-query-composition-trial.md): 소비자 확대 뒤 책임 재검토, 기존 경비 작업 커밋과 한 가지 개선 적용, 보존 검사와 사용자 판단 경계.

- [일정 목록의 Query 상태·접근 조건·실행 분리 시험](2026-09-29-08-schedule-read-query-actions-trial.md): query/access/actions/view의 역할, 타입·실행 계약과 한 곳 적용 경계, 관련 검사 결과.

- [조회 조합의 이름·소유 위치와 기존 소비자 교체](2026-09-29-09-policy-query-ownership-and-migration.md): 일정·경비 feature와 공통 service의 명명·배치, FSD 예외와 Project 반영 보류, 세 화면 교체와 393개 검사 근거.

- [조회 조합 커밋과 다른 소비자의 적용 범위](2026-09-29-10-read-query-follow-up-scope.md): b4db89d 저장 경계, 상세·홈·폼의 조회 목적 차이와 Main 제안, 기록 점검 보완 및 미확정 실행 범위.

- [복구 알림을 추가하지 않는 결정과 UX 검토](2026-09-30-02-recovery-toast-and-ux-review.md): 2-C의 원래 목적, 현재 알림을 추가하지 않기로 한 이유와 사용자 채택, 재검토 조건 및 다음 UX 범위.

- [일정 추가의 정책 소비·작성 상태와 품질 재검토](2026-10-01-01-schedule-create-provisional-review.md): 검색 우선 구현의 잠정 기준, 책임 배치 논의, 두 차례 리뷰의 실제 범위와 남은 문제, 코드 유지·미커밋 선택.

- [일정 생성 전체의 책임 분리와 검증·커밋 결정](2026-10-02-01-schedule-create-boundaries-and-verification.md): 문제 배경을 우선한 사용자 정정, 독립 전문가 평가 기준, Places 경계 적용, 443개 자동 검사와 실제 앱 관찰의 차이, 남은 범위와 커밋 승인.

- [일정 구현 이후 경비 검토로 이어지는 작업 맥락 보완](2026-10-02-02-policy-consumer-review-continuity.md): 이미 커밋된 성과를 유지하면서, 원래 정책 소비·화면 제한·작성 수명 문제와 경비의 다음 검토를 연결한 이유와 범위.

- [경비 초안·일정 연결과 시간 책임의 결정·검증·보류](2026-10-02-03-expense-time-decisions-and-verification.md): 일정 첫 적용에서 이어진 경비 정책 인터뷰, 서버 직렬화와 입력 계약의 차이, 세 번의 제품 커밋, 자동·실앱 검증 범위와 Ticket 06의 다음 경계. 삭제 실패·상세 재시도는 사용자 요청으로 보류한다.

- [홈 요약의 표시 책임·정책 재사용과 UX 후속 검토](2026-10-04-01-home-summary-policy-and-ux-review.md): 비활성 홈 안내 개선, 기존 조회 상태 재사용으로 간결화한 이유, 최종 코드 커밋·자동/화면 검증 및 foreground·날짜·폼의 남은 경계.

- [2026-10-04-02-foreground-network-refresh.md](2026-10-04-02-foreground-network-refresh.md): 기존 주기적 감지와 복귀 확인의 관계, store 세션 책임, 커밋과 실제 복귀 호출 검증.
