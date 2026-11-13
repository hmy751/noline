# 여섯 관점 검토의 Main 판단

Main의 `/tmp/noline-readability-20261113/main-decisions.md`를 기록 담당자가 읽기용으로 정리했다. 사용자 원문이나 원본과 동일한 복사본이 아니다. 모든 판단 ID와 채택·조정·유지 의미, 보존 조건을 유지했다. 이 문서는 선택 당시의 판단이며 실제 반영·검증은 구현 보고와 [독립 검증](verification.md)에서 구별한다.

사용자 요청은 1〜7단계 작업 코드 전체를 사람이 읽고 판단하기 쉽게 다듬는 것이다. 기능·정책·합의는 유지한다. 시작 HEAD는 `8ab15b33`이며 manifest128파일(생산75·검사/설정51·인접UI2)·24,287행과 수정 전 사본을 확보했다. 여섯 검토자는 새 독립 문맥에서 같은128파일을 전부 읽고 각각128행의 coverage를 반환했다. 대표 파일이나 상위 몇 개로 줄이지 않았다.

수정 전 client37묶음505개·server12묶음73개가 통과했다. client 타입은 기존7오류이며 server 타입은 통과했다. pnpm이 새 CLI 설치 확인을 시도해 설치하지 않고 기존 Node 도구로 실행했다. 서버는 로컬 포트 EPERM 뒤 허용된 동일 명령에서73개가 통과했다.

## 시각적 구간

- **V1 채택:** 생략된46블록을 보완한다. 분기·else 귀속·await 순서는 유지한다.
- **V2·V3·V6·V7 채택:** 보고서의 전체 의미 구간 경계를 반영한다. 모든 await·return을 무조건 띄우는 규칙은 만들지 않는다.
- **V4 조정·현행 유지:** 처음 여섯 조건/삼항을 여러 줄로 표현했으나 기존 Prettier의 한 줄 요구와 충돌했다. ignore나 가짜 별칭을 추가하는 비용보다 실익이 작아 이 여섯 곳은 원래 표현으로 복구했다. 의미별 빈 줄·블록 보완은 유지하며 조건 논리·순서는 같다. formatter 설정도 바꾸지 않는다.
- **V5 채택:** migration 컬럼별 개행, DDL·공유 schema 선언과 검증 단계의 경계를 정리한다. SQL 내용·순서는 유지한다.

최초 시각적 정리66파일은 단일 분기 블록과 migration SQL 공백 정규화 외 AST 차이0이었다. 시각적 정리판은 뒤 논리 리팩터링의 비교 기준이며 인접 공용 UI는 수정하지 않았다.

## 전체 흐름

- **F2-01 채택:** 활성화 transaction 본문을 같은 파일 helper로 두어 입수·기기 반영·백그라운드 준비를 드러낸다. schema 추론 타입과4개 이하 입력을 사용한다. 삭제 수신 null commit 뒤 바깥 throw, 세션 검사·준비 ID·자식 반영 순서를 유지한다.
- **F2-02 채택:** 확정 삭제의 관련 큐 정리만 같은 파일 transaction helper로 분리한다. scope와 task context 외 범용 정책 기계는 만들지 않는다. completed/confirmed·CREATE·손상 원문·귀속·저장 검사 순서를 보존한다.
- **F2-03 채택:** 보류 수신 transaction과 ACK 전송을 같은 파일 helper로 나눈다. 초기 ID snapshot·404/405 반환·stage·notify·ACK 재등장 방지를 유지한다.
- **F2-04 조정:** 409는 유지하고410의 엄격 parse 뒤 귀속 검사·삭제 반영·task 잔존 판정만 분리한다. 최소 guard의 null과 parse 예외 사이 진단 차이를 유지하며 새 공개 DTO는 만들지 않는다.
- **F2-05 채택:** 서버 mutation 공개 작업을 앞에, 상세 helper를 뒤에 둔다. 초기화·lock·query 순서를 유지한다.
- **F2-06 채택:** 지도 StyleSheet를 컴포넌트 뒤로 옮긴다.
- **F2-07 채택:** ScheduleScreen event handler를 파생 표시 데이터 뒤에 모은다. hook 순서와 render 중 selection 보정 위치는 그대로 둔다.
- **F2-08 채택:** 세 검사 파일의 setup/cleanup 선언을 첫 사례 앞에 모은다. scope와 hook 사이 순서는 유지한다.
- **F2-09 유지:** describe 재편으로 전체 검사 이름·등록 구조를 바꾸는 비용보다 실익이 작다. 사건별 구간 개선은 V6에서 반영한다.

