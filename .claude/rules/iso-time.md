# 규칙: ISO Time

## 적용 범위

- schema, DB row, API payload의 날짜/시간 필드
- date/time을 다루는 form submit transform
- 날짜/시간 표시 utility

## 규칙

- 저장하고 전송하는 시간 값은 timezone이 있는 ISO 8601 datetime string으로 유지한다.
- 저장/전송과 화면 표시 format을 분리한다.
- 새 local formatter를 추가하기 전에 shared datetime utility를 먼저 찾는다.
- form의 date/time field는 submit boundary에서 ISO 값으로 결합한다.
- SQLite는 datetime 값을 text로 저장하고, server-side PostgreSQL field는 timezone-aware 의미를 보존한다.
- persisted data에 locale-specific string을 넣지 않는다.

## 마무리 확인

- [Guard Map](../guards/README.md)의 ISO 8601 time을 확인한다.
- 더 깊은 기준이 필요하면 [Time context](../context/README.md#time-and-date)를 읽는다.
