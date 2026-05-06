# /doc-save

> Claude-only command reference다. Codex rule이 아니며, 현재 작업 정책은 루트 `CLAUDE.md`와 `.claude/README.md`의 role map을 우선한다.

개발 완료 후 문서를 저장하고 자동으로 연결합니다.

## 사용 시점

- `/check-docs` 실행 후
- 문서화가 필요하다고 판단된 경우
- 개발 완료 직후

## 명령어 플래그

```bash
# CHANGELOG만 저장 (기본)
/doc-save

# CHANGELOG + Decision 저장
/doc-save --decision
/doc-save -d

# 전체 체크 (CLAUDE.md 업데이트 포함)
/doc-save --all
/doc-save -a
```

## 실행 로직

### 1단계: Git Commit (필수)

모든 문서화는 Git commit부터 시작합니다:

```bash
# Staged changes 확인
git diff --cached

# Commit 생성 (사용자 메시지 입력 받음)
git commit -m "[user message]"

# Commit hash 저장 (문서 연결에 사용)
COMMIT_HASH=$(git rev-parse --short HEAD)
```

### 2단계: CHANGELOG 업데이트 (선택)

`.claude/CHANGELOG.md` 파일에 변경 사항 추가:

```markdown
# 📝 CHANGELOG

## 2024-11

### 2024-11-05
**[Feature]** 🟡 Expense 영수증 기능 추가
- Expense Entity에 receiptUrl 필드 추가
- withTransaction으로 원자성 보장
- Commit: [a3f9b2c](../commits/a3f9b2c)
- Decision: [2024-11-05-expense-receipt](./decisions/2024-11-05-expense-receipt.md)
- Session: [2024-11-05-expense-receipt-design](./sessions/2024-11-05-expense-receipt-design.md)

### 2024-11-04
**[Fix]** 🟢 동기화 버그 수정
- Router 패턴 미사용으로 인한 404 에러 해결
- 직접 db.select() 호출 제거

---

## 2024-10

...
```

**CHANGELOG 작성 원칙:**

- **간결하게**: 무엇을 했는지 1-2줄로 요약
- **링크 포함**: Commit, Decision, Session 자동 연결
- **날짜별 정리**: 최신이 위로
- **선택 사항**: Git commit만으로 충분하면 생략 가능

### 3단계: Decision 생성 (--decision 플래그시)

`.claude/decisions/YYYY-MM-DD-[topic].md` 파일 생성:

```markdown
# Expense 영수증 이미지 저장 구조

## Metadata

- Date: 2024-11-05
- Status: Accepted
- Commit: [a3f9b2c](../commits/a3f9b2c)

## Context

Expense에 영수증 이미지를 첨부하는 기능 추가 필요.
이미지를 어떻게 저장할지 구조 결정이 필요했다.

## Decision

Expense Entity에 `receiptUrl` 단일 필드 추가로 결정.

**이유:**

1. MVP 단계: 빠른 구현 우선
2. 대부분 경비당 영수증 1개만 필요
3. 복잡도 최소화

## Alternatives Considered

### Alternative 1: Receipt 별도 Entity

- 장점: 여러 영수증 지원 가능, 확장성 좋음
- 단점: 복잡도 증가, Sync 로직 추가 필요
- 거부 이유: MVP에 과도한 복잡도

### Alternative 2: receiptUrls 배열

- 장점: 단일 Entity로 여러 영수증 지원
- 단점: UI 복잡도 증가
- 거부 이유: 현재 요구사항에 맞지 않음

## Implementation

```typescript
// packages/schema/src/entities/expense.ts
export const expenseEntity = baseEntity.extend({
  tripId: z.string(),
  amount: z.number(),
  currency: z.string(),
  receiptUrl: z.string().url().optional(), // 추가
  // ...
});
```

## Consequences

**긍정적:**

- ✅ 빠른 구현 (1일 소요)
- ✅ 단순한 UI/UX
- ✅ @repo/schema 규칙 준수

**부정적:**

- ❌ 여러 영수증 지원 불가
- ❌ 향후 마이그레이션 필요할 수 있음

**마이그레이션 계획 (필요시):**

1. Receipt Entity 생성
2. 기존 receiptUrl → Receipt 테이블로 이관
3. Expense.receiptUrl 필드 Deprecated 처리

## Related Policies

- @repo/schema 규칙: packages/schema/CLAUDE.md:67-89
- withTransaction 패턴: .claude/core/selective-activation-architecture.md:234-289
- 이미지 최적화: .claude/references/images.md

## Related Documents

- Session: [expense-receipt-design](../sessions/2024-11-05-expense-receipt-design.md)
- CHANGELOG: [2024-11-05](../CHANGELOG.md#2024-11-05)
```

