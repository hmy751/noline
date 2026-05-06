# Noline workflow 호환 지도

> 호환성용 entry다. 반복 작업의 active surface는 이제 [Noline 런북](../runbooks/README.md)이다.

이 경로는 기존 링크를 보존하기 위해 남겨둔다. 새 workflow성 안내는 `workflows/`가 아니라 [runbooks/](../runbooks/)에 추가한다.

## 사용 방식

1. 아래 작업 이름을 통해 새 runbook으로 이동한다.
2. 관련 [rules](../rules/README.md)와 [guards](../guards/README.md)를 먼저 확인한다.
3. 긴 설명이 필요할 때만 [context](../context/README.md)로 내려간다.

## 빠른 작업표

| 작업 | 새 시작점 |
| --- | --- |
| 동기화 버그 수정 | [동기화 문제 디버깅](../runbooks/README.md#sync-debug) |
| 새 Entity 추가 | [새 Entity 추가](../runbooks/README.md#add-entity) |
| 날짜/시간 처리 | [날짜/시간 처리](../runbooks/README.md#datetime-utils) |
| 통화 표시 | [통화/금액 표시](../runbooks/README.md#currency-utils) |
| Form 구현 | [Form 구현](../runbooks/README.md#form-pattern) |
| UI 컴포넌트 | [UI 컴포넌트 작성](../runbooks/README.md#component-guide) |
| API 추가 | [API endpoint 추가](../runbooks/README.md#api-endpoint) |

## <a id="add-entity"></a>새 Entity 추가

[runbooks/README.md#add-entity](../runbooks/README.md#add-entity)로 이동했다.

## <a id="sync-debug"></a>동기화 문제 디버깅

[runbooks/README.md#sync-debug](../runbooks/README.md#sync-debug)로 이동했다.

## <a id="datetime-utils"></a>날짜/시간 처리

[runbooks/README.md#datetime-utils](../runbooks/README.md#datetime-utils)로 이동했다.

## <a id="currency-utils"></a>통화/금액 표시

[runbooks/README.md#currency-utils](../runbooks/README.md#currency-utils)로 이동했다.

## <a id="form-pattern"></a>Form 구현

[runbooks/README.md#form-pattern](../runbooks/README.md#form-pattern)로 이동했다.

## <a id="component-guide"></a>UI 컴포넌트 작성

[runbooks/README.md#component-guide](../runbooks/README.md#component-guide)로 이동했다.

## <a id="api-endpoint"></a>API endpoint 추가

[runbooks/README.md#api-endpoint](../runbooks/README.md#api-endpoint)로 이동했다.

## 변경 기준

`workflows/`에는 새 내용을 추가하지 않는다. 반복 작업의 진입점은 [runbooks/](../runbooks/)가 소유하고, 이 파일은 링크 호환성만 맡는다.
