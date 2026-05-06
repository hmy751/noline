# Noline 맥락 지도

맥락 문서는 깊은 설명, 구현 배경, edge case, 과거 선택의 이유를 보존한다. 필요할 때만 열어보는 자료이며 startup memory가 아니다.

## 읽는 방식

- 짧고 검증 가능한 지침은 [rules](../rules/README.md)에서 확인한다.
- 반복 작업의 시작 순서는 [runbooks](../runbooks/README.md)에서 확인한다.
- rule이나 runbook만으로 부족할 때 이 맥락 지도를 연다.
- 동작에 영향을 주는 맥락을 바꿀 때는 코드와 대조한다.

## 현재 맥락 source

이번 패스에서는 link churn을 줄이기 위해 기존 `core/`와 `features/` 경로를 그대로 둔다. 이 경로들은 하네스의 중심이 아니라 깊은 맥락과 호환성 source로 읽는다.

| 주제 | 맥락 source | 먼저 볼 rule/runbook |
| --- | --- | --- |
| Architecture and FSD | [core/architecture.md](../core/architecture.md) | [Runbooks](../runbooks/README.md) |
| <a id="selective-activation-and-router"></a>Selective Activation and Router | [core/selective-activation-architecture.md](../core/selective-activation-architecture.md), [features/activation-system.md](../features/activation-system.md) | [Activation Router rule](../rules/activation-router.md) |
| API/Data/query key/repository | [core/api-data.md](../core/api-data.md) | [Add API Endpoint](../runbooks/README.md#api-endpoint) |
| <a id="policy-layer"></a>Policy Layer | [core/policy-architecture.md](../core/policy-architecture.md) | [Policy UI rule](../rules/policy-ui.md) |
| <a id="time-and-date"></a>Time and date | [core/time.md](../core/time.md) | [ISO Time rule](../rules/iso-time.md) |
| TypeScript and Zod | [core/typescript.md](../core/typescript.md) | [Schema First rule](../rules/schema-first.md) |
| <a id="components"></a>Components | [core/components.md](../core/components.md) | [Build UI Components](../runbooks/README.md#component-guide) |
| Error handling | [core/error-handling.md](../core/error-handling.md) | code owner의 workspace guide |
| <a id="offline-map"></a>Offline map | [features/offline-map.md](../features/offline-map.md) | client workspace guide |
| <a id="offline-routing"></a>Offline routing | [features/offline-routing.md](../features/offline-routing.md) | sync-owned data가 관련되면 [Debug Sync Issues](../runbooks/README.md#sync-debug) |
| <a id="currency"></a>Currency | [features/currency.md](../features/currency.md) | [Display Currency/Amounts](../runbooks/README.md#currency-utils) |
| <a id="forms-and-manual-input"></a>Forms and manual input | [features/form.md](../features/form.md), [features/manual-input.md](../features/manual-input.md) | [Implement Forms](../runbooks/README.md#form-pattern) |

## 아카이브 경계

유용한 history이지만 현재 지침으로 쓰기에는 위험한 문서나 section은 [_archive](../_archive/)에 둔다. active link가 많이 남아 있으면 원래 경로에 짧은 compatibility note를 남긴다.

경로가 중립적으로 보인다는 이유만으로 common context를 `.agents/`나 `.codex/`로 옮기지 않는다. 그런 표면은 구체적인 bridge나 tool behavior가 필요할 때만 만든다.