**Decision (ADR) 작성 원칙:**

- **Why 중심**: 왜 이 결정을 했는지 명확히
- **대안 비교**: 고려한 다른 옵션과 거부 이유
- **Consequences**: 긍정/부정 영향 모두 기록
- **정책 연결**: 어떤 CLAUDE.md 정책을 따랐는지 명시

### 4단계: CLAUDE.md 정책 업데이트 체크

Decision 내용에서 정책 키워드 감지:

```typescript
const policyKeywords = [
  'architecture', 'pattern', 'convention', 'rule',
  'policy', 'standard', 'guideline', 'principle',
  '정책', '규칙', '패턴', '원칙', '가이드',
  'Entity', 'Component', 'API', 'Sync'
];

const decision = readDecisionFile();
const needsCLAUDEUpdate = policyKeywords.some(keyword =>
  decision.content.toLowerCase().includes(keyword.toLowerCase())
);
```

**CLAUDE.md 업데이트가 필요한 경우:**

```markdown
⚠️  CLAUDE.md 정책 업데이트 권장

Decision에서 감지된 키워드:
- "Entity 필드 추가 패턴"
- "이미지 저장 정책"

업데이트 권장 문서:

1. packages/schema/CLAUDE.md
   현재: Entity 정의 규칙만 있음
   추가 권장: "Entity 확장 가이드라인" 섹션
   - 새 필드 추가시 고려사항
   - Optional vs Required 판단 기준
   - 타입 선택 가이드 (string vs object)

2. .claude/references/images.md
   현재: 이미지 최적화만 다룸
   추가 권장: "이미지 저장 정책" 섹션
   - URL vs Base64 vs File
   - 클라우드 스토리지 선택 (S3, Cloudinary 등)
   - Local-First에서 이미지 동기화 전략

지금 업데이트하시겠습니까? [y/N]
```

**업데이트 프로세스:**

1. 해당 CLAUDE.md 파일 열기
2. 적절한 섹션에 내용 추가
3. Decision에 "Updated CLAUDE.md" 표시

### 5단계: 문서 간 자동 연결

문서들을 자동으로 링크 연결:

```
Git Commit (a3f9b2c)
    ↓
CHANGELOG (.claude/CHANGELOG.md)
    ├─→ Commit: [a3f9b2c]
    ├─→ Decision: [2024-11-05-expense-receipt]
    └─→ Session: [2024-11-05-expense-receipt-design]
    ↓
Decision (.claude/decisions/2024-11-05-expense-receipt.md)
    ├─→ Commit: [a3f9b2c]
    ├─→ Session: [expense-receipt-design]
    └─→ CHANGELOG: [2024-11-05]
    ↓
CLAUDE.md (정책 반영 - 선택)
    └─→ Decision 참조 (필요시)
```

**자동 연결 로직:**

```typescript
// CHANGELOG에 자동 링크 추가
function addToChangelog(commit, decision?, session?) {
  const entry = `
### ${title}

- ${description}
- Commit: [${commit.hash}](../commits/${commit.hash})
${decision ? `- Related Decision: [${decision.id}](./decisions/${decision.file})` : ''}
${session ? `- Related Session: [${session.id}](./sessions/${session.file})` : ''}
  `;

  prependToFile('.claude/CHANGELOG.md', entry);
}

// Decision에 자동 링크 추가
function createDecision(commit, session?) {
  const content = `
# ${title}

## Metadata
- Date: ${date}
- Status: Accepted
- Commit: [${commit.hash}](../commits/${commit.hash})

...

