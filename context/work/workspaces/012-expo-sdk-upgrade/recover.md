# 012 — SDK 업그레이드를 이어갈 때

2026-11-17 버전 설정을 전수 조사했고, 서버 Node를 범위에 넣었다. 대상 SDK 58, 핫픽스는 `release/1.1`, 최소 iOS 16.4는 정했다. 출시는 2번(1.2.0 = SDK 54 + New Architecture, 1.3.0 = SDK 58·iOS 27)이고, Ticket 5개로 확정해 문서를 만들었다. 구현 전에 기기 DB와 오프라인 지도가 남는지 먼저 판정하고(02, DB가 남지 않으면 멈춤), SDK는 한 버전씩 올린다. 지금은 01·02를 시작할 단계다. 버전이 어긋나면 앱이 깨지는 일이라 단계마다 원인을 가르고 확인할 수 있는 순서가 핵심이다. 마감이 있다는 점을 놓치지 않는다.

**먼저 읽는다.** 이 둘이 빠지면 마감·순서를 잘못 잡거나, 이미 고정한 버전을 실수로 되돌린다.
- [현재 상태](current/state/index.md): 011 조건의 현재, 채택한 결정과 아직 정하지 않은 것, 중요한 미확인, 다음 행동
- [Ticket 색인](current/memory/tickets/index.md): 확정한 Ticket 5개와 선행·일정, 공통 규칙, Spec 완료 기준을 맡는 Ticket. 시작할 Ticket 문서(01·02)로 이어서 읽는다
- [제약·현재 설계·가정](current/memory/spec/05-constraints-design-assumptions.md): Apple 마감·핫픽스 빌드 보호·서버 배포·인증서 같은 제약과 일정, 버전의 현재와 이후 표, 진행 순서, 일부러 벗어난 버전과 실수로 섞인 버전의 구별

**요청에 따라 더 읽는다.**

| 요청 | 읽을 것 | 이유 |
| --- | --- | --- |
| 목표·범위를 다시 볼 때 | [문제·목표·범위](current/memory/spec/01-problem-goal-scope.md) | 011과 나눈 경계, 서버를 Node와 도구까지만 넣은 범위 |
| 라이브러리 목표 버전을 정하거나 업그레이드할 때 | [라이브러리 호환 조사](source/library-compatibility-2026-11-17.md) | SDK 54 Legacy·New Architecture·SDK 58별 목표 버전, 함께 움직이는 묶음, 출처와 미확인 |
| 지도 대응이나 Ticket 구성의 이유를 다시 볼 때 | [재구성·지도 대응 기록](records/2026-11-17-05-ticket-restructure-and-map-data-plan.md) | 4→5개 재구성 이유, 지도 문제 설명, 사용자 지도 대응안 원문과 다듬은 결과, 최종 보완 세 가지 |
| 출시 횟수나 앞선 구성을 다시 볼 때 | [채택·점검 기록](records/2026-11-17-04-release-plan-adopted-and-library-check.md), [출시 축소 기록](records/2026-11-17-03-release-count-reduction.md), [Ticket 구성·결정 기록](records/2026-11-17-02-ticket-composition-and-release-decisions.md), [완료 판단](current/memory/spec/04-quality-and-completion.md), [개념과 계약](current/memory/spec/03-concepts-and-contracts.md) | 2회 출시안과 1회 출시를 버린 이유, 앞선 8·7개 구성의 바탕, 브랜치·최소 iOS·기기 결정과 선택지, 확인할 결과 |
| 서버 범위나 Node를 다시 볼 때 | [전수 조사 기록](records/2026-11-17-01-version-inventory-and-server-scope.md) | 서버 포함 이유, Node 22·24·26 비교, Node 순서 추천의 근거 |
| 대상 SDK를 다시 볼 때 | [분리·분석 기록](records/2026-11-16-01-separation-from-011-and-version-analysis.md), [개념과 계약](current/memory/spec/03-concepts-and-contracts.md) | SDK 58을 고른 이유, 외부 계약과 확정한 계약 |
| 업그레이드 뒤 동작을 확인할 때 | [동작과 사례](current/memory/spec/02-behavior-and-cases.md), [완료 판단](current/memory/spec/04-quality-and-completion.md) | 제품 약속(오프라인), 서버 배포, 위험이 큰 영역 |
| 과거 버전 문제를 원문으로 볼 때 | [버전 이력 원문 발췌](source/version-history-evidence.md) | 커밋·세션 원문과 `expo install --check` 결과 |
| Project 본문이 필요할 때 | [선택한 Project 맥락](current/memory/project-context.md) | SQLite·지도·앱 시작 순서처럼 업그레이드에 깨지기 쉬운 계약 |
| 스토어 빌드를 내거나 OTA를 다시 확인할 때 | Project의 [앱 변경을 사용자에게 내보낼 때의 기준](../../../project/guidance/app-release-and-ota.md) | 스토어 빌드 절차와 runtime 조건. expo-updates 설정의 경위는 Work 011의 [재개 안내](../011-expo-updates-ota/recover.md) |

**첫 행동:** [Ticket 01](current/memory/tickets/01-preparation-baseline-and-node24.md)과 [02](current/memory/tickets/02-data-preservation-check-and-targets.md)를 시작한다. 그 전에 1.1.4 심사 결과와 `package.json`·`eas.json`·`render.yaml`이 2026-11-17 이후 바뀌었는지 확인한다. 버전을 확정하기 전에는 Expo 최신 SDK와 Apple 요건도 다시 본다.
