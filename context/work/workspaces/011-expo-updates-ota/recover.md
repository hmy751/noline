# 011 — expo-updates 작업을 이어갈 때

아직 논의만 끝난 상태다. 다시 시작할 때는 정해진 방향과 열린 판단을 구별하는 것이 먼저다.

**먼저 읽는다.** 이 둘이 빠지면 구현이 제품 약속을 깨거나 위험한 발행 경로를 남긴다.
- [현재 상태](current/state/index.md): 시작 전 확인할 것(1.1.3 심사 결과)과 첫 행동
- [구별해야 할 사례](current/memory/spec/02-behavior-and-cases.md): OTA로 내면 안 되는 변경과 그 이유

**요청에 따라 더 읽는다.**

| 요청 | 읽을 것 | 이유 |
| --- | --- | --- |
| 설치·설정을 할 때 | [제약·현재 설계](current/memory/spec/05-constraints-design-assumptions.md)의 설계 방향 표와 가정, [Ticket 01](current/memory/tickets/01-expo-updates-and-ios15-build.md) | 넣을 설정값과 확인하지 못한 호환 |
| 검증·완료를 판단할 때 | [완료 판단](current/memory/spec/04-quality-and-completion.md) | 설정을 넣은 것만으로 확인을 대신하지 않는다 |
| 방지 장치(hook)를 설계할 때 | [Ticket 02](current/memory/tickets/02-ota-publish-guard.md)와 Spec 05의 방지 장치 절 | 후보와 한계, 현재 hook 상태 |
| Project에 반영할 때 | [Ticket 03](current/memory/tickets/03-project-context-reflection.md), [선택한 Project 맥락](current/memory/project-context.md) | 반영 위치가 미정이고, 확정한 규칙만 옮긴다 |
| 추천을 바꾸거나 이유를 다시 볼 때 | [논의 기록](records/2026-11-16-01-discussion-and-work-creation.md) | fingerprint·시작 시 기다리지 않음·iOS 15 동반을 고른 이유 |
| 사용자가 실제로 한 말이 문제일 때 | [사용자 방향 원문](source/user-direction.md), 그 밖의 원문 행은 [source 색인](source/index.md) | 범위(hook, Project 반영)를 정한 발화 |
| 릴리스 절차를 따라 할 때 | Work 007의 [빌드 16 기록](../007-sync-failure-recovery/records/2026-11-14-08-build-16-release-and-review-submission.md), Work 008의 [1.1.3 기록](../008-exception-notice-rules/records/2026-11-16-01-pressable-drawer-fixes.md) | Project에 릴리스 본문이 아직 없다 |

**첫 행동:** `apps/client/package.json`과 `app.config.js`를 확인한다. 이 문서가 쓰인 `6adfbb2a` 이후에 이미 바뀌었을 수 있다.
