# /check-docs

개발 완료 후 어떤 문서화가 필요한지 실제 정책을 기반으로 분석합니다.

## 사용 시점

- 개발 완료 직후
- Git commit 전
- 변경 사항을 문서화할지 판단이 필요할 때

## 핵심 원칙

**중요: 임의 기준 사용 금지**

- ❌ 잘못된 방법: "50줄 이하면 문서 불필요" 같은 임의 기준
- ✅ 올바른 방법: **실제 CLAUDE.md를 읽고** 정책 기반 판단

## 실행 로직

### 1단계: 정책 데이터베이스 구축

모든 프로젝트 정책 문서를 읽고 파싱합니다:

```typescript
const policyDocuments = [
  // 핵심 CLAUDE.md 파일들
  'CLAUDE.md',
  'apps/client/CLAUDE.md',
  'apps/server/CLAUDE.md',
  'packages/schema/CLAUDE.md',
  'packages/ui/CLAUDE.md',

  // 상세 가이드
  '.claude/core/typescript.md',
  '.claude/core/architecture.md',
  '.claude/core/selective-activation-architecture.md',
  '.claude/core/time.md',
  '.claude/core/api-data.md',
  '.claude/core/components.md',
  '.claude/core/error-handling.md',

  // 기능별 가이드
  '.claude/features/currency.md',
  '.claude/features/form.md',
  '.claude/features/activation-system.md',
  '.claude/features/manual-input.md',

  // 참조 문서
  '.claude/references/prd.md',
  '.claude/references/wireframe.md',
  '.claude/references/images.md',
];
```

### 2단계: 정책 맵 생성

문서에서 추출할 핵심 정책들:

```typescript
interface PolicyRule {
  name: string; // 정책 이름
  description: string; // 정책 설명
  filePatterns: string[]; // 적용 파일 패턴
  keywords: string[]; // 감지 키워드
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string; // 출처 (파일:라인)
}

// 예시: CLAUDE.md에서 자동 추출
const policies: PolicyRule[] = [
  {
    name: '@repo/schema 규칙',
    description: 'schema만 export, 타입은 z.infer 사용',
    filePatterns: ['packages/schema/**/*.ts'],
    keywords: ['schema', 'entity', 'z.infer', 'zod'],
    severity: 'critical',
    source: 'packages/schema/CLAUDE.md:67-89',
  },
  {
    name: 'withTransaction 패턴',
    description: 'DB + sync_queue 원자성 보장',
    filePatterns: ['apps/client/src/entities/**/*.ts'],
    keywords: ['withTransaction', 'sync_queue', 'transaction'],
    severity: 'high',
    source: '.claude/core/selective-activation-architecture.md:234-289',
  },
  {
    name: 'ISO 8601 시간 형식',
    description: '모든 시간 데이터는 ISO 8601',
    filePatterns: ['**/*.ts'],
    keywords: ['date', 'time', 'timestamp', 'Date', 'DateTime'],
    severity: 'medium',
    source: '.claude/core/time.md:45-78',
  },
  {
    name: 'Echo Protocol',
    description: '클라이언트가 ULID 생성, 서버는 수용',
    filePatterns: ['apps/client/src/entities/**/*.ts', 'apps/server/src/routes/**/*.ts'],
    keywords: ['ulid', 'generateId', 'echo'],
    severity: 'critical',
    source: '.claude/core/selective-activation-architecture.md:123-156',
  },
  {
    name: 'Soft Delete',
    description: 'deletedAt 필드로 소프트 삭제',
    filePatterns: ['**/*.ts'],
    keywords: ['delete', 'deletedAt', 'remove'],
    severity: 'medium',
    source: 'CLAUDE.md:256',
  },
  {
    name: 'React Query 캐시 키',
    description: 'Query Key Factory 패턴 사용',
    filePatterns: ['apps/client/src/**/*.ts'],
    keywords: ['useQuery', 'useMutation', 'queryKey'],
    severity: 'high',
    source: '.claude/core/api-data.md:178-234',
  },
  {
    name: 'Component 외부 margin 금지',
    description: '재사용성을 위해 컴포넌트는 내부만 관리',
    filePatterns: ['packages/ui/**/*.tsx', 'apps/client/src/**/*.tsx'],
    keywords: ['margin', 'component', 'ui'],
    severity: 'low',
    source: '.claude/core/components.md:89-112',
  },
  // ... CLAUDE.md에서 더 많은 정책 자동 추출
];
```

