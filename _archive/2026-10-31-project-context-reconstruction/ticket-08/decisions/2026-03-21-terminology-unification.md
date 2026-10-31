# Decision: 프로젝트 용어 통일 (Terminology Unification)

**날짜**: 2026-03-21
**작성자**: Claude & 개발팀
**상태**: Accepted
**영향 범위**: High - 전체 문서 및 코드 주석

## 1. 배경 (Context)

### 문제 상황

프로젝트가 v1.0 → v2.0 → v3.0으로 진화하면서 같은 개념에 대해 여러 용어가 혼재하는 상황이 발생했습니다:

- **라우터**: "Offline-Prep Router", "Hybrid Router", "라우팅 레이어" — 3가지 이름
- **ID 전략**: "Echo Protocol" — 실체는 Client-Side ID Generation인데 자체 프로토콜명 부여
- **아키텍처**: "Local-First", "Offline-First", "Local-First, Server-Aware" — 혼용
- **시스템 이름**: "Selective Activation", "오프라인 활성화 시스템", "오프라인 구독" — 3가지

### 발생한 문제

1. **이력서 ↔ 코드 간 용어 불일치**: 이력서에서 "Hybrid Router"라고 쓰지만 코드에 "Hybrid"는 0회 (ID 전략의 "ULID Hybrid Mode" 1회뿐)
2. **과잉 명명 리스크**: "Echo Protocol"은 업계 표준 용어 "Client-Side ID Generation"으로 충분히 설명 가능. 면접관에게 "간단한 걸 포장하는 사람"으로 비칠 수 있음
3. **v3.0 실체 불일치**: 순수 "Local-First"는 v1.0에 해당. v3.0은 활성화된 여행만 Local-First이므로 "Selective Local-First"가 정확

### 판단 기준

> **자체 용어가 정당한 기준**: "이 이름 없이 매번 설명하면 3문장 이상 필요한가?"

- Echo Protocol → "클라이언트가 ID 생성" 한 문장이면 끝 → **이름이 과잉**
- Selective Activation → 한 문장으로 안 끝남 → **이름이 정당**
- Activation Router → 활성화 상태로 분기 → **이름이 정당**

## 2. 결정 (Decision)

### 2.1 확정된 용어 테이블

| 개념 | 기존 (혼재) | **통일 용어** | 이유 |
|------|-----------|-------------|------|
| 아키텍처 | Local-First / Offline-First / Local-First, Server-Aware | **Selective Local-First** | v3.0은 활성화된 여행만 Local-First. "Selective"가 핵심 차별점 |
| 라우터 | Offline-Prep Router / Hybrid Router / 라우팅 레이어 | **Activation Router** | 활성화 상태로 분기한다는 실체가 바로 읽힘 |
| ID 전략 | Echo Protocol | **Client-Side ID Generation** | 업계 표준 용어. 한 문장 설명 가능 → 자체 명명 불필요 |
| UX 비유 | 오프라인 보험 / 오프라인 구독 | **오프라인 보험** | "구독"은 결제 뉘앙스. "보험"이 더 정확 |

### 2.2 맥락별 사용 규칙

| 맥락 | "선택적 활성화" 사용 | 이유 |
|------|-------------------|------|
| 현재 상태 문서 (CLAUDE.md, README) | Selective Local-First 아키텍처 | 현재 상태를 정확히 반영 |
| UX/기능 설명 | "선택적 활성화" (동작 설명) | "사용자가 여행을 선택적으로 활성화하면~" |
| 변화 과정 문서 (CHANGELOG, sessions, decisions) | 당시 용어 유지 + 현재 용어 병기 | 역사적 맥락 보존 |
| 아카이브 | 그대로 유지 | 당시 기록 |
| 코드 주석 | 새 용어 | 현재 코드가 참조하는 문서 |

### 2.3 변경하지 않는 것

- **파일명/함수명**: `offline-prep/router.ts`, `routeTripQuery()` 등은 그대로 유지 (리팩토링 범위 아님)
- **아카이브 문서**: `.claude/_archive/` — 당시 기록으로서 가치
- **변수명/타입명**: 코드 동작에 영향을 주는 변경 없음

## 3. 근거 (Rationale)

### "Echo Protocol" 제거 이유

코드에서 10회 이상 사용되는 내부 용어였지만:
- 실체: 클라이언트가 ULID 생성 → 서버가 수용
- 업계 표준: "Client-Side ID Generation" 또는 "Client-Generated ID"
- 리스크: 면접에서 "Echo Protocol이 뭔가요?" → "Client-Side ID입니다" → "...그걸 프로토콜이라고?"

### "Selective Local-First" 채택 이유

| 버전 | 아키텍처 실체 | 적합한 이름 |
|------|-------------|-----------|
| v1.0 | 모든 데이터 로컬 우선 | Pure Local-First |
| v2.0 | 활성화된 여행만 로컬 우선 | Selective Local-First |
| v3.0 | v2.0 + Policy Layer | Selective Local-First + Policy-Driven Extension |

순수 "Local-First"는 v1.0에만 해당. v2.0부터 "선택적"이라는 게 핵심 차별점.

### "Activation Router" 채택 이유

- "Hybrid Router": 뭐와 뭐의 hybrid인지 모호
- "Offline-Prep Router": "Prep"이 무엇인지 추가 설명 필요
- "Activation Router": 활성화 상태를 보고 분기 → 한 단어로 이해 가능

## 4. 영향 범위 (Impact)

### 변경 대상

- **문서 ~15파일**: Root CLAUDE.md, selective-activation-architecture.md, workspace CLAUDE.md 등
- **코드 주석 ~15파일**: JSDoc 주석의 "Echo Protocol" → "Client-Side ID" 등
- **변수/함수명 변경**: 0건 (코드 동작 무영향)

### 변경 원칙

1. **현재 상태 문서**: 새 용어로 통일
2. **역사 문서 (CHANGELOG, sessions)**: 당시 용어 유지, 필요시 "(현재: Activation Router)" 병기
3. **아카이브**: 변경 없음

## 5. 참고

- 이 결정은 이력서/포트폴리오 용어와의 정합성도 고려함
- 코드 내 파일명(`offline-prep/`)은 향후 리팩토링 시 별도 결정
