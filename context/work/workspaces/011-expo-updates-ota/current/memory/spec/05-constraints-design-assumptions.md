# 제약·현재 설계·가정

## 지킬 제약

- **오프라인 시작을 늦추지 않는다:** `fallbackToCacheTimeout: 0`. 제품의 핵심 약속이라 OTA의 편의보다 앞선다.
- **방지 장치는 거부가 기본이다:** 판단이 필요한 변경은 사람이 명시적으로 확인해야 통과한다. 장치가 없거나 실패한 상태에서 조용히 발행되지 않게 한다.
- **기존 릴리스 절차를 유지한다:** 스토어 릴리스는 EAS production 빌드 → `eas submit` → App Store Connect 정보 입력 → 심사 순서를 그대로 쓴다. 절차의 원문 근거는 Work 007의 [빌드 16 기록](../../../../007-sync-failure-recovery/records/2026-11-14-08-build-16-release-and-review-submission.md)과 Work 008의 [1.1.3 기록](../../../../008-exception-notice-rules/records/2026-11-16-01-pressable-drawer-fixes.md)에 있다.
- **인증서 만료:** 배포 인증서·프로비저닝 프로필이 2026-12-30에 만료된다. 1.1.4 빌드가 그 뒤라면 먼저 갱신해야 한다.

## 논의에서 정한 설계 방향 (구현 전)

| 항목 | 방향 |
| --- | --- |
| 패키지 | `npx expo install expo-updates expo-build-properties`로 SDK 51에 맞는 버전 |
| `app.config.js` | `runtimeVersion: { policy: 'fingerprint' }`, `updates.url`(EAS 프로젝트), `updates.fallbackToCacheTimeout: 0`, plugin `['expo-build-properties', { ios: { deploymentTarget: '15.0' } }]` |
| `eas.json` | preview·production 프로필에 `channel` |
| 발행 | production 환경값을 쓰는 발행 방법(EAS 환경변수 또는 발행 전용 스크립트)과 Sentry 소스맵 업로드를 함께 묶는다. 구체 방식은 미정이다 |
| 순서 | 설치·설정 → preview 빌드로 확인 → 방지 장치 → 1.1.4 스토어 빌드·심사 → Project 반영 |

## 방지 장치 (hook 등) — 계획만 있음

사용자가 "hook같은걸로 뭔가 방지하게 하는 그런것도 할거"라고 했다. 형태는 정하지 않았다. 판단할 후보는 다음과 같다.
- **발행 전용 스크립트:** 예를 들어 `pnpm client update:publish`. 마지막 스토어 빌드 커밋 이후의 diff를 검사한다. migrations·`db/index.ts`·`packages/schema`·네이티브 설정 변경이 있으면 거부하고, 환경값을 확인하고, Sentry 업로드까지 수행한다.
- **AI 도구 hook:** Claude·Codex가 `eas update`를 직접 실행하려 할 때 위 검사를 거치게 막는다. 현재 `.claude/settings.json`에는 hook이 없다. `.claude/hooks/maintain.py`는 퇴역한 Work hook이 아무 일도 하지 않고 끝나게 하는 잔재다. `.codex/hooks.json`은 따로 있다.
- **git hook이나 CI:** 현재 CI(`.github/workflows`)는 없다.

AI 도구 hook만으로는 사람이 터미널에서 직접 실행하는 발행을 막지 못한다. 그래서 검사 자체는 발행 스크립트가 맡고, hook은 그 스크립트로 유도하는 보조가 되는 구성이 유력하다. 이 판단은 아직 사용자와 확정하지 않았다.

## 가정과 확인하지 못한 것

- 앱의 `expo`는 ~51.0.21인데 `expo-dev-client`는 ^6.0.20이다. 보통 SDK 51과 짝인 버전과 달라 보여서, `expo-updates`를 넣을 때 호환을 확인해야 한다.
- iOS 13–14 사용자는 1.1.4부터 새 버전을 받지 못한다. 현재 그런 사용자는 거의 없다고 보았지만 App Store Connect 통계로 확인하지 않았다.
- Expo 무료 플랜의 업데이트 한도는 확인하지 않았다.
