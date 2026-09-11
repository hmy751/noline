# 05 — 서버 일정 응답의 날짜 변환

## 맡은 결과와 범위

`apps/server/src/routes/schedules.ts`의 생성·목록·단건·수정 응답에서 반복되는 scheduledAt/createdAt/updatedAt/deletedAt 변환을 한 의미로 관리한다. CRUD 쓰기 값·소유권·조회 조건·삭제 응답·activation/sync endpoint 통합은 제외한다. [Spec 품질·완료 판단](../spec/04-quality-and-completion.md)을 따른다.

## 실행 맥락과 접근

[추가 조사](../additional-research.md)의 Main 보고는 네 날짜의 반복 변환을 확인했다. DB row 타입에서 응답 값으로의 좁은 변환을 다루며 새 any·단언으로 넘기지 않는다. entity/envelope 검증과 오류 분기가 다르므로 통째로 합치거나 제거하지 않는다. 좌표 0 변환과 updateData:any는 별도 영향 범위다. client Ticket과 기술적 선행 관계는 없다.

## 완료 조건과 확인 방법

변경 전 실제 route handler에 고정 DB 반환 fixture를 공급해 각 endpoint의 응답 JSON·status·날짜 문자열·deletedAt null/값과 기존 오류 응답·전파를 확인한다. 수정 후 같은 조건으로 비교한다. 새로 추출한 순수 helper만 검사한 것을 변경 전 기준 검사로 제시하지 않는다.

DB를 대체한 handler 검사로 실제 인증·ownership·영속 저장 보존을 검증했다고 말하지 않는다. 해당 영역의 diff·사용처 영향 확인과 실행 검증을 구별한다. 같은 날짜 변환의 수정 위치가 줄고 호출부에서 DB row의 응답 변환 역할이 읽히는지 별도 판단한다.

## 현재 상태와 실제 결과

2026-09-11 실행 전 초안. Main은 반복 변환을 현재 코드에서 확인했다고 보고했다. server 검사·응답 검사와 제품 수정은 미실행이다. 순서는 Main 제안이다.
