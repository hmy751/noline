# 규칙: Schema First

## 적용 범위

- `packages/schema/**`
- client/server request와 response contract
- 공유 entity type과 API DTO

## 규칙

- `@repo/schema`가 공유 contract를 소유한다.
- client/server type을 만들기 전에 Zod schema를 먼저 정의하거나 갱신한다.
- exported TypeScript type은 schema에서 `z.infer`로 추론한다.
- schema가 contract를 소유할 수 있다면 별도 DTO type을 손으로 복제하지 않는다.
- client와 server code는 shape을 복사하지 말고 shared schema나 inferred type을 import한다.
- form-only state는 local type을 가질 수 있지만, submit payload는 shared request schema로 수렴해야 한다.

## 마무리 확인

- [Guard Map](../guards/README.md)의 Schema-first를 확인한다.
- schema 변경이 create flow에 영향을 주면 [Client-Side ID](client-side-id.md)도 확인한다.