## Related Documents
${session ? `- Session: [${session.title}](../sessions/${session.file})` : ''}
- CHANGELOG: [${date}](../CHANGELOG.md#${date})
  `;

  writeFile(`.claude/decisions/${date}-${slug}.md`, content);
}
```

## 출력 예시

### Case 1: CHANGELOG만 저장

```markdown
📝 문서 저장 완료

✅ Git Commit
   a3f9b2c "fix: TripCard 제목 오타 수정"

✅ CHANGELOG
   .claude/CHANGELOG.md 업데이트

   ### [2024-11-05] TripCard 오타 수정

   - TripCard 제목 오타 수정
   - Commit: [a3f9b2c](../commits/a3f9b2c)

문서화 완료!
```

### Case 2: CHANGELOG + Decision 저장

```markdown
📝 문서 저장 완료

✅ Git Commit
   a3f9b2c "feat: Expense Entity에 receiptUrl 필드 추가"

✅ CHANGELOG
   .claude/CHANGELOG.md 업데이트

   ### [2024-11-05] Expense 영수증 기능

   - Expense Entity에 receiptUrl 필드 추가
   - withTransaction으로 원자성 보장
   - Commit: [a3f9b2c](../commits/a3f9b2c)
   - Related Decision: [2024-11-05-expense-receipt](./decisions/2024-11-05-expense-receipt.md)
   - Related Session: [2024-11-05-expense-receipt-design](./sessions/2024-11-05-expense-receipt-design.md)

✅ Decision
   .claude/decisions/2024-11-05-expense-receipt.md

   # Expense 영수증 이미지 저장 구조

   ## Context
   영수증 이미지를 Entity에 포함할지, 별도 테이블로 관리할지 결정 필요

   ## Decision
   Expense Entity에 receiptUrl 단일 필드 추가

   ... (전체 내용)

⚠️  CLAUDE.md 정책 업데이트 권장

Decision에서 감지된 키워드:
- "Entity 필드 추가"
- "이미지 저장"

업데이트 권장 문서:
1. packages/schema/CLAUDE.md
   섹션: "Entity 확장 가이드라인" 추가 권장

2. .claude/references/images.md
   섹션: "이미지 저장 정책" 추가 권장

지금 업데이트하시겠습니까? [y/N]
```

### Case 3: CLAUDE.md 업데이트 포함

```markdown
📝 문서 저장 완료

✅ Git Commit
   a3f9b2c "feat: Expense Entity에 receiptUrl 필드 추가"

✅ CHANGELOG
   (업데이트 완료)

✅ Decision
   (생성 완료)

✅ CLAUDE.md 업데이트

   1. packages/schema/CLAUDE.md
      추가: "Entity 확장 가이드라인" 섹션

   ## Entity 확장 가이드라인

   ### 새 필드 추가시 체크리스트

   - [ ] Optional vs Required 판단
   - [ ] 타입 선택 (string vs object vs 별도 Entity)
   - [ ] @repo/schema 규칙 준수 확인
   - [ ] 클라이언트-서버 계약 업데이트
   - [ ] Sync 로직 영향 확인

   ### 판단 기준

   - **단일 필드**: MVP, 단순 데이터 (예: receiptUrl)
   - **별도 Entity**: 복잡한 구조, 1:N 관계, 재사용성

   참고 Decision:
   - [Expense 영수증 구조](../decisions/2024-11-05-expense-receipt.md)

   2. .claude/references/images.md
      추가: "이미지 저장 정책" 섹션

전체 문서 연결 완료!

문서 흐름:
Git (a3f9b2c) → CHANGELOG → Decision → CLAUDE.md
```

## 문서 저장 위치

```
.claude/
├── CHANGELOG.md                                    # 변경 로그
├── sessions/
│   └── 2024-11-05-expense-receipt-design.md       # 논의 세션
├── decisions/
│   └── 2024-11-05-expense-receipt.md              # 결정 사항
└── (CLAUDE.md는 기존 위치에 업데이트)
```

## 관련 명령어

- `/check-docs` - 변경사항 기반 문서화 필요도 판단
- `/doc-discuss` - 개발 전 논의 내용 정리
- `/doc-refactor` - 정책 일관성 검증 및 리팩토링

## 다음 단계 제안

문서 저장 후 다음 액션:

- **정책 일관성 확인 필요시**: → `/doc-refactor`로 전체 검증 (선택)
- **추가 변경사항 있을 경우**: → `/check-docs`로 다시 확인
- **모두 완료된 경우**: → 아래 문서 커밋으로 마무리

### 최종: 문서 파일 커밋

Step 2-4에서 생성/수정된 문서 파일을 별도 커밋합니다:

```bash
git add .claude/CHANGELOG.md .claude/decisions/ .claude/sessions/ CLAUDE.md
git commit -m "docs: 문서 업데이트 (CHANGELOG, Decision 등)"
```

> **결과**: 코드 커밋 (Step 1) + 문서 커밋 = 총 2회 커밋

## 주의사항

- **Git commit 먼저**: 코드 변경 commit 이후 문서화 시작
- **문서도 커밋**: 생성된 문서 파일은 별도 커밋으로 마무리
- **선택 사항**: 모든 commit에 Decision 필요 없음 (월 1-2회)
- **자동 연결**: Session/Decision/CHANGELOG 자동으로 링크
- **CLAUDE.md**: 정책 수립시만 업데이트 (분기별)

## 빈도 가이드

| 작업            | 빈도     | 필수 |
| --------------- | -------- | ---- |
| Git commit      | 매일     | ✅   |
| /doc-save       | 주간     | ❌   |
| /doc-save -d    | 월간     | ❌   |
| CLAUDE.md 업데이트 | 분기     | ❌   |

**80%는 Git commit만으로 충분**합니다!

## 참고 명령어

- `/doc-discuss` - 개발 전 논의 내용 정리
- `/check-docs` - 문서화 필요 여부 분석
