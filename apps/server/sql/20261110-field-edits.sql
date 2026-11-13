BEGIN;
-- 기존 값은 유지하고 항목별 편집 이력은 빈 상태로 시작한다.
-- updated_at/서버 도착 시각을 사용자 편집 표식으로 변환하지 않는다.
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS field_edits jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS field_edits jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS legacy_update_holds (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id text NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id text NOT NULL,
  payload_hash text NOT NULL,
  payload jsonb NOT NULL,
  current jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS legacy_update_holds_request_idx
  ON legacy_update_holds (user_id, table_name, record_id, payload_hash);

COMMIT;
