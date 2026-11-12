# 완료 판정 뒤 추가 검토에서 발견한 세 가지 누락

007-07·003-12의 [선행 구현과 완료 판정](2026-11-10-04-conflict-pull-implementation.md) 뒤 2회 독립 검토에서 추가 누락을 찾아 같은 Ticket의 수정·재검증으로 이어갔고 최종 완료했다. 첫 검토는 기본 medium, 다음은 high 담당자가 수행했으며 두 번째는 `context/USAGE.md`에 따라 Personal·Project·Work 기준도 구현과 대조했다. 선행판의 원문·검증 수치는 당시 결과로 보존하고 추가 변경까지 같은 수치로 검증됐다고 간주하지 않는다.

## 수정한 내용과 이유

- **늦은 활성화 응답:** 새 pull에서 v3나 삭제를 반영해도 옛 활성화 응답 v2가 후착해 이름을 되돌리고 삭제 기록을 부활시킬 수 있었다. 서버에서 수락한 판본을 로컬 낙관적 version과 구별해 보관하고, 오래된 응답에는 수락된 값을 기준으로 pending을 겹친다.
- **손상 입력 삭제:** `amount: 'not-a-number'` 큐가 삭제 수신에서 사라지는 경로가 있었다. 삭제 소유자·여행 귀속과 함께 저장 요청의 유효성을 확인하며 손상된 원문을 자동 폐기하지 않는다.
- **성공 중 후속 저장:** 이번 전송이 성공해도 그동안 저장한 새 PENDING을 blocked로 계산해 pull을 생략하는 경로가 있었다. 새 PENDING과 실제 실패·진행 중 작업을 구별해 후속 입력을 보존한 채 pull을 진행한다.

기록 담당자는 `reconcile.ts`·`engine.ts`의 해당 경계와 실행 로그를 대조했다. Project 계약 반영은 Main이 맡고 여기서는 제품 기준을 변경하거나 새 삭제 정책을 선택하지 않는다.

## 실제 시뮬레이터 확인

Main은 네이티브 SQLite에서 제품 `useActivateTrip`의 HTTP 응답을 지연시키고 그동안 더 최신 pull을 완료시켰다. 늦은 응답 뒤에도 최신 여행명과 삭제 상태가 유지됐다. 정상 후속 저장에서는 금액 35·분류 교통·PENDING 1건을 보존하고 blocked는 false였으며, 두 번째 실행 뒤 서버 35.00·교통·큐 0건으로 수렴했다. 손상 입력은 삭제 수신 뒤에도 원문이 남고 다음 실제 전송에서 FAILED·retryCount 1·`server-rejected`가 됐다.

기록 담당자는 `artifacts/ticket-07-12-review/native.jsonl`의 위 성공 3행을 직접 확인했다. 선두 `Network request failed`는 임시 API 시작에 실패한 첫 시험이며 후속 성공 실행과 구별한다. 후속 검증의 PostgreSQL DB는 `noline_payload`·`noline_review_verify`, 네이티브 실행의 서버 DB는 `noline_test`다. 선행 기록의 `noline_verify`와 구별한다. 이전 시뮬레이터 결과나 Sentry Cloud 수신 검증을 이번에 다시 수행했다고 기록하지 않는다.

## 최종 검증과 완료 범위

최종 고정된 저장소 테스트를 Main이 재실행했고, 기록 담당자는 실행 로그의 최종 수치도 직접 확인했다.

| 검사 | 최종 결과 | 실행 근거 |
| --- | --- | --- |
| client | 70묶음 778/778 | `/tmp/noline-review-client-close.log` |
| 서버 단위 | 12묶음 73/73 | `/tmp/noline-independent-server-fixed.log` |
| 격리 PostgreSQL | 5파일 49/49 | `/tmp/noline-independent-integration-fixed.log` |

