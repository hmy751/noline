-- trips 테이블에 도시 정보 컬럼 추가
ALTER TABLE trips ADD COLUMN IF NOT EXISTS country varchar(100);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS latitude numeric(10, 7);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS longitude numeric(10, 7);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS city_id integer;

-- 완료 메시지
SELECT 'Trip columns added successfully!' as status;

