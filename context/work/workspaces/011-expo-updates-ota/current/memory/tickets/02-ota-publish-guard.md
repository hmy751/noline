# 02 — 위험한 OTA 발행을 막는 장치

**상태:** 형태 미정, 실행 전 (2026-11-17). Ticket 01에서 발행 명령의 형태가 정해져 검사 대상이 생겼고, 실기기 시험에서 runtime 불일치 사례가 실제로 나왔다.

사용자가 Work를 만들며 직접 요청한 범위다.

> "참고로 hook같은걸로 뭔가 방지하게 하는 그런것도 할거라고 잘 기록해놔줘"

## 막아야 할 것

[구별해야 할 사례](../spec/02-behavior-and-cases.md)의 "불가"와 조건부 행이다.
- 기기 SQLite 구조 변경
- 서버보다 먼저 나가는 계약 변경
- 네이티브 변경: fingerprint가 1차로 막지만, 발행 단계에서도 알린다
- 개발용 `EXPO_PUBLIC_*` 값
- Sentry 소스맵 누락
- 빌드와 다른 환경으로 하는 발행: fingerprint runtime이 환경값에 따라 달라져, 업데이트가 아무 기기에도 가지 않고 오류도 나지 않는다. Ticket 01에서 발행 명령을 `eas update --channel <채널> --environment <같은 이름>`으로 정했다. 장치는 채널과 environment가 짝이 맞는지 확인할 수 있다. 상세는 [착수 기록](../../../records/2026-11-17-01-ticket01-build-gate-and-publish-env.md)의 단계 5에 있다.
- 오래된 로컬 `node_modules`로 하는 발행: 2026-11-17 첫 preview 빌드가 실제로 이 문제로 실패했다. lockfile이 같아도 예전 설치가 남긴 중첩 패키지 사본 때문에 로컬 runtime(`22d6ec17…`)이 EAS(`54a96787…`)와 달랐다. EAS 빌드는 이 불일치를 실패로 알려 줬지만, 그대로 발행했다면 업데이트가 조용히 전달되지 않았을 것이다. 검사 후보는 둘이다. 하나는 발행 전 깨끗한 설치(`node_modules` 삭제 뒤 `pnpm install --frozen-lockfile`)다. 다른 하나는 로컬 runtime(`eas env:exec <환경> 'npx expo-updates runtimeversion:resolve …'`)을 대상 빌드의 runtime(`eas build:view`의 `runtimeVersion`)과 비교하는 것이다. `eas fingerprint:compare`는 SDK 52 이상만 지원해 SDK 51에서는 쓸 수 없었다. 012 뒤에는 다시 후보가 될 수 있다. 상세는 [실기기 확인 기록](../../../records/2026-11-17-02-preview-build-and-device-ota-check.md)에 있다.

주의: `@env`(`react-native-dotenv`, `babel.config.js`)는 로컬 `.env.production` 또는 `.env.development`를 읽는다. 지금 코드가 쓰는 다섯 이름은 모두 EAS 환경에 있어, 발행 명령의 `process.env` 값이 우선해 번들에 EAS 값이 들어갔다. EAS에 없는 이름을 `@env`로 새로 쓰면 로컬 발행에서만 로컬 파일 값이 섞일 수 있다. `@env` 이름과 EAS 환경 변수 목록의 대조도 검사 후보다. 근거는 [실기기 확인 기록](../../../records/2026-11-17-02-preview-build-and-device-ota-check.md)의 완료 판단 5 절에 있다.

## 정할 것

- **검사의 기준점:** 마지막 스토어 빌드의 커밋이 기준점 후보다. EAS 빌드 정보의 `gitCommitHash`나 git tag로 찾을 수 있다.
- **검사할 경로 목록:** 후보는 다음과 같다.
  - `apps/client/src/shared/db/migrations/`
  - `apps/client/src/shared/db/index.ts`
  - `packages/schema/`
  - `apps/client/app.config.js`
  - `apps/client/package.json`의 네이티브 의존성
- **서버 계약 변경의 통과 방법:** 거부할지, 서버 배포 확인을 사람이 명시하면 통과할지 정한다.
- **장치의 형태:** 발행 스크립트, Claude·Codex hook, git hook을 어떻게 배치할지 정한다. 후보 비교와 현재 hook 상태는 [제약·설계](../spec/05-constraints-design-assumptions.md#방지-장치-hook-등--계획만-있음)에 있다.
- **사람의 우회 방지:** 사람이 터미널에서 `eas update`를 직접 칠 때도 막을지 정한다.

## 따를 방향

장치는 특정 SDK 버전에 묶이지 않게 만든다. 검사는 경로 diff와 fingerprint처럼 SDK가 바뀌어도 그대로 쓰는 기준에 기댄다. SDK 업그레이드를 [Work 012](../../../../012-expo-sdk-upgrade/README.md)로 나누자는 추천에 함께 들어 있던 방향이며, 사용자는 분리에 동의했다. 구체 방식은 장치를 설계할 때 확정한다. 업그레이드 릴리스의 버그를 심사 없이 고치려면 OTA와 이 장치가 012 뒤에도 그대로 이어져야 하기 때문이다. 이유는 [분리 기록](../../../records/2026-11-16-02-scoping-check-and-sdk-split.md)에 있다.

## 완료 조건

[완료 판단](../spec/04-quality-and-completion.md)의 6을 확인한다. 막히는 경우와 통과하는 경우를 각각 실행한 결과를 records에 남긴다. hook을 바꾸면 `pnpm harness:check`를 실행한다.
