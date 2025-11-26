# /generate-pr

Push 전 현재 브랜치의 커밋들과 변경사항을 분석하여 PR 메시지를 자동 생성합니다.

## 사용 시점

- Push 전 PR 메시지 작성이 필요할 때
- 브랜치 작업 완료 후 PR 생성 직전
- 변경사항을 체계적으로 정리하고 싶을 때

## 실행 로직

### 1단계: 브랜치 정보 수집

```bash
# 현재 브랜치명
git branch --show-current

# 메인 브랜치 확인 (main 또는 master)
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'

# 브랜치가 분기된 시점부터의 커밋
git log main..HEAD --oneline

# 커밋 상세 정보 (hash, subject, body)
git log main..HEAD --format="%H|%s|%b" --reverse
```

### 2단계: 변경 파일 분석

```bash
# 변경된 파일 목록
git diff main...HEAD --name-status

# 파일별 변경 통계
git diff main...HEAD --stat

# 주요 변경 내용 (diff)
git diff main...HEAD
```

### 3단계: 변경사항 카테고리화

커밋 메시지 prefix와 파일 경로를 분석하여 분류:

| Prefix             | 카테고리  | 이모지 |
| ------------------ | --------- | ------ |
| `feat:`            | 새 기능   | ✨     |
| `fix:`             | 버그 수정 | 🐛     |
| `refactor:`        | 리팩토링  | 🔄     |
| `docs:`            | 문서화    | 📝     |
| `test:`            | 테스트    | 🧪     |
| `chore:`           | 설정/빌드 | 🔧     |
| `improve/enhance:` | 개선사항  | ⚡     |
| `perf:`            | 성능 개선 | 🚀     |

### 4단계: PR 규모 판단

변경 규모에 따라 섹션 포함 여부 결정:

| 규모       | 기준                          | 포함 섹션                                    |
| ---------- | ----------------------------- | -------------------------------------------- |
| **Small**  | <10 commits, <500 lines       | 개요, 변경사항, Stats, 완료상태              |
| **Medium** | 10-30 commits, 500-2000 lines | + 버그수정, 테스트, Migration                |
| **Large**  | >30 commits, >2000 lines      | + 아키텍처, 트레이드오프, 파일구조, 향후계획 |

### 5단계: PR 메시지 생성

아래 템플릿에 맞춰 PR 메시지를 생성합니다.

---

## PR 메시지 템플릿

````markdown
# 🎯 Feature: {PR 제목}

## 🎯 개요

### 문제 (Problem)

{해결하려는 문제점 나열 - 구체적으로}

- **{문제 1}:** {설명}
- **{문제 2}:** {설명}

### 해결 (Solution)

{해결 방법 나열 - 핵심만}

- **{해결 1}:** {설명}
- **{해결 2}:** {설명}

---

## 🏗️ 아키텍처 (Large PR인 경우)

### {아키텍처 제목}

> _{한 줄 요약}_

{아키텍처 설명}

**핵심 컨셉**:

- **{컨셉 1}**: {설명}
- **{컨셉 2}**: {설명}

**상태/흐름 테이블** (해당되는 경우):
| 상태 | 동작 1 | 동작 2 | 동작 3 |
| :--- | :---: | :---: | :---: |
| **상태 1** | ✅ | ✅ | ❌ |
| **상태 2** | ✅ | ❌ | ❌ |

---

## 🔧 주요 변경사항

### 1. {변경사항 제목} {이모지}

**{부제목}**
{설명}

```typescript
// Before: {이전 코드 설명}
{이전 코드}

// After: {변경 코드 설명}
{변경 코드}
```
````

- **주요 파일:** `{파일1}`, `{파일2}` (+{추가} / -{삭제} lines)

### 2. {변경사항 제목} {이모지}

...

---

## 📊 트레이드오프 분석 (Large PR인 경우)

**Trade-offs**

- **{트레이드오프}**: {설명}
- **선택 이유**: {왜 이 방식을 선택했는지}

**Architecture Benefits**

- **{이점 1}**: {설명}
- **{이점 2}**: {설명}

**User Experience**

- **{UX 개선 1}**: {설명}

---

## 📊 변경 통계 (Stats)

| 카테고리         | 주요 파일             | Lines                       |
| :--------------- | :-------------------- | :-------------------------- |
| **{카테고리 1}** | `{파일들}`            | +{추가} / -{삭제}           |
| **{카테고리 2}** | `{파일들}`            | +{추가} / -{삭제}           |
| **Total**        | **{N} files changed** | **+{총 추가} / -{총 삭제}** |

**주요 신규 파일** (있는 경우):

- `{파일 경로}` ({줄수}줄) - {설명}

---

## 📁 주요 파일 구조 (Large PR인 경우)