## 이름·타입·결과

- **M3-01 채택:** `preparedRequest`를 `requestPreparation`으로 바꿔 Promise임을 표현한다. await를 추가하지 않는다.
- **M3-02 채택:** `changedFields`는 그룹 전체 patch를 만들므로 `buildChangedGroupPatch`로 바꾸고 공유 소비자·검사를 연결한다.
- **M3-03 채택:** mergeEdit의 `changed`/`hasChanges`를 `requiresWrite`로 바꾼다. 같은 값의 새 표식도 쓰기가 필요하다.
- **M3-04 조정 채택:** 합성 HELD 작업 배열 대신 `hasUnresolvedTripChanges`/`hasUnresolvedTripChangesInTransaction` boolean 계약을 실제 소비자에 연결한다. 조회 순서·보호 조건은 같고 새 공통 pending 정책은 아니다.
- **M3-05·E4-03 통합 채택:** cleanup의 `handledTripCount`와 정확한 반환 설명을 사용한다. 미전송 보호로 유예한 건도 포함하는 기존 값과 후처리를 유지한다.
- **M3-06 채택:** 경로 다운로드의 `downloaded`를 `savedCount`로 바꾼다. 실제 새 캐시 삽입 수와 검사를 유지한다.
- **M3-07 채택:** `hasLocalTrips`를 `hasProtectedLocalTrips`로 바꾼다. 서버 목록 source 분류는 유지한다.
- **M3-08·R5-03 통합 채택:** `preserveLegacyHold*`의 미사용/합성 행 반환을 void로 바꾼다. notify·예외·ACK 조건은 같다.
- **M3-09 채택:** `listLegacyUpdates`를 `refreshAndListLegacyUpdates`로 바꿔 조회 중 삭제 보류 정리 효과를 이름·주석에 표현한다.
- **M3-10 채택:** `SyncIncompleteError.failedCount`를 `blockedCount`로 바꾼다. 로그아웃의 별도 실패 통계와 구별한다.
- **M3-11·R5-11·R6-05 통합 조정 채택:** `activateTripForTest`는 완료만 소비하므로 `Promise<unknown>`으로 두고 없는 배열 반환 약속을 제거한다.
- **M3-12 채택:** offline-values의 첫 두 이름을 실제 변경 없음·저장 생략 검사에 맞춘다.
- **M3-13 조정 채택:** 보류 보존의 마지막 boolean만 `{ serverBacked }` 옵션으로 바꾼다. 기존 optional id 위치·기본 generateId 평가 시점을 유지하면서 호출부 뜻을 드러낸다.
- **M3-14 채택:** 공유 entity가 DB 표현과1:1이라는 옛 주석을 정정한다. schema 런타임은 유지한다.

## 조건과 효과

- **E4-01 채택:** queue-ownership의 누락된 recoverInterruptedTasks mock을 추가하고 AuthRequiredError와 getQueueOwner 도달 assertion으로 실제 거절 원인을 확인한다. 제품 동작은 바꾸지 않는다.
- **E4-02 조정 채택:** route의 null은 캐시 보존, 빈 배열은 전체 정리라는 반환 계약을 정의부 주석에 둔다. 세 소비부에 union 포장을 늘리지 않는다.
- **E4-03:** M3-05와 통합한다.
- **E4-04 채택:** `hasServerChanges`를 `shouldRefreshQueries`로 바꿔 실제 서버 값 변화 단정 대신 후처리 의도를 표현한다.
- **E4-05 채택:** `readObservedClock`을 `retainAndReadObservedClock`으로 바꾼다. 저장 읽기 전 메모리 보존·직렬화·실패 시 잔류 순서를 유지한다.
- **E4-06 채택:** inspectLocalAccount 입구에 원문 그대로의 영속 격리와 후속 실패가 앞선 격리를 rollback하지 않는 계약을 적는다. 새 transaction이나 동작을 추가하지 않는다.

