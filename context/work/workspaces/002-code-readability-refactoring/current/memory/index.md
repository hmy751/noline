# 코드 가독성 리팩토링의 현재 작업 정의

이 Work의 Spec은 다음 다섯 파일 전체다. 기존 후보와 추가 조사에서 연결한 실행 범위는 Ticket 색인에서 찾는다. 개별 진행과 실제 결과는 Ticket 본문, 전체 상황과 다음 행동은 state가 소유한다.

- [문제·목표·범위](spec/01-problem-goal-scope.md)
- [요구 동작과 대표 사례](spec/02-behavior-and-cases.md)
- [핵심 개념·입출력 계약](spec/03-concepts-and-contracts.md)
- [품질·완료 판단](spec/04-quality-and-completion.md)
- [기존 분석과 추가 조사에서 이어받은 후보](analysis-items.md)
- [추가 조사·새 후보·기존 후보의 후속 범위](additional-research.md)
- [제약·현재 설계·가정](spec/05-constraints-design-assumptions.md)
- [선택한 Project context](project-context.md)
- [Ticket 색인](tickets/index.md)
- [전체 상태와 다음 행동](../state/index.md)

Ticket 경계와 진행 방식의 채택 원문·정정 경위는 [합의 기록](../../records/2026-09-11-01-ticket-boundary-agreement.md)에 있다. 실행 기준은 Spec의 제약·현재 설계·가정, 전체 분석 관점의 검토 기준은 품질·완료 판단에서 읽는다.

원문과 상세 재현 근거는 [source](../../source/index.md), 분석·합의·구성 검토는 [records](../../records/README.md), 실제 제품 산출물은 [output](../../output/index.md)에서 찾는다.

앱 준비·인증·네트워크 관측·Router·제한 화면·sync 연결의 실행 정의는 [Ticket 06](tickets/06-app-startup-lifecycle.md)에 있다. 네트워크 범위를 정한 이유는 [네트워크 정책 기록](../../records/2026-09-16-01-network-policy-and-implementation-boundaries.md), 세션·재로그인 정책과 상태 모델을 구체화한 과정은 [인증 논의 기록](../../records/2026-09-18-04-auth-session-policy-and-decisions.md)에서 읽는다. 현재 진행과 다음 행동은 state가 소유한다.