별도 독립 재현 8개에는 GET의 DB v9를 목록 v9로 전달하는 경계, cleanup과 겹쳐 지연된 활성화의 실패 및 최신 응답 재시도, rollback, DELETE 200에서 원본이 없는 경우와 vacuum이 포함됐다. 같은 여행의 직접 CREATE·PUT·DELETE와 활성화를 양 순서로 실행하는 경우, 구버전 목록의 version fallback도 검사했다. 별도 재현 수를 저장소 테스트 합계에 다시 더하지 않는다.

최종 제품 코드에서 후속 시뮬레이터 3조건을 모두 재실행했다. `artifacts/ticket-07-12-review/native.jsonl`의 5~7행은 후속 편집의 PENDING 1건 보존 뒤 재전송 큐 0건, 실제 활성화 응답 역전 후 최신 이름·삭제 유지, 삭제 수신 뒤 손상 원문 보존과 실제 FAILED 1회를 다시 확인한다. 이 후속 확인은 시뮬레이터 1개이며, 선행 기록의 두 기기와 일반 앱 복구 화면 확인을 대체하거나 모두 다시 실행했다는 뜻이 아니다.

Main은 두 Ticket의 개발·검증 완료를 판정했다. client 타입 검사 오류 7개와 전체 lint 오류 31개는 기존 지도·공유 UI 등의 별도 이슈로 유지한다. 선행 문서 검사에서 남은 과거 링크 오류 64개를 이번 코드 검증으로 해결했다고 주장하지 않는다. SQL → 서버 → 앱 배포와 실제 Cloud 재수집은 미실행이다.

여행 재활성 뒤 옛 정리 예약이 실행되는 순서는 이미 별개로 추적하는 003 Ticket 04의 책임이다. 이번 두 Ticket의 완료 범위로 넓히지 않는다. Project 반영은 Main이 별도로 관리한다.


## 최종 수정본 high 재검토에서 다시 열린 조건

사용자가 최종 수정본의 high 재검토를 요청한 뒤, review-only 검사에서 007-07의 두 조건을 재현했다. 제품 코드·Project는 이번 검토에서 수정하지 않았다. 앞의 완료 판단과 778/73/49 등의 실행 수치는 당시 확인 결과로 보존하되, 아래 조건이 해결되지 않은 현재 007-07 전체 완료 판단으로 사용하지 않는다. 최종 검토 판단은 검토 완료·수정과 재검증 필요다.

- **표식 발급이 라우팅 뒤로 밀림:** 활성화가 진행 중인 10:00에 금액 30을 repository에 제출한다. 활성화가 상대 기기의 10:01 편집값 35를 수신하고 10:02에 끝나면, 저장의 `edit.time`도 10:02에 발급된다. 더 이른 사용자 입력 30이 상대 편집보다 뒤의 표식을 얻어 비교에서 승리한다. 재현 로그의 핵심 출력은 `REVIEW_CLOCK 1794304800000 2026-11-10T10:01:00.000Z 2026-11-10T10:02:00.000Z 30`이다.
- **저장 경계의 지출액 그룹 검증 차이:** 같은 repository에 `{ amount: '30' }`만 넘기면 원격 경로는 전송 전에 거절하지만 활성 여행의 로컬 경로는 금액·표식을 저장하고 통화 없는 UPDATE를 큐에 확정한다. 저장 결과는 30이지만 해당 payload는 공유 `updateExpenseRequest` 검증에 실패한다. 기본 편집 UI는 금액·통화를 함께 채우므로 이 재현의 직접 영향은 repository 저장 경계로 한정한다.

기록 담당자는 `/tmp/noline-final-review-clock.log`·`/tmp/noline-review-local-remote-shape.log`와 재현 소스 `/tmp/noline-final-review-clock-probe.test.ts`·`/tmp/noline-review-local-remote-shape.test.ts`의 검사·assertion을 직접 읽었다. 각각 1개 검사가 통과했다는 뜻은 위 결함을 재현했다는 것이며 수정 성공이나 추가 네이티브 실행을 뜻하지 않는다. 위 두 조건은 수정·재검증이 필요한 미해결로 유지한다. 새 정책·정본을 선택하거나 003-12의 cursor 무누락 결과 전체를 무효화하지 않는다.


