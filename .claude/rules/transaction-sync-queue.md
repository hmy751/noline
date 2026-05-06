# 규칙: Transaction + Sync Queue

## 적용 범위

- client local mutation
- offline/manual input write
- activation/deactivation flow
- `sync_queue`를 만들거나 갱신하는 write path

## 규칙

- local DB 변경과 대응되는 `sync_queue` insert는 같은 `withTransaction` 안에서 처리한다.
- local write가 성공한 뒤 별도 단계에서 sync work를 enqueue하지 않는다.
- ownership model이 decision record로 바뀌기 전에는 map/search/directions 같은 Service Layer work를 `sync_queue`에 넣지 않는다.
- delete flow는 soft-delete와 pending-sync safety를 지켜야 한다.
- activation/deactivation cleanup은 local data를 지우기 전에 pending sync 상태를 확인한다.

## 마무리 확인

- [Guard Map](../guards/README.md)의 Transaction + sync_queue와 Soft Delete를 확인한다.
- cleanup 동작을 바꾼다면 [Deactivation Sync Queue Safety](../decisions/2025-11-20-deactivation-sync-queue-safety.md)를 읽는다.
