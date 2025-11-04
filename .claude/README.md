# .claude/ Directory

> Noline 프로젝트의 상세 구현 가이드 저장소

## 📚 파일 목록

### Core Guides (자주 참조)

| 파일                                             | 라인수 | 주제                          | 언제 읽기            |
| ------------------------------------------------ | ------ | ----------------------------- | -------------------- |
| [typescript.md](./typescript.md)                 | ~270   | TypeScript 규칙, z.infer 패턴 | TS 에러, 타입 작성시 |
| [architecture.md](./architecture.md)             | ~290   | FSD 구조, 계층별 책임         | 파일 위치 고민시     |
| [local-architecture.md](./local-architecture.md) | ~1,865 | Local-First 완전 가이드       | Sync 작업시 필수     |
| [time.md](./time.md)                             | ~1,005 | 시간 처리 완전 가이드         | 날짜/시간 작업시     |
| [components.md](./components.md)                 | ~680   | 컴포넌트 작성 가이드          | 컴포넌트 개발시      |
| [api-data.md](./api-data.md)                     | ~430   | API/Data 레이어 패턴          | API/Query 작업시     |
| [error-handling.md](./error-handling.md)         | ~470   | 에러 처리 패턴                | 에러 처리 구현시     |

### Feature Guides

| 파일                                                           | 주제                    | 적용 대상      |
| -------------------------------------------------------------- | ----------------------- | -------------- |
| [features/currency.md](./features/currency.md)                 | 통화 처리 정책          | Expense 작업시 |
| [features/form.md](./features/form.md)                         | 폼 구현 패턴            | 폼 작성시      |
| [features/local-first-impl.md](./features/local-first-impl.md) | Local-First 구현 디테일 | Sync 구현시    |

### References

| 파일                                                 | 주제          | 용도           |
| ---------------------------------------------------- | ------------- | -------------- |
| [references/prd.md](./references/prd.md)             | 제품 기획서   | 기능 스펙 확인 |
| [references/wireframe.md](./references/wireframe.md) | 디자인 스펙   | UI 디자인 확인 |
| [references/images.md](./references/images.md)       | 이미지 최적화 | 이미지 작업시  |

## 🗺️ 빠른 네비게이션

### 시작점: [Root CLAUDE.md](../CLAUDE.md)

프로젝트가 처음이면 여기부터 읽으세요!

### Workspace별 Context

- [Client CLAUDE.md](../apps/client/CLAUDE.md) - React Native 패턴
- [Server CLAUDE.md](../apps/server/CLAUDE.md) - Express API 패턴
- [Schema CLAUDE.md](../packages/schema/CLAUDE.md) - Type Contract
- [UI CLAUDE.md](../packages/ui/CLAUDE.md) - Component 철학

## 📋 태스크별 가이드 맵

### "새 Entity 추가하기"

1. 📖 [Schema CLAUDE.md](../packages/schema/CLAUDE.md) - Entity 정의
2. 📖 [Client CLAUDE.md](../apps/client/CLAUDE.md) - 클라이언트 구현
3. 📖 [local-architecture.md](./local-architecture.md) - sync_queue 패턴

### "UI 컴포넌트 만들기"

1. 📖 [UI CLAUDE.md](../packages/ui/CLAUDE.md) - 컴포넌트 철학
2. 📖 [components.md](./components.md) - 상세 작성 규칙
3. 📖 [typescript.md](./typescript.md) - TypeScript 패턴

### "API 엔드포인트 추가"

1. 📖 [Server CLAUDE.md](../apps/server/CLAUDE.md) - API 구조
2. 📖 [Schema CLAUDE.md](../packages/schema/CLAUDE.md) - Request/Response 정의
3. 📖 [api-data.md](./api-data.md) - API 레이어 패턴

### "Sync 이슈 디버깅"

1. 📖 [local-architecture.md](./local-architecture.md) - 전체 흐름 이해
2. 📖 [Client CLAUDE.md](../apps/client/CLAUDE.md) - withTransaction 패턴
3. 📖 [Server CLAUDE.md](../apps/server/CLAUDE.md) - sync 엔드포인트

### "경비(Expense) 기능 작업"

1. 📖 [features/currency.md](./features/currency.md) - 통화 처리 정책
2. 📖 [Client CLAUDE.md](../apps/client/CLAUDE.md) - 경비 구현
3. 📖 [Schema CLAUDE.md](../packages/schema/CLAUDE.md) - Expense Entity

### "폼 구현"

1. 📖 [features/form.md](./features/form.md) - 폼 패턴
2. 📖 [UI CLAUDE.md](../packages/ui/CLAUDE.md) - Input 컴포넌트
3. 📖 [typescript.md](./typescript.md) - Zod validation

## 📌 참고사항

- `.cursor/rules/` 디렉토리는 백업 원본입니다 (읽기 전용)
- `.claude/` 디렉토리가 현재 사용중인 가이드입니다
- 각 가이드는 원본을 기반으로 개선되었습니다

## 🔄 History

- 2024-11-05: .cursor/rules에서 .claude/로 마이그레이션
- 중복 제거 및 일관성 확보
- 네비게이션 구조 강화