### 비활성화·사본 정리 뒤 늦은 pull의 본문 재저장

high 독립 검토자는 활성 여행 A의 pull HTTP 응답을 지연한 상태에서 사용자가 A를 비활성화하고 사본 정리까지 완료하는 순서를 추가 재현했다. 정리 직후 일정·경비는 로컬에서 숨겨지고 `serverRecords.record`도 null이었다. 정상 재활성 없이 같은 서버 판본의 지연 응답을 풀자 활성 상태는 false인데 자식의 `deletedAt`은 null로 돌아오고 수락 기록의 본문도 다시 저장됐다.

기록 담당자는 `/tmp/noline-context-review/context.test.ts`의 두 번째 검사 `late pull brings back child bodies after explicit local cleanup`을 직접 읽었다. 실제 SQLite와 모의 HTTP를 사용하며, 비활성화·정리 전후와 지연 응답 뒤 상태를 assertion으로 대조한 재현이다. 실행 성공 보고는 독립 검토자와 Main의 전달이며 기록 담당자가 재실행한 것은 아니다.

Main은 현재 활성·사본 상태를 확인한 뒤 응답을 쓰는 책임이 003-12의 pull 수신에 있다고 판정했다. 따라서 003-12도 수정·재검증이 필요하다. 이 사례는 **정상 재활성 없이 늦은 수신이 방금 정리한 사본을 다시 쓰는 순서**이며, 003-04의 **재활성 뒤 옛 cleanup 예약이 실행되는 순서**와 구별한다.

이번 검토는 Personal의 세 판단을 실제 경계에 적용했다. 수신 경로 공통화는 호출 위치를 공유하는 것과 현재 활성·사본 상태를 함께 검증하는 것을 대조하는 데, ACK와 입력 수명은 금액만 받은 입력이 전송 불가 큐로 확정되는지를 보는 데, 완료 의미는 검사 통과 수치와 남은 반례를 구별해 완료 판단을 정정하는 데 사용했다. 새 개인 기준이나 제품 정책을 이 기록에서 만들지 않는다.

최신 두 Ticket의 판단은 **검토 완료, 수정·재검증 필요**다. 007-07의 표식 발급·그룹 저장 두 조건과 003-12의 지연 pull 조건이 남는다. 이번 요청은 검토이므로 제품 코드·Project는 수정하지 않았다. 기존 완료·검사 수치는 역사로 보존하고 배포도 계속 미실행이다.


## 세 반례 수정과 최종 재검증

위 high 검토의 세 반례를 같은 Ticket에서 수정했다. 저장 제출 시각은 SecureStore·라우터 대기 전에 확보하고 기존 편집 표식은 재사용한다. Local·Remote 모두 최종 요청의 편집 그룹을 검증해 금액만 있는 불완전 UPDATE를 저장하거나 전송하지 않는다. 기존 FIFO와 채택한 충돌 정책은 유지한다.

pull은 요청 당시 사본 수명 ID와 현재 ID를 맞춰 유효한 수신만 쓰며, 본문과 cursor를 같은 SQLite 트랜잭션에서 확정한다. 기한이 지난 요청에 포함된 확정된 삭제 증거는 보존한다. 비활성화·사본 정리의 세 경로도 같은 처리로 통합했다. 이는 003-12의 수신 경계 수정이며 003-04의 재활성 후 옛 정리 예약 실행 문제를 해결했다고 넓히지 않는다.

Main이 회수한 high 독립 개선 검토는 추가 중대 반례 없이 4묶음 53/53, 원래 재현을 포함한 독립 검증은 4묶음 12/12였다. 최신 고정 저장소 검사는 client 71묶음 797/797, 서버 12묶음 73/73, 격리 PostgreSQL 5파일 49/49다. 기록 담당자는 `/tmp/noline-recheck-independent.log`, `/tmp/noline-pull-client-final.log`, `/tmp/noline-boundary-server-unit.log`, `/tmp/noline-save-pull-pg-tests.log`의 최종 결과를 직접 확인했다. 개선 검토 53개는 Main 전달 결과이며 저장소 검사 합계에 다시 더하지 않는다.

