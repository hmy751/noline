# DB 스크립트의 적용 조건

새 로컬 DB는 [개발 시작](../../../START_GUIDE.md)의 Compose와 `pnpm server db:push`로 준비한다. 이 폴더의 SQL을 모두 실행하는 초기화 절차는 없다. 이 안내는 각 SQL의 용도·전제·영향을 소유하며 schema의 현재 shape는 [서버 schema](../src/db/schema.ts)가 소유한다.

기존 DB 변경은 대상 환경·현재 열/타입·보존할 데이터를 확인해 필요한 DDL만 적용한다. PostgreSQL 변경과 client SQLite 준비는 별도다. SQLite 열 추가는 client 앱 초기화가 맡는다. 제품의 저장·동기화·정리는 [Project 데이터 수명](../../../context/project/guidance/data-lifecycle/INDEX.md)을 따른다.

## 현재 변경에 사용할 수 있는 열 추가

### `add-trip-time-zone.sql`

기존 trips에 nullable `time_zone TEXT` 열을 추가한다. `IF NOT EXISTS`라 반복 적용할 수 있다. 기존 시각·버전·updated_at은 변경하지 않으며 기존 여행 시간대는 null로 남긴다. 기존 DB에는 **이 DDL → 서버 → client** 순서로 적용한다. 새 DB를 현재 schema로 push했다면 이미 포함된 열이다.

아래는 `apps/server`에서 Compose의 로컬 개발 DB에 적용하는 명령이다. 실제 대상이 다른 DB라면 접속값을 먼저 확인한다.

```bash
docker exec -i noline-postgres psql -U postgres -d noline_dev -v ON_ERROR_STOP=1 < scripts/add-trip-time-zone.sql
```

이 명령은 DB를 변경한다. 운영 DB에는 해당 환경의 승인된 schema 변경 절차로 DDL을 먼저 적용한다. 기존 여행은 앱 편집에서 도시 좌표로 확인한 시간대를 update API로 저장한다. 기존 기간을 추정해 일괄 이동하지 않는다. 날짜·시각 의미는 [Project 날짜 본문](../../../context/project/common/date-and-time.md)을 따른다.

## 과거 schema용 자료

| SQL | 당시 목적과 현재 주의점 |
| --- | --- |
| `add-trip-columns.sql` | country/latitude/longitude/city_id 열 추가. 현재 schema에 포함돼 있으므로 새 환경 필수 절차가 아니다. 열이 없는 과거 DB에서만 shape와 영향 확인 후 검토한다. |
| `setup-dev-db.sql` | 인증 도입 전 trips.user_id 제약 완화와 고정 ULID 테스트 유저 생성. 현재 없는 users.password를 insert하고 필수 provider/provider_id가 없으며 email 단독 unique에도 의존한다. **현재 schema에서 실행하지 않는다.** 현재 로그인은 OAuth로 사용자를 생성한다. |
| `migrate-to-timestamptz.sql` | 과거 schedules의 date+time을 scheduled_at으로 옮기고 timestamp를 변환한다. 기존 열 DROP과 UTC 해석을 포함하며 반복 실행용이 아니다. 현재 schema에서 일반 migration으로 실행하지 않는다. 주석의 DB명 `noline`도 Compose의 `noline_dev`와 다르다. |

`setup-dev-db.sql`은 users 시퀀스를 갱신하지 않는다. 과거 README의 숫자 id=1·시퀀스 설명과 SQL 실제 내용은 달랐다. 이 SQL을 고쳐 현재 seed로 재활용하는 작업은 별도 요구가 있을 때 설계한다.

## 물리삭제·과거 리셋 자료

| SQL | 실제 삭제 범위와 한계 |
| --- | --- |
| `delete-all-data.sql` | `DELETE FROM trips`로 모든 여행을 물리삭제하고 FK cascade로 일정·경비를 지운다. users/refresh_tokens와 client SQLite/queue 전체를 정리하는 스크립트가 아니다. soft delete·동기화 API를 거치지 않는다. |
| `reset-db.sql` | 과거 ULID 전환을 위한 expenses/schedules/trips/users 테이블 DROP 및 expense_category 삭제. 현재 refresh_tokens 테이블·auth_provider 타입을 명시적으로 제거하지 않으므로 **현재 DB 완전 리셋 절차가 아니다.** |

두 스크립트 모두 새 개발 환경 시작이나 연결 장애 복구에 필요하지 않다. 서버 물리삭제가 기기의 미전송 변경·잔여 데이터까지 정리하지 않으며, 기존 기기의 후속 sync와 충돌할 수 있다. 사용하려면 삭제 목적·대상 DB·복구 자료·기기 데이터 처리까지 별도로 정해야 한다. 여기에는 일반 실행용 삭제 명령을 제공하지 않는다.

## Migration과 검사 경계

[서버 package scripts](../package.json)의 `db:generate`는 SQL 생성, `db:push`는 현재 schema와 대상 DB의 직접 동기화다. 일반 migration runner는 등록돼 있지 않다. ignore된 로컬 `drizzle/`의 과거 생성물을 현재 운영 migration 체인으로 간주하지 않는다. 운영 적용은 실제 schema·데이터와 배포 호환을 대조한 DDL 및 적용 절차가 필요하다.

`run-integration-tests.mjs`는 SQL maintenance script가 아니라 전용 test DB를 시작하고 현 schema를 push한 뒤 검사·test volume 제거를 수행하는 실행기다. 기본 개발 DB는 건드리지 않지만 DB 생성·변경이 있는 검사이므로 읽기만 하는 검증과 구별한다.

2026-10-31에 SQL 본문·현 schema·Compose·package scripts를 정적으로 대조했다. SQL을 실제 DB에 실행하지 않았으며 운영 적용 성공이나 데이터 변환 안전성을 검증한 기록은 아니다. DB 변경 담당자가 SQL의 전제·현재 schema·이 안내를 함께 갱신한다.
