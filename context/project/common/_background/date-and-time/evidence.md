# 날짜·시각 선택의 근거

[형성 맥락](context.md)의 선택과 한계를 재검토할 최소 근거다. 발췌는 보존된 제품 결정과 작업 기록에 있는 문구이며 원 대화 전체의 재검증은 아니다.

## 저장 후 응답 변환만으로는 입력 실패를 해결하지 못했다

2026-10-02 경비 날짜 결정에 기록된 질문은 “서버에서 이미 한다고 했으면서 … 여기서 왜 맞춰야 하는지”였다. 요청이 date-only 검사에서 거절되면 serializer에 도달하지 않는다는 차이를 확인했다. 공유 규칙을 Repository 분기 전과 서버 입력에 적용하고 폼·serializer의 각 책임을 유지하는 설명 뒤 사용자가 “그럼 수정해봐”로 실행을 요청했다. 실제 HTTP adapter 한 곳만 보정하는 대안은 Local·sync를 덮지 못했다.

## 도시 시간대를 사용하되 기존 저장 일관성을 유지했다

2026-10-06 도시 시간대 결정은 사용자의 “기존에 데이터 utc 저장이나 이런건 일관성을 유지하고 여행, 일정, 경비 등 해당 도시의 타임존을 고려해서 해당 로컬의 시간을 기준으로 … 저장하고 표시”를 보존한다. 이 선택은 Trip 기간 date-only 전환을 채택한 것이 아니다. 기존 시간대 누락의 원래 현지 날짜를 추정해 일괄 이동하는 것도 제외했다.

## 2026-10-31 직접 코드와 비교한 범위

`getTimeZoneDayStartISO`는 자정이 없는 날의 첫 유효 시점을 사용하고 날짜 전체가 없으면 거절한다. `combineDateTimeInTimeZoneToISO`는 사용자가 고른 일정 시각이 DST 공백이면 거절한다. 두 helper를 동일한 자정/공백 계약으로 요약하지 않았다.

`POST /trips`의 legacyCreateTripRequest는 요청 출처를 확인하지 않는다. 과거 미전송 CREATE를 보존하려는 목적과 현재 일반 생성 경계의 누락·null 수용을 구별했다. Local Schedule 반환은 scheduledAt만 parse하며 전체 entity 입수 검사는 activation/pull의 별도 경계다.

활성 Trip Local update는 종료일·시간대 변경 때 activation.expiresAt을 갱신한다. pull/upsert는 Trip을 갱신하고 activation 기록은 별도로 맞추지 않는다. 지도 cleanup은 최신 Trip으로 만료를 다시 계산한다. 저장 metadata가 모든 입수 경로에서 최신이라는 보장을 문서에서 제거하고 실제 범위를 밝혔다. 구체 검사·실행 한계는 해당 이관 Work의 결과가 보존한다.
