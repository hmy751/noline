-- ===================================
-- 개발환경 DB 초기 설정 스크립트
-- ===================================
-- 사용법: docker exec -i noline-postgres psql -U postgres -d noline_dev < scripts/setup-dev-db.sql

-- 1. trips.user_id를 nullable로 변경 (인증 추가 전까지 임시)
ALTER TABLE trips ALTER COLUMN user_id DROP NOT NULL;

-- 2. 테스트용 사용자 생성 (id=1)
INSERT INTO users (id, email, password, name) 
VALUES (1, 'test@example.com', 'password123', 'Test User') 
ON CONFLICT (email) DO NOTHING;

-- 3. users 테이블의 id 시퀀스를 다음 값으로 설정 (충돌 방지)
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));

-- 완료 메시지
SELECT 'Development database setup completed!' as status;

