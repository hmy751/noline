# Ticket 09 제품 본문 통합과 내용 대응

2026-10-31에 기존 7개 rule·rules README·Guard Map 전체를 읽고 02–08의 현재 Project 본문과 대표 실제 코드를 대조했다. 제품 동작은 수정하지 않았다. 이 결과는 제품 본문 담당의 통합·자기 확인이며 소비자 전환·원본 격리·독립 검토·Ticket 전체 완료는 Main의 별도 결과와 합쳐 판단한다.

## 통합 선택과 얻는 이득

별도 단일 policy 파일을 만들지 않고 실제 개발 질문을 소유한 기존 본문에 합쳤다. 원문의 짧은 규칙은 빨리 떠올리기 좋지만, 현재의 새 여행 생성 예외·계정 전체 목록·cleanup 미충족·Expense/Trip ownership 차이를 설명하지 못했다. 주제 본문에서 계약과 실제 적용 차이·위험·변경 확인을 같이 읽게 해 짧은 규칙을 현재 보장으로 오인할 가능성을 줄였다. 대신 주제 본문을 더 읽는 비용이 생긴다. 기존 첫머리의 변경 질문 표와 제목을 유지해 필요한 절에서 시작하게 했으며, 제품 기준 전체를 새 체크리스트로 복제하지 않았다.

기존 데이터 수명의 transaction·soft-delete·queue 보호, 여행 접근의 실제/표시 네트워크·조회 실패·작성 보존, API의 endpoint별 지원 차이와 schema의 타입/실제 parse 구분은 충분해서 유지했다. 빠져 있던 생성 ID의 전 경로 조건, 인증과 ownership의 독립성, Router/UI 우회 위험과 대표 변경 확인을 보강했다. 규칙 강도를 약화하거나 현재 미구현을 새 허용 정책으로 바꾸지 않았다.

## Rule별 원문과 현재 Owner

아래 원문은 `.claude/rules/`의 편입 전 판본이며 현재는 [원본 snapshot](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/ticket-09/)에 보존된다. 일반 개발 읽기는 아래 Project 목적지에서 끝나며 snapshot은 내용 대조의 근거다.

