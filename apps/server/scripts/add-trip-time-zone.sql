-- 배포 전 PostgreSQL에 별도로 적용한다. 앱 실행은 이 migration을 자동 실행하지 않는다.
-- 기존 시각, 버전, updated_at은 변경하지 않는다. null은 도시 시간대 미확정 상태다.
-- 적용 순서: 이 DDL을 먼저 적용하고 새 서버를 배포한 뒤 새 client를 배포한다.
-- IF NOT EXISTS이므로 반복 적용할 수 있다. 적용 뒤 기존 행의 time_zone은 null이어야 한다.
-- SQLite는 client 초기화에서 같은 nullable 열을 추가한다. 기존 여행·큐는 삭제하지 않는다.
ALTER TABLE trips ADD COLUMN IF NOT EXISTS time_zone TEXT;

-- 기존 여행은 도시 좌표로 확인한 IANA 시간대만 update API로 지정한다.
-- update API가 updated_at/version을 갱신하므로 이후 pull에도 전달된다.
-- start_date/end_date는 원래 날짜 의도를 역추정하여 일괄 이동시키지 않는다.
