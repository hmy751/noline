# doc-refactor

> Claude-only command reference다. Codex rule이 아니며, 현재 작업 정책은 루트 `CLAUDE.md`와 `.claude/README.md`의 role map을 우선한다.

문서와 코드의 정책 일관성을 검증하고 리팩토링합니다.

## 사용법

```bash
/doc-refactor                    # 기본 정책 검증 및 리팩토링
/doc-refactor --policy router    # Router 패턴 집중 검증
/doc-refactor --policy sync      # Sync 패턴 집중 검증
/doc-refactor --fix              # 자동 수정 모드 (확인 후)
```

## 주요 기능

### 1. 정책 불일치 탐지

현재 아키텍처와 맞지 않는 표현들을 찾아냅니다:

**Outdated Local-First 표현들**:

- "모든 데이터는 로컬" → "활성화된 여행은 로컬"
- "항상 로컬 우선" → "활성화 상태에 따라 라우팅"
- "로컬이 진실의 원천" → "활성화 여부가 진실의 원천 결정"

**Router 패턴 미사용**:

```typescript
// ❌ 찾아낼 패턴
db.select().from(trips); // Router 없이 직접 접근
api.get('/trips'); // Router 없이 직접 호출

// ✅ 올바른 패턴
routeTripQuery({ local, remote });
```

**Transaction 패턴 누락**:

```typescript
// ❌ 찾아낼 패턴
await db.insert();
await addToSyncQueue();  // 별도 실행

// ✅ 올바른 패턴
withTransaction(async () => { ... })
```

### 2. 현재 정책 (v2.0 + v3.0)

```typescript
const CURRENT_POLICIES = {
  // === v2.0 Selective Activation (기반 레이어) ===

  // 데이터 접근 정책
  dataAccess: {
    rule: 'Router를 통한 모든 데이터 접근',
    required: ['routeTripQuery', 'routeTripMutation', 'routeChildQuery'],
    forbidden: ['직접 db.select()', '직접 api.get()'],
  },

  // 동기화 정책
  sync: {
    rule: '원자적 트랜잭션 보장',
    required: ['withTransaction'],
    forbidden: ['sync_queue 단독 추가'],
  },

  // 활성화 정책
  activation: {
    rule: '활성화 상태가 데이터 위치 결정',
    truth: 'tripActivations 테이블',
    deprecated: ['trips.activated 필드'],
  },

  // ID 생성 정책
  idGeneration: {
    rule: '클라이언트 ID 생성 (Client-Side ID Generation)',
    required: ['generateId()'],
    forbidden: ['ulid() 직접 사용'],
  },

  // === v3.0 Policy-Driven Extension (확장 레이어) ===

  // Policy Layer 정책
  policyLayer: {
    rule: '4-State Matrix로 CRUD 권한 제어',
    states: ['online_active', 'online_inactive', 'offline_active', 'offline_inactive'],
    required: ['useAppPolicy'],
    guide: '.claude/context/policy-architecture.md',
  },

  // Data/Service Layer 분리
  layerSeparation: {
    rule: 'Data Layer는 Router, Service Layer는 Policy 기반',
    dataLayer: ['Trip', 'Schedule', 'Expense'],  // sync_queue 필요
    serviceLayer: ['Map', 'Search', 'Directions'],  // 소유권 없음
    guide: '.claude/decisions/2025-11-20-data-service-separation.md',
  },

  // Manual Input 정책
  manualInput: {
    rule: 'offline_active에서 API 없이 데이터 입력 지원',
    required: ['policy.schedule.create.mode 체크'],
    guide: '.claude/context/manual-input.md',
  },
};
```

### 3. 검증 체크리스트

#### Phase 1: 문서 검증

- [ ] CLAUDE.md의 아키텍처 설명 확인
- [ ] README들의 정책 설명 확인
- [ ] 예제 코드의 패턴 일치 확인

#### Phase 2: 코드 검증

- [ ] Router 사용 패턴 검증
- [ ] Transaction 패턴 검증
- [ ] ID 생성 패턴 검증
- [ ] 날짜/통화 유틸 사용 검증

#### Phase 3: 일관성 검증

