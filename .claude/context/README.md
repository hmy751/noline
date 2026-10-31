# Noline 맥락 지도

맥락 문서는 깊은 설명, 구현 배경, edge case, 과거 선택의 이유를 보존한다. 필요할 때만 열어보는 자료이며 startup memory가 아니다.

## 읽는 방식

- 짧고 검증 가능한 지침은 [rules](../rules/README.md)에서 확인한다.
- 반복 작업의 시작 순서는 [runbooks](../runbooks/README.md)에서 확인한다.
- rule이나 runbook만으로 부족할 때 이 맥락 지도를 연다.
- 동작에 영향을 주는 맥락을 바꿀 때는 코드와 대조한다.

## 현재 맥락 source

예전 `core/`와 `features/` 본문 문서는 이 디렉터리로 이동했다. 아직 Owner를 옮기지 않은 깊은 설명은 `context/`가 소유하고, 승인되어 Project로 옮긴 주제는 표의 `context/project/` 본문이 현재 의미를 소유한다. 여행 접근·Policy·저장·활성화·정리·지도·경로·구조·UI·TypeScript·작성·입력·날짜의 옛 대응 파일은 현재 경로에서 제거했다. 다른 주제의 미이관 상세·구현 안내는 아래에서 구별한다. `rules/`와 `runbooks/`는 짧은 guard와 반복 작업 진입을 맡는다.

| 주제 | 맥락 source | 먼저 볼 rule/runbook |
| --- | --- | --- |
| Architecture and FSD | [Project 계층·재사용](../../context/project/guidance/development-boundaries/layers.md) | [Runbooks](../runbooks/README.md) |
| 앱 준비·세션·데이터 보존 | [Project 앱 실행 구조](../../context/project/current/app-runtime/INDEX.md) | [Client guide](../../apps/client/CLAUDE.md), [Transaction + Sync Queue](../rules/transaction-sync-queue.md) |
| <a id="selective-activation-and-router"></a>Selective Activation and Router | [Project Router·여행 목록](../../context/project/guidance/travel-access/INDEX.md#router와-계정-전체-여행-목록의-계약), [저장·sync·준비·정리](../../context/project/guidance/data-lifecycle/INDEX.md) | [Activation Router rule](../rules/activation-router.md) |
| API 계약과 변경 | [Project API·repository·query 계약](../../context/project/guidance/api-contracts.md) | [Add API Endpoint](../runbooks/README.md#api-endpoint) |
| <a id="policy-layer"></a>Policy Layer · 네트워크 관측·조회·화면 복구 | [Project 여행 접근·Policy](../../context/project/guidance/travel-access/INDEX.md) | [Policy UI rule](../rules/policy-ui.md) |
| <a id="time-and-date"></a>Time and date | [Project 날짜와 시각](../../context/project/common/date-and-time.md) | [ISO Time rule](../rules/iso-time.md) |
| TypeScript and Zod | [Project TypeScript·schema](../../context/project/guidance/development-boundaries/schema-and-types.md) | [Schema First rule](../rules/schema-first.md) |
| <a id="components"></a>Components | [Project UI 책임](../../context/project/guidance/development-boundaries/ui.md) | [Build UI Components](../runbooks/README.md#component-guide) |
| Error handling | [Project 오류 전달·공개 응답](../../context/project/guidance/error-handling.md) | code owner의 workspace guide |
| <a id="offline-map"></a>Offline map | [Project 지도 준비·정리](../../context/project/guidance/offline-maps-and-routes/map-packs.md) | client workspace guide |
| <a id="offline-routing"></a>Offline routing | [Project 저장 경로·일정 변경](../../context/project/guidance/offline-maps-and-routes/routes.md) | sync-owned data가 관련되면 [Debug Sync Issues](../runbooks/README.md#sync-debug) |
| <a id="currency"></a>Currency | [Project 통화와 금액](../../context/project/common/currency.md) | [Display Currency/Amounts](../runbooks/README.md#currency-utils) |
| <a id="forms-and-manual-input"></a>작성 초안·장소·날짜 입력 / Manual Input | [Project 작성·입력](../../context/project/guidance/writing-and-input/INDEX.md) | [Implement Forms](../runbooks/README.md#form-pattern) |

## 아카이브 경계

유용한 history이지만 현재 지침으로 쓰기에는 위험한 문서나 section은 [_archive](../_archive/)에 둔다.

경로가 중립적으로 보인다는 이유만으로 common context를 `.agents/`나 `.codex/`로 옮기지 않는다. 그런 표면은 구체적인 bridge나 tool behavior가 필요할 때만 만든다.
