# 02 — 위험한 OTA 발행을 막는 장치

**상태:** 형태 미정, 실행 전 (2026-11-16)

사용자가 Work를 만들며 직접 요청한 범위다.

> "참고로 hook같은걸로 뭔가 방지하게 하는 그런것도 할거라고 잘 기록해놔줘"

## 막아야 할 것

[구별해야 할 사례](../spec/02-behavior-and-cases.md)의 "불가"와 조건부 행이다.
- 기기 SQLite 구조 변경
- 서버보다 먼저 나가는 계약 변경
- 네이티브 변경: fingerprint가 1차로 막지만, 발행 단계에서도 알린다
- 개발용 `EXPO_PUBLIC_*` 값
- Sentry 소스맵 누락

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
