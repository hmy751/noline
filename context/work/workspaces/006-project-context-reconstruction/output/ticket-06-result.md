# Ticket 06 — 작성·입력·날짜 이관 결과

Ticket 05 작업은 `0e49e13`, Workspace 기록은 `cde5f97`으로 분리해 커밋한 뒤 이번 이관을 진행했다. 작성·입력과 날짜의 기존 본문·결정을 현재 코드와 부모 소비자까지 대조해 Project로 재구성했다. Ticket 06은 문서 변경이며 제품 코드·지속 테스트를 수정하지 않았다. 독립 개선 검토와 별도 요구 검증을 마쳤고 필수 수정 의견은 없었다. 이번 변경은 아직 커밋하지 않았다.

## 실제 산출물과 내용·형식 판단

[작성·입력 기준](../../../../project/guidance/writing-and-input/INDEX.md)은 공통 책임·입력 연결·제출을 설명하고, [초안 수명](../../../../project/guidance/writing-and-input/drafts.md), [장소 선택](../../../../project/guidance/writing-and-input/places.md), [picker](../../../../project/guidance/writing-and-input/pickers.md)를 실제 변경 질문에 따라 나눴다. [형성 맥락](../../../../project/guidance/writing-and-input/_background/context.md)과 [발췌·관찰 근거](../../../../project/guidance/writing-and-input/_background/evidence.md)는 단일 작성 수명·Places 보장·TimeField 선택의 이유와 비용을 가까이 보존한다.

[날짜와 시각](../../../../project/common/date-and-time.md)은 기존 경로와 제품 의미의 Owner를 유지했다. 이미 필드·저장 경계별 설명이 충분히 연결돼 있어 파일을 다시 옮기기보다 사실의 적용 범위를 바로잡고 [형성 자료](../../../../project/common/_background/date-and-time/README.md)를 추가했다. 날짜 표현·저장 계약과 폼 수명을 각각 이해한 뒤 연결하도록 했다.

이관 전 form 본문은 초안·후보·임시값·저장값과 책임을 잘 구별하고 있었다. 유효한 책임 표·날짜/시간 picker 비교·Controller 예시·조건별 문단은 유지했다. 마지막 질문 목록과 별도 manual-input의 중복은 해당 행동 조건에 통합했다. 새 형식에 맞추기 위한 일괄 변경이나 이전 문서의 무검증 복사가 아니다. 현재 코드와 다르거나 일부 소비자만 설명한 부분은 아래처럼 정정했다.

## 코드·실행에서 확인해 바꾼 설명

| 기존 설명의 위험 | 대조한 경계와 현재 설명 |
| --- | --- |
| 경비 수정은 같은 ID 재열기에서 reset하지 않는다는 일반화 | Drawer 내부 isOpen만 바꾸면 유지하지만 실제 ExpensesScreen은 닫을 때 selectedExpense를 null로 만든다. ID가 경비→undefined→경비로 바뀌어 재열기에서는 원본으로 reset한다. |
| 일정 수정의 정책 차단을 입력 소실과 혼동 | hook은 유지하고 입력 영역은 숨긴다. 제어된 offline/unknown 전환·복귀에서 제목·확인한 시각이 보존되고 명시적 재저장 payload로 전달됐다. TimeField 임시 선택은 해제되며 입력 표시·편집 계약의 미충족은 그대로다. |
| 일정·경비 pending 중 종료 방지를 동일시 | 경비는 ref로 중복 제출과 Drawer 닫기를 막는다. 일정 수정은 저장/취소 버튼만 잠그고 Drawer onClose에 가드가 없다. 일정 생성도 경비의 동일 tick ref 방식과 같다고 하지 않는다. |
| 닫힌 수정 검색의 입력 보존을 실제 재열기로 확대 | Modal이 장착된 채 isOpen만 바뀌는 경우와 부모의 조건부 해제를 구별했다. 실제 수정은 닫으면 해제하며 initialQuery prop도 Modal이 사용하지 않아 새 빈 검색으로 시작한다. |
| 도시 날짜 경계를 언제나 자정으로 설명 | getTimeZoneDayStartISO는 자정 DST 공백이면 첫 유효 시점을 사용하며 날짜 전체가 없으면 거절한다. 임의 일정 시각의 DST 공백 거절과 다른 경계다. |
| 서버가 과거 client 큐에서 온 시간대 없는 요청만 판별해 받는다는 설명 | 호환 목적과 실제 입력 범위를 구별했다. POST /trips 전체에 legacy schema가 적용돼 누락·null을 수용하며 과거 큐 여부를 판별하지 않는다. |
| Local Schedule 반환이 entity 전체의 시점을 검사하는 듯한 설명 | 실제 parse 대상은 scheduledAt이다. createdAt/updatedAt/deletedAt을 포함한 entity 입수 검사는 activation/pull의 별도 경계다. |
| 기간·시간대 변경이면 모든 경로에서 expiresAt도 갱신된다는 설명 | 활성 Trip Local update의 종료일·시간대 변경에서 갱신된다. pull/upsert는 Trip만 바꾸며 지도 cleanup은 최신 Trip으로 만료를 다시 계산한다. 저장 metadata의 최신성과 실제 만료 판정을 구별했다. |