### 3단계: Git Diff 분석

변경된 파일과 내용을 분석합니다:

```bash
# 변경된 파일 목록
git diff --name-only HEAD

# 각 파일의 변경 내용
git diff HEAD

# 추출 정보:
# 1. 변경 파일 경로 → filePatterns 매칭
# 2. 추가/삭제된 import → 관련 정책 파악
# 3. 코드 내 키워드 → keywords 매칭
# 4. 함수/변수명 → 관련 정책 파악
```

### 4단계: 정책 매칭

```typescript
function matchPolicies(gitDiff: GitDiff, policies: PolicyRule[]) {
  const affectedPolicies: AffectedPolicy[] = [];

  for (const file of gitDiff.files) {
    // 1. 파일 경로로 매칭
    const matchedByPath = policies.filter((p) => p.filePatterns.some((pattern) => minimatch(file.path, pattern)));

    // 2. 변경 내용에서 키워드 검색
    const diff = file.diff;
    const matchedByKeyword = policies.filter((p) => p.keywords.some((keyword) => diff.includes(keyword)));

    // 3. Import 문 분석
    const imports = extractImports(diff);
    const matchedByImport = policies.filter((p) =>
      // 예: from '@repo/schema' → @repo/schema 정책
      imports.some((imp) => p.name.includes(imp)),
    );

    // 합치기
    const matched = [...new Set([...matchedByPath, ...matchedByKeyword, ...matchedByImport])];

    affectedPolicies.push(
      ...matched.map((policy) => ({
        policy,
        file: file.path,
        reason: determineReason(file, policy),
      })),
    );
  }

  return affectedPolicies;
}
```

### 5단계: 문서화 필요 판단

**실제 정책 영향 기반 판단 (임의 기준 아님):**

```typescript
function recommendDocumentation(affectedPolicies: AffectedPolicy[]) {
  // Critical 정책 변경 → Decision 필수
  if (affectedPolicies.some((p) => p.policy.severity === 'critical')) {
    return {
      type: 'Decision',
      reason: 'Critical 정책 변경 감지',
      policies: affectedPolicies.filter((p) => p.policy.severity === 'critical'),
    };
  }

  // High 정책 3개 이상 → Decision 권장
  const highPolicies = affectedPolicies.filter((p) => p.policy.severity === 'high');
  if (highPolicies.length >= 3) {
    return {
      type: 'Decision',
      reason: '여러 High 정책 동시 변경',
      policies: highPolicies,
    };
  }

  // High 정책 1-2개 → CHANGELOG 권장
  if (highPolicies.length > 0) {
    return {
      type: 'CHANGELOG',
      reason: 'High 정책 변경',
      policies: highPolicies,
    };
  }

  // Medium 정책 5개 이상 → CHANGELOG 권장
  const mediumPolicies = affectedPolicies.filter((p) => p.policy.severity === 'medium');
  if (mediumPolicies.length >= 5) {
    return {
      type: 'CHANGELOG',
      reason: '광범위한 변경',
      policies: mediumPolicies,
    };
  }

  // 정책 영향 없음 → Git commit만 충분
  return {
    type: 'Git commit only',
    reason: '정책 영향 없음',
    policies: [],
  };
}
```

## 출력 예시

### Case 1: Decision 필요

