# .claude/ Directory

> Noline 프로젝트의 상세 구현 가이드 저장소

## 📁 디렉토리 구조

```
.claude/
├── README.md              # 📍 현재 파일 - 네비게이션 허브
│
├── core/                  # 🔧 핵심 가이드 (자주 참조)
│   ├── architecture.md
│   ├── local-architecture.md
│   ├── typescript.md
│   ├── time.md
│   ├── api-data.md
│   ├── components.md
│   └── error-handling.md
│
├── features/              # ⚡ 기능별 가이드
│   ├── subscription-system.md
│   ├── offline-map.md
│   ├── offline-routing.md
│   ├── currency.md
│   ├── form.md
│   └── local-first-impl.md
│
├── references/            # 📚 외부 스펙
│   ├── prd.md
│   ├── wireframe.md
│   └── images.md
│
├── sessions/              # 📝 설계 논의 (개발 전)
│   └── YYYY-MM-DD-[topic].md
│
└── decisions/             # 📋 결정 사항 (개발 후)
    └── YYYY-MM-DD-[topic].md
```

---

## 🔧 Core Guides (핵심 가이드)

> 개발 시 자주 참조하는 기본 가이드

| 파일                                                  | 라인수 | 주제                          | 언제 읽기            |
| ----------------------------------------------------- | ------ | ----------------------------- | -------------------- |
| [typescript.md](./core/typescript.md)                 | ~270   | TypeScript 규칙, z.infer 패턴 | TS 에러, 타입 작성시 |
| [architecture.md](./core/architecture.md)             | ~290   | FSD 구조, 계층별 책임         | 파일 위치 고민시     |
| [local-architecture.md](./core/local-architecture.md) | ~1,865 | Local-First 완전 가이드       | Sync 작업시 필수     |
| [time.md](./core/time.md)                             | ~1,005 | 시간 처리 완전 가이드         | 날짜/시간 작업시     |
| [api-data.md](./core/api-data.md)                     | ~430   | API/Data 레이어 패턴          | API/Query 작업시     |
| [components.md](./core/components.md)                 | ~680   | 컴포넌트 작성 가이드          | 컴포넌트 개발시      |
| [error-handling.md](./core/error-handling.md)         | ~470   | 에러 처리 패턴                | 에러 처리 구현시     |

---

## ⚡ Feature Guides (기능별 가이드)

> 특정 기능 구현 시 참조

| 파일                                                                 | 주제                        | 적용 대상        |
| -------------------------------------------------------------------- | --------------------------- | ---------------- |
| [features/subscription-system.md](./features/subscription-system.md) | 구독 시스템 (오프라인 준비) | 구독 기능 작업시 |
| [features/offline-map.md](./features/offline-map.md)                 | 오프라인 지도 (Mapbox)      | 지도 기능 작업시 |
| [features/offline-routing.md](./features/offline-routing.md)         | 오프라인 경로 (Directions)  | 경로 기능 작업시 |
| [features/currency.md](./features/currency.md)                       | 통화 처리 정책              | Expense 작업시   |
| [features/form.md](./features/form.md)                               | 폼 구현 패턴                | 폼 작성시        |
| [features/local-first-impl.md](./features/local-first-impl.md)       | Local-First 구현 디테일     | Sync 구현시      |

---

## 📚 References (참조 문서)

> 외부 스펙 및 기획 문서

| 파일                                                 | 주제          | 용도           |
| ---------------------------------------------------- | ------------- | -------------- |
| [references/prd.md](./references/prd.md)             | 제품 기획서   | 기능 스펙 확인 |
| [references/wireframe.md](./references/wireframe.md) | 디자인 스펙   | UI 디자인 확인 |
| [references/images.md](./references/images.md)       | 이미지 최적화 | 이미지 작업시  |

---

## 🗺️ 빠른 네비게이션

### 시작점: [Root CLAUDE.md](../CLAUDE.md)

프로젝트가 처음이면 여기부터 읽으세요!

### Workspace별 Context

- [Client CLAUDE.md](../apps/client/CLAUDE.md) - React Native 패턴
- [Server CLAUDE.md](../apps/server/CLAUDE.md) - Express API 패턴
- [Schema CLAUDE.md](../packages/schema/CLAUDE.md) - Type Contract
- [UI CLAUDE.md](../packages/ui/CLAUDE.md) - Component 철학

---

## 📋 태스크별 가이드 맵

### "새 Entity 추가하기"

1. 📖 [Schema CLAUDE.md](../packages/schema/CLAUDE.md) - Entity 정의
2. 📖 [Client CLAUDE.md](../apps/client/CLAUDE.md) - 클라이언트 구현
3. 📖 [local-architecture.md](./core/local-architecture.md) - sync_queue 패턴

### "UI 컴포넌트 만들기"

