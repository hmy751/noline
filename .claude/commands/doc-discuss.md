# /doc-discuss

> Claude-only command reference다. Codex rule이 아니며, 현재 작업 정책은 루트 `CLAUDE.md`와 `.claude/README.md`의 role map을 우선한다.

개발 시작 전 논의 내용을 분석하고 Session 파일 생성을 제안합니다.

## 사용 시점

- 새 기능 논의 중
- 정책 변경 고민 중
- 아키텍처 결정 논의 중
- 설계 대안 비교 중

## 실행 로직

### 1. 현재 대화 컨텍스트 분석

```markdown
분석 항목:

- 논의 주제 파악
- 핵심 키워드 추출 (Entity, API, Component, Sync 등)
- 결정이 필요한 질문 목록
- TODO 항목 추출
```

### 2. 관련 정책 문서 식별

현재 논의와 관련된 CLAUDE.md 및 가이드 문서를 자동으로 찾습니다:

```typescript
// 키워드 기반 문서 매칭
const documentMap = {
  Entity: ['packages/schema/CLAUDE.md', '.claude/core/selective-activation-architecture.md'],
  Component: ['packages/ui/CLAUDE.md', '.claude/core/components.md'],
  API: ['apps/server/CLAUDE.md', '.claude/core/api-data.md'],
  Sync: ['.claude/core/selective-activation-architecture.md', '.claude/features/activation-system.md'],
  Time: ['.claude/core/time.md'],
  Form: ['.claude/features/form.md'],
  // ... 등등
};
```

### 3. Session 저장 필요 여부 판단

**Session 저장 권장 케이스:**

- 🟢 아키텍처 결정이 필요한 경우
- 🟢 여러 대안을 비교/검토하는 경우
- 🟢 정책 변경을 논의하는 경우
- 🟢 복잡한 설계 논의 (30분 이상)

**Session 불필요 케이스:**

- 🔴 단순 질문/답변
- 🔴 간단한 버그 픽스 논의
- 🔴 코드 리뷰/설명
- 🔴 5분 미만 짧은 논의

### 4. Session 내용 구성

Session 파일에 포함할 내용을 자동으로 구성합니다:

```markdown
# [주제]

## Participants

- User
- Claude

## Date

YYYY-MM-DD

## Context

논의 배경 및 문제 상황

## Discussion Points

1. [핵심 논의 포인트 1]
2. [핵심 논의 포인트 2]
   ...

## Options Considered

### Option A: [대안 1]

- 장점:
- 단점:

### Option B: [대안 2]

- 장점:
- 단점:

## Open Questions

- [ ] [미결 질문 1]
- [ ] [미결 질문 2]

## Next Steps

- [ ] [다음 액션 1]
- [ ] [다음 액션 2]

## Related Documents

- [관련 CLAUDE.md 링크]
- [관련 .claude/ 가이드 링크]
```

## 출력 예시

```markdown
💡 논의 내용 분석

주제: Expense Entity에 영수증 이미지 필드 추가
키워드: Entity, @repo/schema, 이미지 저장, Local-First

논의 요약:

- 영수증 이미지를 Entity에 포함할지, 별도 테이블로 관리할지 결정 필요
- Option A: Entity에 receiptUrl 단일 필드 (간단, 1개만 지원)
- Option B: Receipt 별도 Entity (복잡, 여러 개 지원)

관련 정책 문서:

- packages/schema/CLAUDE.md - Entity 정의 규칙
- .claude/core/selective-activation-architecture.md - sync_queue 패턴
- .claude/references/images.md - 이미지 최적화

📝 Session 저장 권장

이유:

- 아키텍처 결정 필요 (Entity 설계)
- 여러 대안 비교 중
- 향후 확장성 고려 필요

제안 파일명:
.claude/sessions/2024-11-05-expense-receipt-design.md

Session을 저장하시겠습니까? [y/N]
```

## Session 저장 위치

```
.claude/sessions/
└── YYYY-MM-DD-[topic-slug].md
```

## 명령어 사용 흐름

```
사용자: "Expense에 영수증 기능 추가하려는데, 설계를 어떻게 하면 좋을까?"
      ↓
사용자: /doc-discuss 실행
      ↓
Claude: 논의 내용 분석 → Session 저장 제안
      ↓
사용자: y 입력
      ↓
Claude: Session 파일 생성 → 논의 계속
      ↓
      (개발 진행)
      ↓
      (개발 완료 후)
      ↓
사용자: /check-docs 실행
      ↓
      (Decision 작성시 Session 자동 참조)
```

## 주의사항

- **너무 자주 사용하지 말 것**: 모든 대화를 Session으로 만들 필요 없음
- **아키텍처 결정에 집중**: 중요한 설계 논의만 저장
- **Session은 선택 사항**: 개발 몰입 방해하지 않도록
- **빈도**: 월 1-2회 정도가 적당

## 관련 명령어

- `/check-docs` - 개발 완료 후 문서화 필요 여부 분석
- `/doc-save` - 문서 저장 및 자동 연결
- `/doc-refactor` - 정책 일관성 검증 및 리팩토링

## 다음 단계 제안

Session 파일 생성 후:

- **개발 진행**: → 실제 구현 시작
- **개발 완료 후**: → `/check-docs`로 문서화 필요도 확인
- **결정 사항 확정시**: → `/doc-save --decision`으로 ADR 작성