```markdown
📋 문서화 분석 결과

변경 파일: 3개

- packages/schema/src/entities/expense.ts
- apps/client/src/entities/expense/model/mutations.ts
- apps/client/src/entities/expense/ui/ExpenseForm.tsx

영향받는 정책: 2개

🔴 [Critical] @repo/schema 규칙
파일: packages/schema/src/entities/expense.ts
감지: Entity 스키마 수정 (receiptUrl 필드 추가)
정책: "schema만 export, 타입은 z.infer 사용"
출처: packages/schema/CLAUDE.md:67-89

변경 내용:

- receiptUrl: z.string().url().optional(),

🟡 [High] withTransaction 패턴
파일: apps/client/src/entities/expense/model/mutations.ts
감지: withTransaction 사용
정책: "DB + sync_queue 원자성 보장"
출처: .claude/core/selective-activation-architecture.md:234-289

변경 내용:

- await withTransaction(async () => {
- await db.update(expense).set({ receiptUrl });
- await insertSyncQueue({ ... });
- });

📝 권장사항: Decision 문서 작성

이유: Critical 정책 변경 (Entity 스키마 수정)

Decision에 포함할 내용:

1. Expense Entity에 receiptUrl 필드를 추가한 이유
2. 왜 단일 필드로 결정했는가? (vs 별도 Receipt Entity)
3. @repo/schema 규칙을 준수했는가?
4. withTransaction으로 원자성을 보장했는가?
5. 향후 여러 영수증 지원 시 마이그레이션 계획

관련 Session:

- .claude/sessions/2024-11-05-expense-receipt-design.md

관련 정책 문서:

- packages/schema/CLAUDE.md
- .claude/core/selective-activation-architecture.md

다음 단계: /doc-save --decision
```

### Case 2: CHANGELOG만 권장

```markdown
📋 문서화 분석 결과

변경 파일: 2개

- apps/client/src/features/trip/ui/TripCard.tsx
- packages/ui/src/Card.tsx

영향받는 정책: 1개

🟡 [High] Component 외부 margin 금지
파일: packages/ui/src/Card.tsx
감지: margin 스타일 제거
정책: "재사용성을 위해 컴포넌트는 내부만 관리"
출처: .claude/core/components.md:89-112

📝 권장사항: CHANGELOG 업데이트

이유: High 정책 준수 (기존 위반 수정)

CHANGELOG에 포함할 내용:

- Card 컴포넌트 외부 margin 제거
- TripCard에서 spacing 직접 관리로 변경

다음 단계: /doc-save
```

### Case 3: Git commit만 충분

```markdown
📋 문서화 분석 결과

변경 파일: 1개

- apps/client/src/features/trip/ui/TripCard.tsx

영향받는 정책: 0개

✅ 권장사항: Git commit만으로 충분

이유: 정책 영향 없음 (UI 텍스트 변경)

다음 단계:
git add .
git commit -m "fix: TripCard 제목 오타 수정"
```

## 문서화 빈도 가이드

| 문서 타입      | 빈도     | 필수 여부 |
| -------------- | -------- | --------- |
| Git commit     | 매일     | ✅ 필수   |
| CHANGELOG      | 주간     | ❌ 선택   |
| Decision (ADR) | 월간     | ❌ 선택   |
| Session        | 월 1-2회 | ❌ 선택   |
| CLAUDE.md      | 분기     | ❌ 선택   |

**중요**: 80%는 Git commit만으로 충분합니다. 정책 기반으로 판단하세요.

## 관련 명령어

- `/doc-discuss` - 개발 전 논의 내용 정리
- `/doc-save` - 문서 저장 및 자동 연결
- `/doc-refactor` - 정책 일관성 검증 및 리팩토링

## 다음 단계 제안

검증 결과에 따른 다음 액션:

- **Level 3-4 (DECISION)**: → `/doc-save --decision`로 진행
- **Level 2 (CHANGELOG)**: → `/doc-save`로 진행
- **Level 1 (Git commit)**: → `git commit -m "..."`로 충분
- **정책 점검 필요시**: → `/doc-refactor`로 전체 검증