Main은 원문 여섯 개와 002의 일정 생성·경비 날짜·picker 형성 기록, Places API/query·수정 adapter/Modal, DatePicker·TimePicker·TimeField, 생성 Screen·draft/search hook과 관련 현재 guide를 직접 읽었다. 별도 조사자는 실제 폼 부모·reset·정책·pending과 schema/helper/repository/Local·server·입수·만료 경계를 대조했다. 판단을 가르는 시간 helper·서버 생성·Local 수정/반환과 임시 probe의 입력·assertion은 Main이 다시 확인했다. 독립 개선 검토자도 원문·새 본문과 해당 실제 코드를 직접 비교했다.

## 원본 보존과 현재 읽기 경로

| 옛 원본 | 현재 의미·이유와 역사 보존 |
| --- | --- |
| `.claude/context/form.md` | 작성·입력 묶음. [이관 전 form](../../../../../.claude/_archive/form-pre-project-2026-10-31.md) |
| `.claude/context/manual-input.md` | 같은 폼·같은 저장 경로와 수동 기록을 작성 기준·장소 본문에 통합. [보존판](../../../../../.claude/_archive/manual-input-pre-project-2026-10-31.md) |
| `.claude/context/time.md` | 기존 날짜 Owner에 구현 경로도 연결해 호환 stub 제거. [보존판](../../../../../.claude/_archive/time-pre-project-2026-10-31.md) |
| 경비 초안·일정 연결 결정 | 제품 의미는 기존 여행 접근·제품 기준, 이유·발췌는 기존 Project 근거 유지. [보존판](../../../../../.claude/_archive/expense-association-decision-pre-project-2026-10-31.md) |
| 경비 날짜 경계 결정 | 날짜 본문과 가까운 형성 맥락·근거. [보존판](../../../../../.claude/_archive/expense-date-decision-pre-project-2026-10-31.md) |
| 여행 도시 시간대 결정 | 날짜 본문과 가까운 형성 맥락·근거. [보존판](../../../../../.claude/_archive/trip-time-zone-decision-pre-project-2026-10-31.md) |

여섯 옛 경로는 제거하고 notice 뒤에 당시 원문을 보존했다. 현재 Project 본문·형성 자료에서 옛 제품 문서나 archive를 읽어야 의미를 복원하는 연결은 남기지 않았다. 이 output의 보존 링크는 역사 조사 접근점이다.

Project·context 지도, client/server/schema/UI guide, Personal README의 제품 링크, runbook·현재 command 경로를 전환했다. Ticket 05 UI 본문은 새 picker·초안 Owner로 직접 연결했다. 여행 접근의 일정 수정 차이와 데이터 수명의 날짜 경계 표현도 이번 관찰 범위로 맞췄다.

현재 session-bound 002의 output에서 도시 시간대 결정 경로를 새 형성 맥락으로 전환했다. default 001 Verify의 이번 이동 evidence 입력도 새 본문으로 바꿨고 claim·argv·receipt·status는 유지했다. 006 source-map은 당시 분석 문장을 유지하고 옮긴 원문 링크만 archive로 바꿨다. 역사 Work current/records/source를 일괄 최신화하지 않았다.

## 실행 근거와 상한

| 수행 주체·검사 | 결과와 확인 범위 |
| --- | --- |
| 폼 조사자: 기존 client 6 suites | 59 tests 통과. create-schedule-flow, create-expense-flow, offline-values, expense-city-default, time-field, picker-lifecycle. RHF/화면의 제어된 경계이며 native/HTTP 전체가 아니다. |
| 날짜 조사자: 기존 client 7 suites | 94 tests 통과. datetime, timezone, temporal-local-contracts, trip-lifecycle, trip-time-zone-migration, activation-query-refresh, sync/query-refresh. 실제 Local transaction 검사와 대역 입수/동기화 검사의 상한을 구별한다. |
| Main: Places·picker 3 suites | 22 tests 통과. time-picker-wheel, update-place-search, places/api. 로그 `/tmp/noline-006-ticket06-places-picker.log`. |
| 폼 조사자: 임시 probe | 4 tests 통과. 실제 RHF·Policy와 대역 mutation·Drawer·picker로 아래 입력/결과를 확인했다. |
| 날짜 조사자: server serializer 3 suites | 6 tests 통과. Schedule·Expense·Trip의 DB row→응답 표현. |
| Main: server route 5 suites | 51 tests 통과. Schedule·Expense·Trip·sync response-contract와 trip-time-zone. 처음 조사 실행은 listen EPERM 때문에 실패했으나 허용된 로컬 실행으로 해소해 다시 확인했다. DB·인증 대역이며 실제 PostgreSQL·JWT가 아니다. |

