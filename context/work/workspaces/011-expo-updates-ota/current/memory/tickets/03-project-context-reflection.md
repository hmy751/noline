# 03 — Project context에 반영

**상태:** 01·02 뒤, 실행 전 (2026-11-16)

사용자가 Work를 만들며 직접 요청한 범위다.

> "나중에 잊지않게 context도 작업하고나서 알맞게 반영해야할거고"

## 반영할 의미

- OTA로 내도 되는 변경과 안 되는 변경, 그 이유. 01·02에서 실제로 확정한 규칙만 옮긴다. 논의 단계의 "규칙 후보"를 그대로 옮기지 않는다.
- 발행 절차: 채널, 환경값, Sentry, 롤백. 방지 장치의 위치와 우회 조건도 포함한다.
- 오프라인 시작을 늦추지 않는 설정(`fallbackToCacheTimeout: 0`)이 제품 약속과 이어진다는 점.
- runtime version 정책(fingerprint)과, 네이티브 변경은 스토어 빌드로만 나간다는 점.

## 반영할 위치 (미정)

2026-11-16 기준 Project에는 배포·릴리스를 소유하는 본문이 없다. `context/project`에서 `eas build`·`App Store`·`심사`를 검색하면 지도 형성 자료 한 곳만 나온다. 릴리스 절차는 지금 Work 007·008의 records에만 있다.

그래서 새 Owner를 만들지, 기존 본문에 합칠지부터 정해야 한다. 기존 본문 후보는 `current/app-runtime`과 `current/architecture.md`다. 이 판단은 [Project 관리 계약](../../../../../../project/MAINTENANCE.md)과 [구성 기준](../../../../../../project/REFERENCE/composition.md)을 읽고 [context-update](../../../../../../../.agents/skills/context-update/SKILL.md)로 수행한다.

이 밖에 영향이 갈 수 있는 곳도 함께 확인한다.
- `apps/client/CLAUDE.md`의 명령
- [START_GUIDE](../../../../../../../START_GUIDE.md): 개발 앱을 다시 빌드해야 하는 조건

## 완료 조건

[완료 판단](../spec/04-quality-and-completion.md)의 8을 확인한다. 반영한 본문, 읽기 경로, 갱신하지 않은 영향 범위를 records에 남긴다.
