# 여행 중 일정과 경비를 이어가는 제품 기준

새 Work의 목적·보존할 동작·데이터 경계를 판단할 때 읽는다. Root [CLAUDE.md](../../../CLAUDE.md)의 불변식과 [README](../../../README.md)의 제품 장면, [Selective Activation](../../../.claude/context/selective-activation-architecture.md)이 상세 Owner다. 이 본문은 여러 작업이 필요한 의미를 재서술하며 충돌 시 상세 Owner를 대조한다.

## 사용자 장면과 성공 기준

Noline은 여행 중 연결이 끊겨도 일정 확인·기록과 경비 관리를 이어가기 위한 여행 관리 앱이다. 사용자는 필요한 여행 하나를 활성화하여 오프라인 데이터를 준비한다. 모든 여행을 로컬에 쌓기보다 활성 여행에 저장과 동기화 책임을 집중한다. 제품 성공의 기준은 네트워크가 불안정해도 핵심 입력을 잃지 않고, 복구 뒤 변경을 서버와 맞출 수 있는 것이다. 기능이나 이식 검사 통과만으로 실제 서비스가 이 기준을 달성했다고 판단하지 않는다.

Trip은 여행 단위이며 Schedule과 Expense가 그 여행의 일정·경비를 나타낸다. 활성 여행의 데이터는 Local SQLite를 기준으로 읽고 쓰며 비활성 여행은 Server API가 기준이다. Activation Router가 Data Entity의 Local/Remote 선택을 맡는다. 지도·검색·길찾기는 사용자가 소유한 sync data가 아니므로 Policy Layer의 네트워크 사용·제한 판단을 따른다. 온라인에서는 Network-First로 최신 서비스를 우선하며, 여행 활성화가 온라인 서비스 사용까지 막는 조건은 아니다.

오프라인 활성 여행은 제목·날짜·금액 같은 핵심 내용을 입력하고, 좌표 등 온라인 보강이 필요한 정보는 복구 뒤 보완하는 장면을 지원 목표로 둔다. 비활성 여행의 오프라인 조회·저장과 오프라인 여행 생성은 이 모델의 지원 범위가 아니다. 다만 이미 열린 작성 초안은 연결이 끊겨도 계속 표시·편집하고, 저장을 제한한 상태로 보존한다. 읽기 제한과 작성 초안의 수명에 대한 현재 기준은 [Policy Architecture](../../../.claude/context/policy-architecture.md)가 소유한다. 통화는 자동 환산 합계로 섞지 않고 통화별로 관리하며, 상세 의미는 [통화와 금액](currency.md)이 소유한다. 현재 배포 대상은 iOS이며 Android 설정의 존재를 동등한 배포·검증으로 보지 않는다.

## 함께 지킬 데이터 관계

Expense는 Trip에 속하고 같은 Trip의 Schedule 하나에 선택적으로 연결할 수 있다. 경비 날짜와 일정 날짜는 독립적이므로 날짜가 다른 일정에도 연결할 수 있으며, 경비 날짜를 바꿔도 연결은 유지한다. 활성 여행에서는 오프라인에도 Local 일정으로 연결·변경·해제할 수 있다. 경비 날짜의 입력·전송·표시는 `YYYY-MM-DD`로 맞추며 기존 datetime 호환과 서버 저장 표현은 [날짜와 시각](date-and-time.md)을 따른다. 날짜를 결제일이나 사용일 중 무엇으로 부를지는 이 연결·표현 계약과 별개로 열려 있다.

로컬 변경과 `sync_queue` 기록은 같은 transaction에 둬 한쪽만 남는 상태를 막는다. Entity ID는 클라이언트의 `generateId()`로 만들고 서버가 수용한다. `@repo/schema`의 Zod 계약에서 client/server 타입을 추론한다. 한 시점을 나타내는 값은 timezone을 포함한 ISO 8601 datetime으로 저장·전송한다. Expense `date`의 date-only 계약과 기존 입력·저장 호환은 [날짜와 시각](date-and-time.md)에서 구별한다. 서버는 인증과 사용자 소유권을 확인한다.

삭제·비활성화는 pending sync와 soft delete·cleanup 조건을 지켜 아직 서버에 반영하지 않은 입력을 보존한다. 정책상 제한은 기존 `useAppPolicy`, `PolicyErrorDisplay`, `NetworkStatusIndicator`를 통해 사용자에게 설명한다. 상세 규칙은 [rules](../../../.claude/rules/README.md)와 [guards](../../../.claude/guards/README.md)가 유지한다.

## 범위와 갱신

특정 릴리스의 완성, 실제 동기화 성공, 외부 지도·OAuth·DB의 운영 상태와 사람 acceptance는 이 문서가 보장하지 않는다. 현재 구조·확인 범위는 [구현 지도](../current/architecture.md), 선택 이유는 [Decision](../decisions/0001-selective-local-first.md)에 있다.

제품·domain 의미를 바꾸는 책임자가 관련 자료와 함께 갱신한다. 위 지원 경계나 불변식이 바뀌거나 상세 Owner와 충돌하면 재검토한다. 2026-09-09 원자료 대조를 바탕으로 2026-09-10 이전 요약과의 내용 귀속을 확인했다. 작업별 이식·검증 상태는 각 Workspace가 소유한다.
