-- ===================================
-- 개발환경 DB 초기 설정 스크립트
-- ===================================
-- 사용법: docker exec -i noline-postgres psql -U postgres -d noline_dev < scripts/setup-dev-db.sql

-- 1. trips.user_id를 nullable로 변경 (인증 추가 전까지 임시)
ALTER TABLE trips ALTER COLUMN user_id DROP NOT NULL;

-- 2. 테스트용 사용자 생성 (ULID: 01HZQ8K9X7M2N3P4Q5R6S7T8V9)
-- 이 ULID는 서버 코드에서도 하드코딩되어 테스트용으로 사용됩니다.
-- 주의: ULID는 Crockford's Base32 사용 (I, L, O, U 제외)
INSERT INTO users (id, email, password, name) 
VALUES ('01HZQ8K9X7M2N3P4Q5R6S7T8V9', 'test@example.com', 'password123', 'Test User') 
ON CONFLICT (email) DO NOTHING;

-- 완료 메시지
SELECT 'Development database setup completed!' as status;