## 불필요한 해석

- **R5-01 채택:** 두 수정 폼의 mounted 입구 검사를 valid/invalid 처리 함수 첫머리로 옮겨 submit 중계 callback을 제거한다. resolver 이후·저장 이후 수명 검사와 RHF Promise 수명은 유지한다.
- **R5-02 채택:** 지도의 미사용 hasAllRoutes 계산·반환만 제거한다. savedCount와 부분 경로 표시는 유지한다.
- **R5-03:** M3-08과 통합한다.
- **R5-04 채택:** addToSyncQueue의 미사용 ID 반환만 void로 바꾼다. ID 발급·insert는 유지한다.
- **R5-05 채택:** 소비 없는 단건 hasPendingTask를 삭제한다. 실제 미해결 보호 predicate와 구별한다.
- **R5-06 채택:** deactivate transaction은 cleanup 실행 boolean만 반환하고 외부 결과는 tripId/alreadyDeactivated만 둔다. DB cleanupPending과 지도·서버 후처리 순서를 유지한다.
- **R5-07 채택:** checkPendingSync의 미사용 failedCount 반환만 삭제한다. 실제 stats와 총 보호 수 계산은 유지한다.
- **R5-08 채택:** lockOwnedTrip의 미사용 성공 trip payload 대신 undefined, 실패 시 MutationResult를 반환한다. 실제 부모 SELECT·잠금과5개 호출부 순서는 그대로다.
- **R5-09 채택:** schema가 이미 거절하는 날짜 null/NaN 분기와 미사용 userId를 제거한다. Date 변환은 한 번 하며 날짜 범위·시간대 검증은 유지한다. 공유 schema·wire는 바꾸지 않는다.
- **R5-10 채택:** mutateAsync 성공 검사의 구형 callback adapter를 mockResolvedValueOnce로 바꾼다.
- **R5-11:** M3-11과 통합한다.
- **R5-12 채택:** 한 행뿐인 it.each를 단일 사례로 바꾼다. 닫힘·열림·조회 순서는 유지한다.

## 변경 이유와 영향

- **R6-01 채택:** ScheduleScreen의 동일 표시 타입 세 곳을 파일 내부 ScheduleListItem 하나로 연결한다. null·optional·표시값 필드는 같다.
- **R6-02 채택:** 지정3개 suite만 기존 SQLite helper를 재사용한다. suite별 DB 생성·reset·기대값·실패 주입을 유지하고 helper나 범위 밖 검사는 바꾸지 않는다.
- **R6-03 채택:** 기존 서버 data-rows fixture를 사용하되 Schedule 검사의 `timeZone: null` 차이는 명시적으로 덮어쓴다. 기대값은 직접 적고 serializer로 만들지 않는다. 새 factory는 불필요하다.
- **R6-04 유지:** F2-09와 같은 비용 판단이다. 전수 검토를 위해 전수 수정할 필요는 없다.
- **R6-05:** M3-11과 통합한다.
- **K6-01〜04 유지:** 직접 실패/sync 거절, 일정/경비 CRUD·폼, 오류 파일 위치, 근거가 다른 검증·시계·직렬화·cleanup 책임을 강제로 합치지 않는다. 확인한 snapshot·ref·Promise·원문·transaction 보호는 역할을 보존한다.

모든 발견을 위와 같이 판단했다. 의미상 중복은 한 번 수정하며 개별 finding을 수정 개수로 세지 않는다. 구현·요구 충족 완료는 이 채택 문서만으로 주장하지 않는다. 실제 결과는 [구현 sync](implementation-sync.md), [구현 client](implementation-client.md), [구현 server·검사](implementation-server-tests.md), [Main 확인](main-checks.md), [독립 검증](verification.md)에 연결된다.