| 원문 | 현재 설명 위치 | 보존·보강·제외 판단 |
| --- | --- | --- |
| activation-router.md | [여행 접근의 책임](../../../../project/guidance/travel-access/INDEX.md#사용-가능-여부실행-위치표시-책임을-나눈다), [Router·목록](../../../../project/guidance/travel-access/INDEX.md#router와-계정-전체-여행-목록의-계약) | 활성 Local·비활성 Remote, UI/hook의 직접 선택 금지, Service 분리와 새 entity의 repository 선행을 보존했다. 새 여행 Remote 생성·목록의 fallback 예외를 함께 유지한다. Hook의 repository 호출까지 금지하는 해석은 제외했다. |
| transaction-sync-queue.md | [원자성](../../../../project/guidance/data-lifecycle/INDEX.md#local-변경과-queue를-같이-확정한다), 같은 본문의 [여행 정리](../../../../project/guidance/data-lifecycle/INDEX.md#여행을-정리할-때-모든-미전송-상태와-현재-활성-여부를-확인한다)·[계정 종료](../../../../project/guidance/data-lifecycle/INDEX.md#계정을-종료할-때-실행-종료와-전송-성공을-구별한다) | DB와 queue의 같은 withTransaction, 별도 enqueue 금지, Service queue 제외, cleanup 전 미전송 보호를 보존했다. 현재 여행별 PENDING 검사만으로 보호가 완성됐다는 보장은 제외하고 FAILED/IN_PROGRESS·부분 UPDATE·재활성화 공백을 유지했다. 세션 중 접수 작업 대기는 app-runtime으로 직접 연결한다. |
| client-side-id.md | [생성 ID](../../../../project/guidance/data-lifecycle/INDEX.md#생성-id는-localqueue서버에서-같은-값을-유지한다) | generateId·직접 ulid 호출 금지·request 수용·서버 같은 ID 저장·Local/queue/API 전 경로 일치를 명시했다. wrapper가 Expo Crypto를 사용함을 실제 확인했다. ID만으로 충돌 불가능·재전송 멱등성을 보장하는 해석은 제외한다. |
| schema-first.md | [공유 schema](../../../../project/guidance/development-boundaries/schema-and-types.md#계약의-종류에-맞는-schema에서-시작한다), 같은 본문의 타입/실제 확인·변경 확인 | schema 우선·z.infer·shared import·수기 DTO 복제 금지·form-only type 허용과 submit 수렴을 보존했다. 실제 parse·공개 export·입출력 차이를 유지하며 schema만 고치고 소비자를 남기는 위험을 보강했다. 타입 선언을 런타임 검증으로 보는 해석은 제외한다. |
| iso-time.md | [날짜와 시각](../../../../project/common/date-and-time.md), 특히 [적용·재확인](../../../../project/common/date-and-time.md#적용과-재확인) | 시점의 timezone ISO·Expense date-only·Trip IANA timezone·분리 입력 submit 결합·TEXT/서버 timezone-aware 저장·locale 저장 금지·표시 분리·shared helper 우선을 모두 보존했다. 기존 date-only 호환과 미확정 여행의 현재 차이를 유지하며 ‘date라는 이름이면 datetime’이라는 일반화는 제외했다. |
| auth-user-scope.md | [인증·소유권](../../../../project/guidance/api-contracts.md#사용자-데이터를-다루면-인증과-소유권을-각각-검사한다), [실제 적용 차이](../../../../project/guidance/api-contracts.md#expensetrip과-local-입수의-실제-적용-범위를-구별한다) | 인증 선행·인증 user ownership·sync 격리·Local 계정 분리·client ownership 불신을 보존했다. 부모/연결·실제 mutation 조건·다른 계정의 부정 경로를 함께 설명한다. 현재 Expense/Trip의 공백은 계약 불충족으로 유지했다. |
| policy-ui.md | [Policy·Router·UI 책임](../../../../project/guidance/travel-access/INDEX.md#사용-가능-여부실행-위치표시-책임을-나눈다), 같은 본문의 조회·작성·네트워크 수명 | useAppPolicy와 기존 제한 안내 패턴 우선·이유 안내·소유권/Router 우회 금지를 유지했다. 기존 unknown·Debug·캐시 공개·최초/갱신 실패 구분을 유지한다. Policy 의미가 바뀌면 주제 Owner·형성 이유를 함께 재판단하고 중요한 선택은 Project decisions 관리 기준을 따른다. 매 UI 수정마다 새 decision을 생성하는 뜻으로 확대하지 않는다. |
| rules/README.md | [Project 입구](../../../../project/README.md), [guidance 입구](../../../../project/guidance/README.md) | 관련 작업의 기준을 선택하고 근거·코드와 대조한다는 사용 목적은 유지했다. rules→guards→context의 별도 소유 단계와 도구별 사본 경계·새 rule 추가 기준은 제거된 디렉터리의 운영 규칙이므로 제품 본문에 복제하지 않았다. |

## Guard별 원문 의미와 확인 위치

| Guard Map 항목·실패 패턴 | 현재 Owner의 위험·확인 조건 |
| --- | --- |
| Activation Router / Router 없이 DB·API 선택 | travel-access의 Router 절에 저장소 선택 우회 위험, 새 entity의 데이터 경계 선행, 활성/비활성·실제 online/offline·unknown·Debug·세션 확인을 배치했다. 단건·목록·생성의 분기 차이를 보존했다. |
| Data/Service 분리 | travel-access 책임 표·data-lifecycle 원자성 절에 Data의 소유/queue와 외부 Service Policy를 구분한다. 기존 [선택 이유](../../../../project/guidance/travel-access/_background/context.md#데이터-준비와-온라인-서비스를-분리했다)와 Network-First의 비용도 유지했다. |
| Transaction + sync_queue / transaction 밖 queue | data-lifecycle의 원자성·변경 확인에서 queue insert 실패/반환 검사 실패 rollback·독립 upsert 간섭을 확인한다. 독립 DB 실행기를 transaction으로 오인하지 않는다. |
| Client-Side ID / 직접 ulid | 생성 ID 절에서 wrapper·schema·Local·CREATE payload·HTTP·server 응답의 동일 ID와 부모 연결을 확인한다. ID 수용이 ownership 생략을 허용하지 않는다. |
| Schema-first | schema-and-types에서 shape·export·추론 타입·실제 parse 소비자와 form submit 수렴을 확인한다. z.infer·HTTP generic·타입 단언으로 실제 검사를 대신하지 않는다. |
| ISO 8601 time / 새 local formatter | date-and-time의 필드별 의미·shared helper·적용 확인에서 시점/date-only·도시 시간대·저장/표시·request/두 DB/response를 구분한다. 기존 호환을 일괄 migration으로 바꾸지 않는다. |
| Soft Delete / 비활성화 hard delete | data-lifecycle의 사용자 삭제·pull·여행 정리·vacuum에서 일반 조회 삭제 숨김과 sync tombstone 전달, queue 참조 원본 보존, FAILED/IN_PROGRESS·재활성화 공백을 각각 설명한다. cleanupPending·soft delete만으로 안전 완성이라고 하지 않는다. |
| Auth/user scope | API 인증·소유권 절과 경로별 공백, app-runtime 세션 Owner에서 인증 없음·다른 사용자·삭제된 부모/자식·조작 ownership·실제 mutation 조건을 확인한다. |
| Policy UI | travel-access에서 useAppPolicy·제한 안내·Router 우회 금지를 함께 설명한다. 실제/표시 네트워크와 캐시 존재/공개·초안 보존이 다른 조건이라는 현재 계약을 유지한다. |
| Guard 사용·추가 기준 | 고비용 실패를 변경 전후 확인한다는 목적은 각 Owner의 위험·확인 조건에 유지했다. 별도 guard 파일을 새로 추가하는 횟수/비용 기준은 제거된 지도 운영 규칙이라 제품 정책으로 복제하지 않았다. |

## 실제 코드 대조와 자기 확인

직접 읽거나 검색으로 해당 처리 문장을 확인한 범위는 다음과 같다. 제품 테스트 실행 결과와 구별한다.

- Router `shared/services/offline-prep/router.ts`: 현재 세션·실제 연결·활성 여부, 새 여행 Remote, 목록 fallback, Debug 쓰기 차단. 기존 본문의 Policy/query 전체를 이번 대조만으로 재검증했다고 주장하지 않는다.
- `shared/services/id/ulid.ts`, 세 생성 feature, 세 create request와 server create route: generateId의 Expo Crypto 구현, client ID 전달·저장. wrapper 주석의 ‘충돌 없음’은 보장으로 가져오지 않았다.
- `schedule-local.ts`·`expense-local.ts`·`trip-local.ts`: ownership predicate 사용·Local 변경과 queue의 withTransaction·일반 목록 deletedAt 조건. 기존 본문에 남은 cleanup 공백은 이번 문서 작업으로 해결하지 않았다.
- 서버 auth middleware와 trips/schedules/expenses/sync route: requireAuth 장착·인증 userId·Schedule 부모/쓰기 조건·Expense 연결 검증 부재·Trip mutation 조건 차이·pull의 user scope와 삭제 행 포함. 실제 JWT/PostgreSQL 실행 검증은 하지 않았다.
- shared request schema·schema package export, server DB schema와 기존 Project의 날짜 경계 설명을 대조했다. PostgreSQL withTimezone 저장을 확인했으며 기기 timezone·native SQLite 실행 전체의 검증은 아니다.

Project 내부의 기존 rules/guards 참조를 product·architecture·app-runtime·layers·API·Project/guidance 입구에서 새 주제 Owner로 전환했다. 변경한 주요 현재 본문 11개에서 상대경로와 절 anchor 258개를 정적으로 확인해 누락 0건이었고, `git diff --check -- context/project`를 통과했다. Project에서 `.claude/rules`·`.claude/guards` 참조는 남지 않았다. 링크 통과가 내용 충분성이나 제품 동작을 입증하지는 않는다.

대표 읽기 질문으로 ① 활성 일정 저장의 queue 실패와 ID 일치 ② 일반 삭제 숨김과 pull tombstone ③ 경비 연결 ownership ④ unknown/Debug에서 Router·Policy 책임 ⑤ Expense date-only와 Schedule 시점·폼 submit을 각 목적지에서 찾아 대조했다. 기존 계약의 강도와 현재 구현 차이를 함께 찾을 수 있다. 독립 검토의 원자료·최신 diff 확인과 저장소 외부 소비자 전환 결과는 Main이 이어 판단한다.
