# 05 — 서버 일정 응답의 날짜 변환

## 맡은 결과와 범위

이 Ticket은 아직 실행 범위가 확정되지 않았다. 확인된 문제는 서버 DB의 Schedule row가 가진 `scheduledAt`, `createdAt`, `updatedAt`, `deletedAt`을 API entity의 ISO 문자열로 바꾸는 동일 표현이 여러 응답 경계에 분산되어 있다는 점이다. [Spec 품질·완료 판단](../spec/04-quality-and-completion.md)에 따라 동작 보존과 실제 수정 부담 개선을 함께 입증할 수 있을 때만 실행 범위를 채택한다.

현재 선택지는 공통 추출이 탐색 비용만 늘린다고 판단해 변경 없이 검토를 닫는 것과, 동일 직렬화 책임을 가진 소비 지점을 함께 다루도록 이 Ticket을 다시 정의하는 것이다. 어느 방향도 아직 사용자가 선택하지 않았다. CRUD 쓰기 값, endpoint별 조회·인증·소유권·soft-delete, schema 검증·response envelope·오류 계약, activation·sync 전체 조립을 직렬화 helper 안으로 합치는 것은 현재 범위로 채택하지 않았다.

## 실행 맥락과 접근

사용자는 개별 Ticket보다 관련 Project Context의 책임과 계약을 먼저 확인하라고 정정했다. Main은 [이 Work가 선택한 Project context](../project-context.md), 관련 API·시간·TypeScript·오류 처리 설명, server/schema guide와 실제 코드를 대조했다고 보고했다. 상세 관찰과 증명 한계는 [추가 조사](../additional-research.md)에 있다.

Project 기준에서 Schedule은 sync 대상 Data Entity이고, `@repo/schema`가 전송 shape의 원천이며 API 시간은 timezone을 포함한 ISO 8601 문자열이어야 한다. PostgreSQL/Drizzle row의 날짜는 서버 런타임에서 `Date`이므로 응답 경계에서 문자열 직렬화가 필요하다. 다만 Project Context는 Schedule serializer·mapper의 canonical 위치나 server entity 공통 직렬화 계층을 정의하지 않는다. 새 공통 모듈은 기존 표준을 적용하는 단순 정리가 아니라 책임 단위를 추가하는 설계 선택이다.

Main이 확인해 보고한 동일 네 필드 변환의 소비 지점은 총 일곱 곳이다.

- `apps/server/src/routes/schedules.ts`: 생성·목록·단건·수정 네 곳
- `apps/server/src/routes/trips.ts`: 여행 아래 일정 목록, activation 두 곳
- `apps/server/src/routes/sync.ts`: pull 한 곳

날짜 직렬화 의미는 같지만 각 endpoint의 entity/envelope 검증, 오류 변환, 조회·소유권 조건은 다르다. 일부 네 곳만 helper로 교체하면 공통 helper와 인라인 변환이 함께 남아 사용 기준을 새로 추측하게 만들 수 있다. 반대로 모든 endpoint를 같은 검증·오류·조회 흐름으로 통일하면 별도 계약 변경이 된다.

## 완료 조건과 확인 방법

실행 방향을 정하기 전에는 모듈 위치, helper 형태, 테스트 파일과 runner를 완료 조건으로 고정하지 않는다.

변경 없이 닫는다면 일곱 소비 지점의 인라인 변환이 각 응답 경계에서 충분히 명확하고, 새 간접 호출과 Owner 탐색 비용이 수정 위치 감소보다 크다는 코드 비교 근거를 남긴다. 문제를 보지 않았다는 뜻이나 전체 서버 변환 검토 완료로 확대하지 않는다.

공통 직렬화 책임으로 다시 정의한다면 다음을 먼저 구체화한다.

- 일곱 소비 지점이 공유하는 DB row → API Schedule entity 직렬화만 공통 범위로 두고 endpoint별 검증·envelope·오류·인증·소유권·조회 조건은 호출부에 유지한다.
- Schedule 전용 Owner를 둘지, Trip·Expense도 따를 server 직렬화 책임을 설계할지 범위를 명시한다.
- 변경 전후 실제 endpoint의 status·JSON·오류 분기와 네 날짜 변환을 같은 조건으로 비교할 수 있는 서버 검사 기반을 정한다.
- helper 단위 검사만으로 route 동작 보존을 주장하지 않고, 실제 DB·인증·ownership·외부 연결을 대체한 범위와 미확인을 구별한다.
- 같은 변환의 수정 위치가 줄었는지와 새 간접 계층이 읽기 부담을 다른 곳으로 옮기지 않았는지를 별도로 비교한다.

프로젝트는 Node 20.18.1을 고정하며 Main은 이 환경에 `node:test`의 `mock.module`이 없다고 확인해 보고했다. server package에도 현재 test runner·script가 없으므로, 이전 문서의 Node 내장 test runner·`tsx` loader·module mock과 `test:schedules` script 계획은 사용하지 않는다. Node 20에서 실제 실행 가능한 검증 방식은 범위 선택 뒤 다시 설계한다.

## 현재 상태와 실제 결과

문제 관찰과 Context·코드 대조만 수행됐다. Main 보고상 제품 코드·제품 test·server 설정 변경과 서버 검사 실행은 없고, 사용자 수락도 없다. 기존 문서에 있던 CRUD 네 곳 전용 모듈과 특정 테스트 파일·runner 계획은 현재 근거와 맞지 않아 실행안에서 제외했다.

다음 판단은 공통 추출 없이 검토를 종료할지, 일곱 소비 지점을 공유 직렬화 책임으로 묶도록 Ticket을 다시 정의할지 선택하는 것이다. 범위를 넓히더라도 activation의 schema 미사용, nested schedule 조회의 소유권 조건, 서버 오류 처리 Context와 구현의 차이는 직렬화 정리에 숨기지 않고 별도 계약 문제로 다룬다.