중복 실행을 합산하지 않은 기존 client 합계는 16 suites/175 tests, server는 8 suites/57 tests다. 추가 probe 4개는 별도다. 전체 client/server test suite나 실제 앱을 실행한 결과는 아니다. 기존 TimeField 검사에는 act 경고와 실패 시나리오의 의도된 오류 로그가 있었으며 테스트 실패는 아니었다.

재실행은 root의 `node node_modules/jest/bin/jest.js --config apps/client/jest.config.cjs --runInBand --runTestsByPath <해당 경로>`를 사용한다. Server는 apps/server에서 `../../node_modules/.bin/vitest run tests/routes/{schedules,expenses,trips,sync}.response-contract.test.ts tests/routes/trip-time-zone.test.ts`이며 serializer는 `tests/serializers/{schedule,expense,trip}.test.ts`다.

임시 probe는 `/private/tmp/noline-ticket06-form-probe/lifecycle.test.tsx`와 config로 실행했다. 기존 `offline-values.test.tsx`의 mocks를 재사용했으며 저장소에 지속 테스트를 추가하지 않았다. 임시 파일 없이도 관찰 범위를 재구성할 입력과 결과는 다음과 같다.

- signed-in·비활성 여행, 일정 `{ id: 's', tripId: 'trip', date: '2026-09-21', time: '10:00' }`, UTC에서 제목을 `보존 일정`으로 바꾸고 11:00을 확인한 뒤 시간창을 다시 연다. realStatus를 offline 또는 unknown으로 바꾸면 제목·저장 버튼과 TimePicker가 사라진다. online 복귀 시 제목·11:00은 나타나고 picker는 닫혀 있다. 자동 mutation은 0회다. 저장을 누르면 payload는 `{ title: '보존 일정', scheduledAt: '2026-09-21T11:00:00.000Z' }`를 포함한다.
- 경비 ID e의 제목 편집 후 같은 data로 isOpen만 닫았다 열면 편집값을 유지한다. 실제 부모처럼 닫을 때 expenseData=null을 거쳐 e를 다시 주면 원본 제목으로 reset한다.
- 일정은 같은 data를 유지해도 isOpen 닫기·재열기 자체로 원본 제목으로 reset한다.

이 probe는 실제 서버 저장 성공, native 닫기/휠 제스처, 인터넷 단절 후 Local 저장·재접속 sync를 증명하지 않는다. 입력 표시 계약의 미충족을 고친 작업도 아니다.

## 검토·검증과 다음 행동

독립 개선 검토는 기존 책임 표·picker 비교·조건을 유지한 판단과 초안/장소/picker 분리의 이점을 지지했고 필수 수정 의견을 남기지 않았다. 원본보다 새 구성이 무조건 낫다고 전제하지 않았으며 긴 단일 폼 본문을 유지하는 대안과 실제 변경 질문별 분리 비용을 비교했다. 별도 검증자는 원본·현재 문서·실제 부모 소비자를 다시 대조했고 요구 충족을 지지했다. 원본 6개는 archive 안내 두 줄을 제외하면 이전 본문과 동일하며, 현재 guide·Project·rules·runbooks·guards·commands에서 이번 옛 경로 6개를 가리키는 참조는 없다. Client와 server/schema 진입점에서 새 본문·형성 자료로 이어지는 대표 읽기도 확인했다.

변경 문서의 상대 링크 594개와 `git diff --check`는 통과했다. `006-project-context-reconstruction`을 명시한 Recover, 명시적 002·001 및 기본 001 Recover도 통과했다. 전체 Harness 검사는 과거 기록의 끊어진 참조 37건으로 실패한다. Ticket 05 시점 25건에서 이번 원본 격리로 역사 기록의 참조 12건이 추가된 결과이며, 현재 경로를 복구하려고 옛 본문이나 stub을 되살리지 않았다. 001 Verify 선언에 남은 기존 누락 입력 8개도 그대로이며 전체 선언 정리는 Ticket 08에서 다룬다. 이번에 해당 Workspace의 Verify receipt나 완료 상태를 새로 만들지 않았다.

다음 문서 실행은 07 통화·API·오류다. 이번에 남긴 제품 차이는 일정 수정의 입력 가림·pending Drawer 종료, 수정 장소 상세 실패 0/0·검색 재열기, 늦은 경비 통화 기본값, 시간대 호환 수용과 만료 metadata 갱신 범위다. 기존 002·003 후속과 조율해 실제 문제·투자 우선순위를 판단하며 이번 문서 이관으로 제품 수정을 착수하거나 해결했다고 하지 않는다. 입력 의미·저장 계약은 유지했고 결제일/사용일·복수 도시 시간대 같은 열린 선택은 새로 확정하지 않았다.
