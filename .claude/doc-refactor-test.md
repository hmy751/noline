# 문서 리팩토링 Before/After 테스트

> **목적**: 문서 정비 전후로 동일 질문을 새 세션에서 해보고, AI 응답 품질 변화를 비교
> **작성일**: 2026-03-19
> **사용법**: 아래 질문을 새 세션에서 그대로 복붙하고, 응답을 `[After]`에 기록

---

## 테스트 질문 6개

### Q1. 이미지 관련 가이드가 있나요?

**검증 대상**: 고유 문서의 발견 가능성 (IMAGE_BEST_PRACTICES.md가 .cursor/rules에만 있음)

**[Before - 2026-03-19]**
- `.cursor/rules/IMAGE_BEST_PRACTICES.md` (560줄)에 React Native 이미지 가이드 존재
- `.claude/references/images.md`는 존재하지만 별도 파일
- **문제**: `.cursor/rules/`는 Claude Code가 자동 로딩하지 않아 발견 어려움
- **예상 응답**: AI가 `.claude/references/images.md`만 언급하거나, 이미지 가이드가 없다고 답할 가능성

**[After - 2026-03-19]**
- `.claude/references/images.md` (561줄) 발견 ✅ — React Native 이미지 종합 가이드
  - 이미지 라이브러리 비교, ResizeMode, 캐싱, Blurhash, 성능 최적화 등
  - Noline 프로젝트용 Phase별 추천 (Phase 1: RN Image → Phase 2: Expo Image)
- `.cursor/rules/` 디렉토리는 존재하나 **비어 있음** (IMAGE_BEST_PRACTICES.md 없음)
  - Before에서 언급된 `.cursor/rules/IMAGE_BEST_PRACTICES.md`는 현재 존재하지 않음
  - 리팩토링 과정에서 `.claude/references/images.md`로 통합된 것으로 보임
- `check-docs.md`에서 `images.md`를 추적 대상으로 등록 ✅
- **등급: A** — 이미지 가이드를 정확히 발견하고, 내용도 포괄적

---

### Q2. Pull Sync는 구현되어 있나요?

**검증 대상**: 워크스페이스 CLAUDE.md의 현행화 (client CLAUDE.md가 "구현 예정"이라고 거짓말)

**[Before - 2026-03-19]**
- `apps/client/CLAUDE.md:305` → "🚧 구현 예정" 으로 표기
- 실제 코드: `shared/services/sync/engine.ts`에 Pull Sync 로직 구현됨
- **문제**: 문서와 코드 불일치. AI가 문서를 신뢰하면 "아직 없다"고 답함
- **예상 응답**: "구현 예정입니다" (문서 기준) vs 코드를 직접 보면 "있습니다"

**[After - 2026-03-19]**
- `apps/client/CLAUDE.md:303~307` → **"✅ 구현 완료"** 로 정확히 표기
- 실제 코드 `shared/services/sync/engine.ts`에 `pullChanges()` 함수 구현 확인 (119~212줄)
  - `lastSyncedAt` 기반 증분 동기화
  - 활성화된 trip만 필터링하여 pull
  - trips/schedules/expenses upsert + React Query 캐시 무효화
- 서버 측 `GET /api/sync/pull` 엔드포인트도 구현 완료 (server/routes/sync.ts:34~149)
- SyncProvider에서 앱 시작/네트워크 복구 시 자동 트리거
- **문서와 코드 일치** ✅
- **등급: A** — 문서가 "구현 완료"로 현행화되어 있고, 코드와 일치

---

### Q3. JWT 인증은 서버에 구현되어 있어?

**검증 대상**: 서버 CLAUDE.md 현행화 (server CLAUDE.md:102가 "구현 예정"이라고 표기)

**[Before - 2026-03-19]**
- `apps/server/CLAUDE.md:102` → "JWT 기반 인증 (구현 예정)" 으로 표기
- 실제 코드: `middleware/auth.ts`에 authenticateToken 미들웨어 구현됨
- Root CLAUDE.md의 "완료된 기능"에는 OAuth + JWT가 완료로 기록
- **문제**: 루트 문서와 워크스페이스 문서가 서로 모순
- **예상 응답**: 서버 CLAUDE.md를 먼저 보면 "예정"이라고 답함