1. 📖 [UI CLAUDE.md](../packages/ui/CLAUDE.md) - 컴포넌트 철학
2. 📖 [components.md](./core/components.md) - 상세 작성 규칙
3. 📖 [typescript.md](./core/typescript.md) - TypeScript 패턴

### "API 엔드포인트 추가"

1. 📖 [Server CLAUDE.md](../apps/server/CLAUDE.md) - API 구조
2. 📖 [Schema CLAUDE.md](../packages/schema/CLAUDE.md) - Request/Response 정의
3. 📖 [api-data.md](./core/api-data.md) - API 레이어 패턴

### "Sync 이슈 디버깅"

1. 📖 [local-architecture.md](./core/local-architecture.md) - 전체 흐름 이해
2. 📖 [Client CLAUDE.md](../apps/client/CLAUDE.md) - withTransaction 패턴
3. 📖 [Server CLAUDE.md](../apps/server/CLAUDE.md) - sync 엔드포인트

### "경비(Expense) 기능 작업"

1. 📖 [features/currency.md](./features/currency.md) - 통화 처리 정책
2. 📖 [Client CLAUDE.md](../apps/client/CLAUDE.md) - 경비 구현
3. 📖 [Schema CLAUDE.md](../packages/schema/CLAUDE.md) - Expense Entity

### "폼 구현"

1. 📖 [features/form.md](./features/form.md) - 폼 패턴
2. 📖 [UI CLAUDE.md](../packages/ui/CLAUDE.md) - Input 컴포넌트
3. 📖 [typescript.md](./core/typescript.md) - Zod validation

### "오프라인 지도/경로 작업"

1. 📖 [features/offline-map.md](./features/offline-map.md) - 오프라인 지도 (Mapbox OfflineManager)
2. 📖 [features/offline-routing.md](./features/offline-routing.md) - 오프라인 경로 (Directions API)
3. 📖 [Client CLAUDE.md](../apps/client/CLAUDE.md) - 구현 패턴 요약

---

## 📌 참고사항

- `.claude/core/` - 자주 참조하는 핵심 가이드
- `.claude/features/` - 특정 기능 구현 시 참조
- `.claude/references/` - 외부 스펙 및 기획 문서

---

## 📝 Sessions & Decisions

### Sessions (설계 논의 - 개발 전)

논의 과정과 검토한 대안들을 기록:

- [2025-11-06: 구독 아키텍처 설계](./sessions/2025-11-06-subscription-architecture-design.md)
  - **초기 설계**: 3개 대안 비교 (Local-First 유지 vs 선택적 구독 vs 개수 제한)
  - **단순화 결정**: temp_cache 제거로 복잡도 50% 감소
  - **구현 명확화**: Sync Engine vs Offline-Prep 관계, 디렉토리 구조, 롤백 전략 분석
- [2025-11-07: 오프라인 지도 구현](./sessions/2025-11-07-offline-map-implementation.md)
  - **Mapbox 통합**: OfflineManager + SQLite 메타데이터 분리
  - **이슈 해결**: 앱 크래시, bounds 포맷, 중복 팩 처리
- [2025-11-08: 오프라인 라우팅 구현](./sessions/2025-11-08-offline-routing-implementation.md)
  - **Directions API 통합**: Polyline6 압축 + 3-Profile 전략
  - **이슈 해결**: ULID 에러, 카메라 초기화, UI 오버랩, 컴포넌트 통합

### Decisions (최종 결정 - 개발 후)

구현 완료 후 최종 결정 사항 기록 (/doc-save --decision):

- [002: Mapbox 오프라인 지도 통합](./decisions/002-offline-map-integration.md)
  - **결정**: Mapbox OfflineManager + SQLite 메타데이터 분리
  - **이유**: 관심사 분리, referenceCount 패턴으로 중복 방지
- [003: Mapbox 오프라인 라우팅 통합](./decisions/003-offline-routing-integration.md)
  - **결정**: Directions API v5 + Polyline6 압축 + 3-Profile 전략
  - **이유**: 85% 압축률, 다중 교통수단, 오프라인 완전 지원

---

## 🔄 History

- 2025-11-08: 오프라인 라우팅 기능 구현 완료 (Session, Feature Guide, ADR-003, Client CLAUDE 업데이트)
- 2025-11-07: 오프라인 지도 구현 문서 추가 (Session, Feature Guide, ADR-002)
- 2025-11-06: 구독 시스템 설계 문서 추가 (Session, Feature Guide)
- 2025-11-06: sessions/, decisions/ 디렉토리 추가
- 2025-11-05: 디렉토리 계층 구조 개선 (core/, features/, references/)
- 2024-11-05: .cursor/rules에서 .claude/로 마이그레이션
- 중복 제거 및 일관성 확보
- 네비게이션 구조 강화
