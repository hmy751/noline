# Schedule 소유권·soft-delete 접근 경계

## 맡은 결과

Ticket 05의 세 번째 단계로 Schedule 생성·중첩 목록·수정·삭제와 Trip activation에서 인증 사용자의 부모·자식 소유권과 일반 조회의 soft-delete 조건을 실제 query에 반영했다. 존재하지 않거나 다른 사용자 소유이거나 삭제된 부모 Trip은 같은 404로 처리해 자원 존재 여부를 별도 노출하지 않는다. Sync pull은 삭제 전파를 위해 soft-deleted row를 포함하는 기존 의미를 유지했다.

## 변경한 접근 경계

- Schedule 생성 전에 부모 Trip을 `id + userId + deletedAt IS NULL`로 확인하고, 통과한 경우에만 인증 사용자 ID로 Schedule을 생성한다.
- `GET /api/trips/:tripId/schedules`는 같은 조건으로 부모 접근을 확인한 뒤, 자식 Schedule도 `tripId + userId + deletedAt IS NULL`로 조회한다.
- Trip activation의 Schedule·Expense query에 인증 사용자 ID 조건을 추가해 잘못 연결된 다른 사용자 자식을 응답에서 제외한다.
- Schedule 수정·삭제는 선행 SELECT와 ID-only UPDATE를 없애고, 실제 UPDATE 자체에 `id + userId + deletedAt IS NULL`을 적용한다. 반환 row가 없으면 404로 처리한다.

전체 서버의 authorization helper, JWT middleware, 오류 envelope, Trip·Expense route 전반과 sync pull 삭제 전파는 변경하지 않았다.

## 테스트 순서와 관찰

제품 수정 전에 mock route 검사 네 개를 추가했다. 기존 구현에서는 접근할 수 없는 부모 Trip의 생성이 201, 중첩 목록이 200으로 반환됐고, scoped mutation 결과가 없는 수정·삭제는 undefined row를 직렬화하면서 500이 됐다. query 수정 뒤 기존 응답 계약과 새 차단 사례를 합친 server unit·route 검사 8개 파일의 29개 test가 Node 20.18.1에서 통과했다.

mock DB는 route의 분기와 status·response만 확인하고 Drizzle이 실제 PostgreSQL에서 적용하는 조건은 증명하지 못한다. 이를 분리해 확인하도록 다음 test 전용 구성을 추가했다.

- `docker-compose.test.yml`: 개발 DB와 다른 포트·DB 이름을 사용하는 PostgreSQL 14와 tmpfs 저장소
- `drizzle.integration.config.ts`: 환경변수로 받은 test DB에 현재 schema를 비대화형으로 적용하는 설정
- `vitest.integration.config.ts`: 일반 test 검색에서 분리한 실제 DB 검사 범위
- `scripts/run-integration-tests.mjs`: test DB 시작, schema 적용, 검사 실행, 컨테이너·network 폐기를 하나의 명령으로 조립

실제 PostgreSQL에는 사용자 A/B, 각자의 Trip, 삭제된 Trip, 정상·삭제·교차 소유 Schedule과 Expense를 넣었다. 부모가 다른 사용자 소유이거나 삭제된 생성 차단, 중첩 목록 필터, activation 자식 필터, 수정·삭제 UPDATE 조건을 확인한 4개 integration test가 통과했고 실행 뒤 test 컨테이너와 network가 제거됐다. 개발용 `noline_dev` DB와 영구 volume은 사용하지 않았다.

## 검증과 한계

- `pnpm --dir apps/server test`: 8개 파일, 29개 test 통과
- `pnpm --dir apps/server test:integration`: PostgreSQL integration 1개 파일, 4개 test 통과
- `pnpm --dir apps/server build`: Node 20 대상 ESM build 통과
- 변경 파일 Prettier 검사와 `git diff --check` 통과
- server typecheck는 기존 `src/routes/places.ts:138`의 Google Maps `Language` 타입 오류 하나로 실패했다.

integration test는 실제 PostgreSQL 14와 Drizzle query를 실행하지만 인증 middleware는 통제된 사용자로 대체한다. 따라서 JWT 검증, 배포 process, reverse proxy나 CI의 Docker 실행은 증명하지 않는다. 사용자는 상세 결과와 이 검증 한계를 확인한 뒤 3번 결과를 기록하고 함께 커밋하도록 요청했다. 이 저장 경계로 Ticket 05가 맡은 세 제품 결과의 구현은 마무리하지만, Workspace 전체 완료나 별도 오류 처리 범위의 수락을 뜻하지 않는다.