**[After - 2026-03-19]**
- `apps/server/CLAUDE.md` → JWT 인증이 **완료 상태**로 표기, 코드 예시 포함
- 실제 코드 `middleware/auth.ts`에 구현 확인:
  - `requireAuth()` + `optionalAuth()` 두 가지 미들웨어
  - 구조화된 에러 응답 (`TOKEN_MISSING`, `TOKEN_EXPIRED`, `TOKEN_INVALID`)
  - `req.userId` 설정 (문서 예시의 `req.user`와 약간 차이)
- `services/jwt.ts`에 JWT 서비스 레이어:
  - Access Token (1시간) + Refresh Token (30일, Rolling)
  - Refresh Token SHA-256 해싱 저장
- `routes/auth.ts`에 6개 엔드포인트 (Google/Apple OAuth, refresh, logout, me, account 삭제)
- Root CLAUDE.md "완료된 기능"과 서버 CLAUDE.md **모두 완료로 일치** ✅
- **등급: A** — 문서 간 모순 해소, 코드와도 일치

---

### Q4. 개발 서버 실행하려면 어떻게 해?

**검증 대상**: Quick Commands 정확성

**[Before - 2026-03-19]**
- Root CLAUDE.md가 제시하는 명령어:
  ```
  pnpm dev          # 전체 개발 서버 실행
  pnpm dev:client   # 클라이언트만 실행
  pnpm dev:server   # 서버만 실행
  pnpm db:push      # DB 스키마 푸시
  ```
- 실제 `package.json` 스크립트:
  ```
  "client": "pnpm --filter @apps/client"
  "server": "pnpm --filter @apps/server"
  "schema": "pnpm --filter @repo/schema"
  "lint", "format"
  ```
- `pnpm dev`, `pnpm dev:client`, `pnpm db:push`는 루트에 **존재하지 않음**
- **문제**: AI가 문서 기준으로 없는 명령어를 알려줌
- **예상 응답**: "pnpm dev를 실행하세요" (실제로는 에러 발생)

**[After - 2026-03-19]**
- Root CLAUDE.md Quick Commands가 **정확한 워크스페이스 필터 명령어**를 제시:

  - `pnpm client start` — Expo 클라이언트 실행 ✅
  - `pnpm server dev` — 서버 개발 모드 ✅
  - `pnpm server db:push` — DB 스키마 푸시 ✅
  - `pnpm server db:studio` — Drizzle Studio ✅
  - `pnpm schema build` — 스키마 빌드 ✅
  - `pnpm lint` — 전체 린트 ✅

- 루트 `package.json` 스크립트 확인:

  - `"client": "pnpm --filter @apps/client"` → `pnpm client start` = `pnpm --filter @apps/client start` ✅
  - `"server": "pnpm --filter @apps/server"` → `pnpm server dev` = `pnpm --filter @apps/server dev` ✅
  - `"schema": "pnpm --filter @repo/schema"` ✅
  - `"lint"` ✅

- Before에서 문제였던 `pnpm dev`, `pnpm dev:client`, `pnpm dev:server`는 **문서에서 제거됨**
- **문서와 실제 명령어 일치** ✅
- **등급: A** — 존재하지 않는 명령어가 정리되고, 실제 작동하는 명령어만 안내

---

### Q5. /check-docs는 Policy Layer(v3.0) 변경도 감지해?

**검증 대상**: 커맨드의 v3 정책 추적 범위

**[Before - 2026-03-19]**
- `/check-docs`의 policyDocuments 목록 (check-docs.md:25~52):
  - `.claude/core/selective-activation-architecture.md` ✅ (v2.0)
  - `.claude/features/activation-system.md` ✅
  - `.claude/features/manual-input.md` ✅
  - **누락**: `.claude/core/policy-architecture.md` ❌ (v3.0 핵심!)
  - **누락**: `.claude/features/offline-routing.md` ❌
  - **누락**: `.claude/features/offline-map.md` ❌
- `/doc-refactor`의 CURRENT_POLICIES는 v2.0까지만 정의 (doc-refactor.md:48)
  - Policy Layer의 4-State Matrix 언급 없음
  - `useAppPolicy` Hook 검증 없음
