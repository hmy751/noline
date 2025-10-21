# Database Scripts

개발 및 유지보수를 위한 SQL 스크립트 모음

## 스크립트 목록

### setup-dev-db.sql

개발 환경 DB 초기 설정 스크립트

**실행 방법:**

```bash
docker exec -i noline-postgres psql -U postgres -d noline_dev < scripts/setup-dev-db.sql
```

**수행 작업:**

- trips.user_id를 nullable로 변경 (인증 추가 전)
- 테스트 유저 생성 (id=1, email=test@example.com)
- users 시퀀스 업데이트

## 주의사항

- 이 스크립트들은 개발 환경에서만 사용하세요
- 프로덕션 환경에서는 drizzle migration을 사용하세요
- 스크립트 실행 전 백업을 권장합니다
