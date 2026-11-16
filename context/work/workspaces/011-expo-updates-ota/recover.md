# 011 — expo-updates 작업을 이어갈 때

논의와 착수 전 파악까지 끝났고 구현은 시작하지 않았다. 다시 시작할 때는 정해진 방향과 열린 판단을 구별하고, 첫 작업이 dev-client 정렬과 Xcode 26 빌드 확인이라는 점을 먼저 잡는다. 그 빌드 결과가 이 Work를 계속할지, OTA를 SDK 업그레이드 Work 012에 합칠지를 가른다. 구현 착수는 사용자가 정한다.

**먼저 읽는다.** 이것들이 빠지면 구현이 제품 약속을 깨거나, 위험한 발행 경로를 남기거나, SDK 51에 필요 이상으로 투자하게 된다.
- [현재 상태](current/state/index.md): 시작 전 확인할 것(1.1.3 심사 결과), 012 분리로 남은 조정, 첫 행동
- [구별해야 할 사례](current/memory/spec/02-behavior-and-cases.md): OTA로 내면 안 되는 변경과 그 이유
- [제약·설계](current/memory/spec/05-constraints-design-assumptions.md)의 "SDK 51의 남은 기간" 제약과 "1단계의 판단 지점" 절: 빌드가 깨질 때 멈출 기준

**요청에 따라 더 읽는다.**

| 요청 | 읽을 것 | 이유 |
| --- | --- | --- |
| 설치·설정을 할 때 | Spec 05의 설계 방향 표와 가정, [Ticket 01](current/memory/tickets/01-expo-updates-and-ios15-build.md) | 넣을 버전과 설정값, dev-client 충돌, `npx expo install` 실패와 우회 |
| 검증·완료를 판단할 때 | [완료 판단](current/memory/spec/04-quality-and-completion.md) | 설정을 넣은 것만으로 확인을 대신하지 않는다 |
| 방지 장치(hook)를 설계할 때 | [Ticket 02](current/memory/tickets/02-ota-publish-guard.md)와 Spec 05의 방지 장치 절 | 후보와 한계, 현재 hook 상태, SDK 버전에 묶이지 않게 한다는 방향 |
| Project에 반영할 때 | [Ticket 03](current/memory/tickets/03-project-context-reflection.md), [선택한 Project 맥락](current/memory/project-context.md) | 반영 위치가 미정이고, 확정한 규칙만 옮긴다 |
| 1단계 빌드가 깨져 012와 합칠지 판단할 때, 또는 dev-client 정렬의 근거가 필요할 때 | [파악·분리 기록](records/2026-11-16-02-scoping-check-and-sdk-split.md) | 확인 방법과 한계, 나눈 이유와 받아들인 비용, 합치면 얻는 것 |
| SDK·라이브러리 버전 자체를 다룰 때 | [Work 012](../012-expo-sdk-upgrade/README.md) | 버전의 상세 논의는 012가 소유한다. 011의 Spec에 끌어오지 않는다 |
| 추천을 바꾸거나 이유를 다시 볼 때 | [논의 기록](records/2026-11-16-01-discussion-and-work-creation.md) | fingerprint·시작 시 기다리지 않음·iOS 15 동반을 고른 이유 |
| 사용자가 실제로 한 말이 문제일 때 | [사용자 방향 원문](source/user-direction.md)(첫 세션), 두 번째 세션의 "파악만" 정정과 분리 결정은 파악·분리 기록과 [source 색인](source/index.md)의 행 표 | 범위(hook, Project 반영, 012 분리)를 정한 발화 |
| 릴리스 절차를 따라 할 때 | Work 007의 [빌드 16 기록](../007-sync-failure-recovery/records/2026-11-14-08-build-16-release-and-review-submission.md), Work 008의 [1.1.3 기록](../008-exception-notice-rules/records/2026-11-16-01-pressable-drawer-fixes.md) | Project에 릴리스 본문이 아직 없다 |

**첫 행동:** `apps/client/package.json`과 `app.config.js`를 확인한다. 이 안내가 쓰인 `08ff4c27` 이후에 바뀌었을 수 있다. 특히 012가 먼저 진행돼 SDK나 dev-client가 이미 바뀌었다면 Ticket 01의 1·2단계 전제가 달라진다.