```
apps/client/src/
├── entities/
│   └── {entity}/
│       ├── data/
│       │   └── {hook}.ts          # {설명}
│       └── ui/
│           └── {component}.tsx    # {설명}
├── shared/
│   └── {service}/
│       └── {file}.ts              # {설명}
└── screens/
    └── {screen}/
        └── {file}.tsx             # {설명}
```

---

## 🐛 주요 버그 수정

- **{버그 제목} (commit: {hash}):** {설명}
- **{버그 제목} (commit: {hash}):** {설명}

---

## 📝 문서화 (Documentation)

**신규 작성** ({N}개):

- `{문서 경로}` ({줄수}줄) - {설명}

**업데이트** ({N}개):

- `{문서 경로}`: {변경 내용}

---

## 🧪 테스트 시나리오

**수동 테스트 확인:**

- [x] {완료된 테스트}
- [x] {완료된 테스트}
- [ ] {미완료 테스트 (있는 경우)}

**성능 테스트** (해당되는 경우):

- {지표}: {결과} ✅

---

## 🔗 Related Issues / PRs

- **이전 작업:** {관련 PR/이슈 또는 버전}
- **Decisions:** `{Decision 문서 경로}`
- **추적 문서:** `{tracker 문서 경로}`

---

## 🚀 Migration Guide

### {마이그레이션 제목}

```typescript
// Before
{이전 사용법}

// After
{변경된 사용법}
```

---

## 🎯 향후 개선 계획 (남은 작업이 있는 경우)

**Priority 1: {제목}**

- {설명}

**Priority 2: {제목}**

- {설명}

---

## ✅ 완료 상태

- [x] {완료된 작업 1}
- [x] {완료된 작업 2}
- [ ] {미완료 작업 (있는 경우)}

---

**Stats**:

- {N} files changed, {추가} insertions(+), {삭제} deletions(-)
- {N} commits ({시작일} ~ {종료일})
- 실제 작업 기간: {기간}

```

---

## 섹션별 포함 기준

| 섹션 | Small | Medium | Large | 조건 |
|------|:-----:|:------:|:-----:|------|
| 개요 | ✅ | ✅ | ✅ | 항상 |
| 아키텍처 | ❌ | ❌ | ✅ | 구조적 변경 시 |
| 주요 변경사항 | ✅ | ✅ | ✅ | 항상 |
| 트레이드오프 | ❌ | ❌ | ✅ | 설계 결정 시 |
| 변경 통계 | ✅ | ✅ | ✅ | 항상 |
| 파일 구조 | ❌ | ❌ | ✅ | 새 구조 추가 시 |
| 버그 수정 | ❌ | ✅ | ✅ | fix: 커밋 있을 때 |
| 문서화 | ❌ | ✅ | ✅ | .claude/ 변경 시 |
| 테스트 시나리오 | ❌ | ✅ | ✅ | 기능 변경 시 |
| Related | ❌ | ✅ | ✅ | 관련 문서 있을 때 |
| Migration Guide | ❌ | ✅ | ✅ | Breaking Change 시 |
| 향후 계획 | ❌ | ❌ | ✅ | 미완료 작업 시 |
| 완료 상태 | ✅ | ✅ | ✅ | 항상 |

---

## 프로젝트 특화 분석

Noline 프로젝트의 주요 패턴 변경 감지:

| 패턴 | 감지 키워드 | 중요도 |
|------|------------|--------|
| **Router 패턴** | `routeTripQuery`, `routeTripMutation`, `routeChildQuery` | 🔴 Critical |
| **Transaction 패턴** | `withTransaction`, `sync_queue` | 🔴 Critical |
| **Policy 시스템** | `useAppPolicy`, `PolicyErrorDisplay`, `POLICIES` | 🟡 High |
| **Schema 변경** | `@repo/schema`, `Entity`, `z.object` | 🔴 Critical |
| **활성화 시스템** | `tripActivations`, `activate`, `deactivate` | 🟡 High |
| **Store 변경** | `useStore`, `zustand`, `networkStore` | 🟡 High |

**Critical 패턴 변경 시**: Migration Guide 필수 포함

---

## 관련 명령어

- `/check-docs` - 문서화 필요 여부 분석
- `/doc-save` - 문서 저장 및 자동 연결

## 주의사항

- **베이스 브랜치 확인**: main 또는 master 자동 감지
- **Breaking Changes**: API/타입 변경 시 Migration Guide 필수 포함
- **테스트 시나리오**: 주요 기능별 수동 테스트 항목 체크리스트 포함
- **커밋 메시지 품질**: Conventional Commits 형식 권장 (자동 분류 정확도 향상)

## 팁

1. **커밋을 잘 정리해두면** PR 메시지 품질이 높아집니다
2. **scope를 명시하면** 카테고리 분류에 도움이 됩니다
   - 예: `fix(schedule): 일정 삭제 버그 수정`
3. **Large PR은 분리 고려**: 2000줄 이상이면 PR 분리 권장
```
