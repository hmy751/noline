# 012 — SDK 업그레이드를 이어갈 때

아직 Work를 만들기만 했다. 다시 시작하면 먼저 사용자와 버전 상세(대상 SDK, 단계, 라이브러리 대응)를 논의한다. 마감이 있는 일이라는 점과, 011이 먼저라는 순서를 놓치지 않는다.

**먼저 읽는다.** 이 둘이 빠지면 마감·순서를 잘못 잡거나, 이미 고정한 버전을 실수로 되돌린다.
- [현재 상태](current/state/index.md): 011과의 순서, 첫 행동(버전 논의), 중요한 미확인
- [제약·현재 설계·가정](current/memory/spec/05-constraints-design-assumptions.md): Apple 마감과 SDK별 조건, 일부러 벗어난 버전과 실수로 섞인 버전의 구별

**요청에 따라 더 읽는다.**

| 요청 | 읽을 것 | 이유 |
| --- | --- | --- |
| 목표·범위를 다시 볼 때 | [문제·목표·범위](current/memory/spec/01-problem-goal-scope.md) | 011과 나눈 경계와 포함·제외 |
| 대상 SDK·단계를 논의할 때 | [논의·분석 기록](records/2026-11-16-01-separation-from-011-and-version-analysis.md), [개념과 계약](current/memory/spec/03-concepts-and-contracts.md) | 추천(SDK 58, 51→54→58 단계)의 이유와 아직 확정하지 않은 점 |
| 업그레이드 뒤 동작을 확인할 때 | [동작과 사례](current/memory/spec/02-behavior-and-cases.md), [완료 판단](current/memory/spec/04-quality-and-completion.md) | 제품 약속(오프라인)과 위험이 큰 영역 |
| 과거 버전 문제를 원문으로 볼 때 | [버전 이력 원문 발췌](source/version-history-evidence.md) | 커밋·세션 원문과 `expo install --check` 결과 |
| Project 본문이 필요할 때 | [선택한 Project 맥락](current/memory/project-context.md) | SQLite·지도·앱 시작 순서처럼 업그레이드에 깨지기 쉬운 계약 |
| OTA와 겹치는 판단 | Work 011의 [재개 안내](../011-expo-updates-ota/recover.md) | expo-updates 설정·방지 장치는 011이 소유한다 |
| 릴리스 절차를 따라 할 때 | Work 007의 [빌드 16 기록](../007-sync-failure-recovery/records/2026-11-14-08-build-16-release-and-review-submission.md), Work 008의 [1.1.3 기록](../008-exception-notice-rules/records/2026-11-16-01-pressable-drawer-fixes.md) | Project에 릴리스 본문이 아직 없다 |

**첫 행동:** 사용자와 버전 상세를 논의한다. 그 전에 `apps/client/package.json`과 `eas.json`이 이 Work가 쓰인 `08ff4c27` 이후에 바뀌었는지(특히 011의 진행) 확인하고, Expo 최신 SDK와 Apple 요건이 바뀌지 않았는지 다시 본다.
