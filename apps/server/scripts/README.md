# Database Scripts

개발 및 유지보수를 위한 SQL 스크립트 모음

## 스크립트 목록

### add-trip-time-zone.sql

기존 여행에 nullable `time_zone` 열을 추가한다. 기존 기간·일정·경비 값은 변경하지 않으며, 기존 여행의 시간대는 앱의 여행 편집에서 도시 좌표로 확인해 적용한다.

`apps/server`에서 로컬 개발 DB에 적용한다.

```bash
docker exec -i noline-postgres psql -U postgres -d noline_dev -v ON_ERROR_STOP=1 < scripts/add-trip-time-zone.sql
```

DB 열 추가 → 서버 실행 → client 실행 순서로 적용한다. SQL은 반복 실행할 수 있으며 client의 SQLite 열 추가는 앱 초기화에서 수행한다. 운영 환경에는 같은 DDL을 해당 환경의 migration 절차로 먼저 적용해야 한다.

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