### 실제 네이티브 경계 재확인

시뮬레이터 1대에서 실제 React hook·repository와 네이티브 SQLite·서버를 사용했고, 상대 편집은 별도의 실제 HTTP 요청으로 실행했다. `artifacts/save-pull-boundary/native.jsonl`의 최종 13~16행에서 다음 결과를 확인했다.

- 제출 시각과 표식이 모두 `2026-11-10T12:21:43.334Z`, 상대 편집은 `12:21:43.441Z`다. 활성화를 기다린 이전 입력이 상대 편집을 이기지 않고 서버·SQLite가 35.00·큐 0건으로 수렴했다.
- 불완전 금액 입력은 HTTP 0회로 거절됐고 기존 정상 큐 1건은 그대로 유지됐다.
- 정리 뒤 늦은 pull에도 inactive·hidden=true·serverBody=null을 유지했고 cursor는 전진하지 않았다.
- 정상 재활성화에서는 35.00을 다시 받았다.

초기 fixture의 도시에 지도 메타데이터가 없어 별도 개발 경고가 표시됐다. 지도 메타데이터를 채워 다시 실행한 뒤 Main이 실험용 앱 진입점의 “확인 완료 · 35 USD / 남은 전송 0건 / 기기 사본 정리와 재활성화 확인” 화면을 확인했다. 화면 근거는 `artifacts/save-pull-boundary/result.png`다. 이 화면은 선행 일반 앱 복구 UI 확인과 구별한다. 이 경고와 그 확인을 실제 지도 다운로드 검증으로 간주하지 않는다.

현재 두 Ticket의 판단은 **세 반례 보완을 포함한 개발·검증 완료, 배포 별도**다. 타입 검사 오류 7개·전체 lint 오류 31개는 기존 이슈다. 제품·Project 반영은 Main이 맡으며 SQL → 서버 → 앱 배포는 미실행이다. 선행 반례와 수치는 당시 관찰로 남기고 현재 수정 여부는 이 절을 따른다.

Main의 최종 고정 전체 재실행도 `/tmp/noline-save-pull-close-client.log`에서 71묶음 797/797로 확인했다. `/tmp/noline-save-pull-close-lint.log`의 전체 lint는 기존 31개 오류로 실패했으며 별도 이슈라는 범위를 유지한다. 최종 화면과 native 재실행까지 완료했고 남은 배포 상태는 바꾸지 않는다.


## 코드 표현 기준의 후속 정정

앞선 표현 점검은 일부 중괄호·lint에 치우쳐 Project의 import·공유 타입·일반 함수·이름·진단 기준과 Personal의 구간·주석 기준을 충분히 대조하지 못했다. 이번에는 두 Ticket 관련 변경·신규 TS/TSX 99파일(제품·테스트)을 대상으로 포맷, 변경 부분 import 순서와 조건·반복문의 중괄호를 확인했다. 2xx·409·410의 처리 책임과 이름, raw pending 입력과 공유 서버 응답을 구별하고, Drizzle 여행 행의 단언과 수기로 중복한 삭제 DTO를 정리했다. 기존 overload 예외는 타입 안전한 prepared input 공개 계약으로 유지했다.

Main은 high 재검토의 남은 P3 두 건을 수정한 뒤 관련 검사 83/83 통과를 보고했다. 전체 client 71묶음 797/797·서버 12묶음 73/73·PostgreSQL 5파일 49/49는 `/tmp/noline-style-final-{client,server-unit,pg}.log`의 최종 수치로 기록 담당자도 확인했다. `artifacts/ticket-style-check/native.jsonl`에서는 불완전 요청 HTTP 0회·기존 정상 큐 1건 유지, 서버·SQLite 35.00·큐 0건, 정리 뒤 본문 null·cursor 유지와 정상 재활성을 확인했다. 이 표현 정정으로 정책·FIFO·배포 상태를 바꾸지 않았으며 타입 오류 7개·전체 lint 오류 31개도 기존 별도 이슈로 유지한다.
