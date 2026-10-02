# 규칙: ISO Time

## 적용 범위

- schema, DB row, API payload의 날짜/시간 필드
- date/time을 다루는 form submit transform
- 날짜/시간 표시 utility

## 규칙

- 한 시점을 나타내는 저장·전송 값은 timezone이 있는 ISO 8601 datetime string으로 유지한다.
- Expense `date`는 달력 날짜이므로 `YYYY-MM-DD`를 유지한다. 기존 datetime 호환과 적용 경계는 [날짜와 시각](../../context/project/common/date-and-time.md)을 따른다.
- 저장/전송과 화면 표시 format을 분리한다.
- 새 local formatter를 추가하기 전에 shared datetime utility를 먼저 찾는다.
- Schedule처럼 한 시점의 날짜·시간을 따로 입력하는 form은 submit boundary에서 ISO datetime으로 결합한다. 경비의 date-only에 시각을 붙이지 않는다.
- SQLite는 datetime 값을 text로 저장하고, server-side PostgreSQL field는 timezone-aware 의미를 보존한다.
- persisted data에 locale-specific string을 넣지 않는다.

## 마무리 확인

- [Guard Map](../guards/README.md)의 ISO 8601 time을 확인한다.
- 더 깊은 기준이 필요하면 [Time context](../context/README.md#time-and-date)를 읽는다.