- **문제**: v3.0 Policy Layer 관련 변경은 정책 매칭에서 빠짐
- **예상 응답**: AI가 "네, 감지합니다"라고 답하지만 실제로는 policy-architecture.md를 읽지 않음

**[After - 2026-03-19]**
- `check-docs.md`의 policyDocuments 목록에 v3.0 문서 **모두 포함** ✅:

  - `.claude/core/policy-architecture.md` ✅ (v3.0 핵심, line 37)
  - `.claude/features/offline-routing.md` ✅ (v3.0, line 48)
  - `.claude/features/offline-map.md` ✅ (v3.0, line 49)

- `doc-refactor.md`의 CURRENT_POLICIES에 v3.0 정책 **모두 정의** ✅:

  - `policyLayer` — 4-State Matrix, `useAppPolicy` 필수 체크
  - `layerSeparation` — Data/Service Layer 분리
  - `manualInput` — offline_active 수동 입력

- 3개 참조 파일 모두 디스크에 존재 확인 ✅
- **등급: A** — Before에서 누락이었던 v3.0 문서들이 모두 추적 목록에 포함

---

### Q6. /doc-refactor에서 현재 정책 버전은 뭐야?

**검증 대상**: 정책 버전 정합성

**[Before - 2026-03-19]**
- `/doc-refactor`의 POLICY_HISTORY (doc-refactor.md:106~121):
  ```
  '1.0': { name: 'Pure Local-First', deprecated: true }
  '2.0': { name: 'Selective Activation', current: true }
  ```
  - v3.0 (Policy-Driven Extension) 누락
- Root CLAUDE.md에는 v3.0이 명확히 정의됨:
  ```
  v2.0: Selective Activation (기반 레이어)
  v3.0: Policy-Driven Extension (확장 레이어)
  ```
- **문제**: 커맨드가 v2.0을 "current"로 인식, v3.0 존재 자체를 모름
- **예상 응답**: "v2.0 Selective Activation이 현재 버전입니다" (v3.0 누락)

**[After - 2026-03-19]**
- `doc-refactor.md`의 POLICY_HISTORY에 **v3.0이 명확히 정의** ✅:

  ```
  '3.0': {
    name: 'Policy-Driven Extension',
    period: '2025-11 ~',
    core: 'v2.0 활성화 정책 + 네트워크 상태 → 4-State Matrix로 CRUD 제어',
    layer: '확장 레이어 (v2.0 위에 구축)',
    current: true,
    guide: '.claude/core/policy-architecture.md',
  }
  ```

- v2.0은 `current: true`가 아닌 것으로 확인 (v3.0만 current)
- Root CLAUDE.md의 "v2.0 기반 레이어 + v3.0 확장 레이어" 구조와 **정확히 일치** ✅
- **등급: A** — Before에서 v2.0만 current였던 문제가 해결, v3.0이 현재 버전으로 정확히 인식

---

## 평가 기준

| 등급 | 기준 |
|------|------|
| **A** | 코드와 문서가 일치하는 정확한 답변 |
| **B** | 문서 기준으로는 맞지만 코드와 불일치 |
| **C** | 문서조차 찾지 못하거나 잘못된 답변 |

## 기대 결과

| 질문 | Before 예상 등급 | After 목표 등급 | After 실제 등급 | 비고 |
|------|-----------------|----------------|----------------|------|
| Q1 (이미지 가이드) | C | A | **A** | `.cursor/rules/` → `.claude/references/`로 통합됨 |
| Q2 (Pull Sync) | B | A | **A** | client CLAUDE.md "✅ 구현 완료"로 현행화 |
| Q3 (JWT 인증) | B | A | **A** | server CLAUDE.md 완료 상태로 현행화, Root와 일치 |
| Q4 (개발 서버) | B | A | **A** | 없는 명령어 제거, 워크스페이스 필터 명령어로 정리 |
| Q5 (v3 정책 감지) | B | A | **A** | policy-architecture.md 등 v3.0 문서 3개 추적 추가 |
| Q6 (정책 버전) | B | A | **A** | POLICY_HISTORY에 v3.0 정의, current: true |
