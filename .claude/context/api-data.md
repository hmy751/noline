---
description: API/Data legacy entrypoint for current repository and React Query implementation paths.
alwaysApply: true
---

# API/Data 구현 경로와 호환 진입

> 현재 API 계약·직렬화·검증·접근 경계의 Owner는 [Project API 계약과 변경 가이드](../../context/project/guidance/api-contracts.md)다.
> 오래된 web/custom-error 예시와 긴 레벨별 설명은 [_archive/api-data-legacy-patterns.md](../_archive/api-data-legacy-patterns.md)에 보존되어 있다.

이 문서는 기존 링크를 보존하면서 client의 Entity·repository·React Query 구현 위치를 안내한다. 공유 schema, request·response validation, Schedule·Expense 적용과 오류 정책의 열린 선택은 Project 본문에서 읽고, 실제 변경 대상은 아래 코드에서 확인한다.

## 현재 구현 위치

- API client는 `apps/client/src/shared/api/fetcher.ts`의 `apiClient`를 사용한다.
- Data Entity는 `model/api/lib/repository/data/ui` 구조를 우선한다.
- React Query hook은 repository를 호출하고 query key factory를 사용한다.
- Client API는 `entities/*/api`, Local SQLite 처리는 `entities/*/lib`, Local/Remote 선택은 `entities/*/repository`, query key와 hook은 `entities/*/data`에서 찾는다.

```text
entities/{entity}/
├── model/types.ts
├── api/{entity}.ts
├── lib/{entity}-local.ts
├── repository/{entity}-repository.ts
├── data/keys.ts
├── data/useGet*.ts
├── data/useCreate*.ts
└── ui/*.tsx
```

Trip, Schedule, Expense는 이 구조를 기준으로 작업한다. 작은 보조 entity는 필요만큼 축소할 수 있지만, sync 대상 Data Entity의 repository와 query key 경계는 유지한다. API request·response를 바꿀 때에는 이 구조 설명만으로 판단하지 않고 [Project API guidance](../../context/project/guidance/api-contracts.md)를 먼저 적용한다.

Repository는 Activation Router의 경계이며 화면과 data hook은 local/remote 선택을 알 필요가 없다. Mutation 성공 뒤에는 영향 범위의 query key만 invalidate한다. Activation/deactivation처럼 여러 entity를 pull하거나 cleanup하는 작업은 Trip, Schedule, Expense, Route key를 함께 확인한다.

## 구현 대조

- [ ] data hook이 repository를 거치고 직접 DB/API를 선택하지 않는가?
- [ ] local mutation은 transaction과 sync queue를 고려했는가?
- [ ] query key가 중복 문자열로 흩어져 있지 않은가?
- [ ] API 계약을 변경했다면 Project guidance에서 schema·serializer·접근·오류 경계를 확인했는가?