- [ ] 문서-코드 간 일치
- [ ] 용어 일관성
- [ ] 예제 작동 여부

### 4. 정책 진화 추적

```typescript
// 정책 버전 히스토리 (코드로 관리)
const POLICY_HISTORY = {
  '1.0': {
    name: 'Pure Local-First',
    period: '2024-10 ~ 2025-11-05',
    core: '모든 데이터는 로컬',
    deprecated: true,
  },
  '2.0': {
    name: 'Selective Activation',
    period: '2025-11-06 ~',
    core: '활성화 여부에 따른 선택적 로컬',
    layer: '기반 레이어',
    current: true,
  },
  '3.0': {
    name: 'Policy-Driven Extension',
    period: '2025-11 ~',
    core: 'v2.0 활성화 정책 + 네트워크 상태 → 4-State Matrix로 CRUD 제어',
    layer: '확장 레이어 (v2.0 위에 구축)',
    current: true,
    guide: '.claude/context/policy-architecture.md',
  },
};
```

### 5. 실행 예시

```bash
# 1. 기본 검증
/doc-refactor

출력:
📊 정책 검증 결과
━━━━━━━━━━━━━━━━━
❌ Outdated: CLAUDE.md:78 - "모든 데이터는 로컬 SQLite가 진실의 원천"
   → Should be: "활성화된 여행은 로컬, 비활성은 서버가 진실의 원천"

❌ Pattern: useGetTrips.ts:15 - db.select().from(trips)
   → Should use: routeTripQuery()

✅ Good: useCreateTrip.ts - Correctly uses withTransaction

# 2. 자동 수정
/doc-refactor --fix

자동 수정할 항목:
1. CLAUDE.md의 outdated 표현 5개
2. 코드의 Router 패턴 3개
계속하시겠습니까? (y/n)

# 3. 특정 정책 집중
/doc-refactor --policy router

Router 패턴 검증:
- 총 45개 데이터 접근 지점
- 38개 올바른 사용 (84%)
- 7개 개선 필요
```

## 정책 추가/수정 방법

새로운 정책이나 아키텍처 변경이 필요한 경우:

1. 이 파일의 `CURRENT_POLICIES` 객체 수정
2. `POLICY_HISTORY`에 버전 추가
3. 검증 로직 업데이트

예시:

```typescript
// 새 정책 추가
CURRENT_POLICIES.newFeature = {
  rule: '새로운 기능의 규칙',
  required: ['필수 패턴'],
  forbidden: ['금지 패턴'],
};
```

## 다른 command와의 연계

- `/check-docs` - 변경사항 기반 문서 필요도 체크
- `/doc-discuss` - 정책 변경 논의 및 기록
- `/doc-save` - 리팩토링 결과 저장

## 실행 스크립트

```typescript
// 1. 문서 스캔
const scanDocs = () => {
  const files = ['CLAUDE.md', '.claude/**/*.md', 'apps/*/CLAUDE.md', 'packages/*/CLAUDE.md'];

  return files.map((f) => ({
    path: f,
    content: readFile(f),
    issues: findPolicyViolations(content),
  }));
};

// 2. 코드 스캔
const scanCode = () => {
  const patterns = {
    directDB: /db\.(select|insert|update|delete)\(\)\.from/g,
    directAPI: /api\.(get|post|put|delete)\(/g,
    noTransaction: /addToSyncQueue(?!.*withTransaction)/g,
  };

  return findPatternViolations(patterns);
};

// 3. 자동 수정
const autoFix = (issues) => {
  const fixes = {
    '모든 데이터는 로컬': '활성화된 여행은 로컬, 비활성은 서버',
    '로컬이 진실의 원천': '활성화 상태가 데이터 위치 결정',
    'db.select()': 'routeTripQuery({ local: () => db.select() })',
  };

  return applyFixes(issues, fixes);
};
```

## Notes

- 정책은 이 command 파일 자체에서 코드로 관리 (별도 manifest 불필요)
- 새 아키텍처 추가 시 CURRENT_POLICIES 객체만 수정하면 됨
- --fix 옵션은 항상 확인 후 적용 (안전성)
- 정책 버전은 날짜 기반으로 자동 추적
