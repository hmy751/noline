# 규칙: Client-Side ID

## 적용 범위

- Entity create flow
- sync-owned row를 생성하는 client mutation
- client-created entity를 받는 server create endpoint
- create payload용 request schema

## 규칙

- client는 project wrapper인 `generateId()`로 entity ID를 만든다.
- React Native 코드에서 `ulid()`를 직접 호출하지 않는다.
- sync 대상 entity의 create request schema는 client-provided ID를 허용해야 한다.
- server create route는 client ID를 대체하지 말고 그대로 수용해 저장한다.
- schema, client mutation, local DB insert, sync payload, server route의 ID 전략을 함께 맞춘다.

## 마무리 확인

- [Guard Map](../guards/README.md)의 Client-Side ID를 확인한다.
- entity가 sync-owned라면 [Activation Router](activation-router.md)와 [Transaction + Sync Queue](transaction-sync-queue.md)도 확인한다.
