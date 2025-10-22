-- ===================================
-- DB 완전 리셋 스크립트 (ULID 마이그레이션용)
-- ===================================
-- 사용법: docker exec -i noline-postgres psql -U postgres -d noline_dev < scripts/reset-db.sql

-- 1. 모든 테이블 삭제 (CASCADE로 의존성까지 모두 삭제)
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. ENUM 타입 삭제
DROP TYPE IF EXISTS expense_category CASCADE;

-- 완료 메시지
SELECT 'Database reset completed! Run db:push to apply new schema.' as status;

