-- ========================================
-- 시간 스키마 마이그레이션: ISO 8601 with timezone 통일
-- ========================================
-- 
-- 목적:
-- 1. schedules 테이블: date + time → scheduled_at TIMESTAMPTZ
-- 2. trips 테이블: timestamp → timestamptz (타임존 지원)
-- 
-- 실행 방법:
-- psql -U postgres -d noline -f migrate-to-timestamptz.sql
-- 
-- ⚠️ 주의: 프로덕션 환경에서는 반드시 백업 후 실행!
-- ========================================

BEGIN;

-- ========================================
-- 1. Schedules 테이블 마이그레이션
-- ========================================

-- 1-1. 새 컬럼 추가 (scheduled_at)
ALTER TABLE schedules 
ADD COLUMN scheduled_at TIMESTAMPTZ;

-- 1-2. 기존 데이터 변환 (date + time → scheduled_at)
-- 예: date='2024-01-15', time='14:30' → '2024-01-15T14:30:00+00:00' (UTC 기준)
UPDATE schedules 
SET scheduled_at = (date || 'T' || time || ':00+00:00')::TIMESTAMPTZ
WHERE date IS NOT NULL AND time IS NOT NULL;

-- 1-3. NOT NULL 제약 추가
ALTER TABLE schedules 
ALTER COLUMN scheduled_at SET NOT NULL;

-- 1-4. 기존 컬럼 삭제
ALTER TABLE schedules 
DROP COLUMN date,
DROP COLUMN time;

-- 1-5. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_at ON schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_schedules_trip_scheduled ON schedules(trip_id, scheduled_at);

-- ========================================
-- 2. Trips 테이블 마이그레이션 (timestamp → timestamptz)
-- ========================================

-- 2-1. 컬럼 타입 변경
ALTER TABLE trips 
ALTER COLUMN start_date TYPE TIMESTAMPTZ 
  USING start_date AT TIME ZONE 'UTC';

ALTER TABLE trips 
ALTER COLUMN end_date TYPE TIMESTAMPTZ 
  USING end_date AT TIME ZONE 'UTC';

ALTER TABLE trips 
ALTER COLUMN created_at TYPE TIMESTAMPTZ 
  USING created_at AT TIME ZONE 'UTC';

ALTER TABLE trips 
ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
  USING updated_at AT TIME ZONE 'UTC';

-- ========================================
-- 3. Expenses 테이블 마이그레이션 (timestamp → timestamptz)
-- ========================================

ALTER TABLE expenses 
ALTER COLUMN date TYPE TIMESTAMPTZ 
  USING date AT TIME ZONE 'UTC';

ALTER TABLE expenses 
ALTER COLUMN created_at TYPE TIMESTAMPTZ 
  USING created_at AT TIME ZONE 'UTC';

ALTER TABLE expenses 
ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
  USING updated_at AT TIME ZONE 'UTC';

-- ========================================
-- 4. Users 테이블 마이그레이션 (timestamp → timestamptz)
-- ========================================

ALTER TABLE users 
ALTER COLUMN created_at TYPE TIMESTAMPTZ 
  USING created_at AT TIME ZONE 'UTC';

ALTER TABLE users 
ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
  USING updated_at AT TIME ZONE 'UTC';

-- ========================================
-- 5. Schedules deletedAt 마이그레이션
-- ========================================

ALTER TABLE schedules 
ALTER COLUMN deleted_at TYPE TIMESTAMPTZ 
  USING deleted_at AT TIME ZONE 'UTC';

COMMIT;

-- ========================================
-- 검증 쿼리
-- ========================================
-- 
-- 마이그레이션 후 아래 쿼리로 검증:
-- 
-- SELECT 
--   table_name, 
--   column_name, 
--   data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('schedules', 'trips', 'expenses', 'users')
--   AND column_name LIKE '%date%' 
--    OR column_name LIKE '%at%'
-- ORDER BY table_name, column_name;
-- 
-- 예상 결과:
-- - scheduled_at: timestamp with time zone
-- - start_date: timestamp with time zone
-- - end_date: timestamp with time zone
-- - created_at: timestamp with time zone
-- - updated_at: timestamp with time zone
-- ========================================

