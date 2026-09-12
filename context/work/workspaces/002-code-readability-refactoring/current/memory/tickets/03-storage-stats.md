# 03 — 저장 용량의 집계·부분 실패·표시

## 맡은 결과와 범위

`apps/client/src/features/profile/hooks/useStorageStats.ts`와 프로필 표시 연결에서 같은 stats 조립을 두 곳에서 맞춰야 하는 부담을 줄인다. 병렬 조회·새 실패 상태·새 단위 체계는 도입하지 않는다. [Spec 품질·완료 판단](../spec/04-quality-and-completion.md)을 따른다.

Main의 코드 확인 보고상 `ProfileScreen`은 `dbSize`와 `mapPackSize`만 표시하고 `totalSize`는 소비하지 않는다. 이번 범위에서는 새 표시를 추가하거나 반환 필드를 제거하지 않는다.

## 실행 맥락과 접근

[추가 조사](../additional-research.md)와 후속 Main 보고에 따르면 성공 경로와 바깥 catch가 같은 표시값 조립을 반복한다. DB 파일 조회 중 실패하면 그때까지의 DB 합계를 남기고 Mapbox 조회를 시작하지 않는다. `getPacks` 실패는 DB 결과를 보존하며, 개별 `pack.status` 실패는 다음 팩 조회를 계속한다. 이는 Main의 코드 확인 보고이며 변경 전 hook 검사로 확인할 보존 조건이다.

표시 조립의 중복을 줄이되 실패 시 중단·계속과 부분 결과 보존 정책을 같은 hook 파일 가까이에서 읽을 수 있게 한다. 명확한 stats 조립 helper나 단일 조립 지점은 가능하다. 작은 중복을 없애려고 여러 파일과 adapter를 따라가게 만들면 개선 여부를 다시 판단한다.

주 자동 검증은 `apps/client`가 소유하는 Jest 29.7.0, `jest-expo` 51.0.4, `@testing-library/react-native` 13.3.3과 module mock으로 실제 hook을 실행하는 방식으로 한다. 테스트는 `apps/client/tests/features/profile/hooks/useStorageStats.test.ts`처럼 별도 `tests` 아래 source 소유 구조를 따라 두고, 처음에는 시나리오 mock도 해당 테스트 파일이 소유한다.

이번 Ticket을 위해 root나 다른 package에 테스트 의존성·설정·집계를 추가하지 않는다. Jest 변환과 alias는 `apps/client/jest.config.cjs`가 소유하고, 제품 source와 테스트의 TypeScript 검사는 에디터도 자동 발견하는 `apps/client/tsconfig.json` 하나를 사용한다. 공용 setup·mock은 아직 만들지 않으며 반복되는 준비가 생길 때 다시 판단한다. 선택지와 이유, monorepo 경계는 [테스트 전략 논의 기록](../../../records/2026-09-11-02-storage-stats-test-strategy.md), 실제 설정과 검증 결과는 [테스트 환경 구축 기록](../../../records/2026-09-11-03-storage-stats-test-setup.md)이 소유한다.

## 완료 조건과 확인 방법

변경 전 실제 hook에서 FileSystem/Mapbox 의존성을 제어하여 다음 조건을 확인하고 수정 후 같은 조건으로 비교한다.

- 빈 디렉터리와 대상 확장자·무관 파일이 섞인 입력.
- DB 디렉터리가 없는 경우에도 지도 팩 집계 진행.
- 0·1,024·소수 단위의 표시와 최종 DB·지도·합계 값.
- native module이 반환한 음수·`NaN` 용량 제외.
- DB 파일 조회 중간 실패에서 부분 합계 보존과 Mapbox 미호출.
- `getPacks` 실패에서 DB 결과 보존.
- 개별 `pack.status` 실패 뒤 다음 팩의 성공 결과 반영.
- `refresh` 호출 뒤 값 재계산.
- 여러 `refresh`가 겹치면 가장 최근 요청의 결과 유지.

결과와 중요한 중단·계속 조건을 검사하며 내부 helper나 모든 호출 순서를 고정하지 않는다. 순수 helper 검사는 hook 검사의 보조로만 사용한다. ProfileScreen 전체 렌더·snapshot·E2E는 이번 Ticket의 주 자동 검증 범위에 포함하지 않는다.

실제 Expo 파일 경로와 Mapbox native pack은 development build의 선택적 smoke test로 보완한다. 실제 기기·플랫폼에서 실행하지 않은 범위는 미확인으로 남긴다. mock 기반 hook 결과를 실제 native 연결 검증으로 확대하지 않는다.

동작 보존과 별도로 성공·실패 표시 조립을 함께 수정할 위치가 줄었는지, 부분 결과와 실패 정책을 가까운 코드에서 이해할 수 있는지 변경 전후를 비교한다.

## 현재 상태와 실제 결과

2026-09-11에 client 소유 테스트 환경과 최소 React hook smoke test를 구성했다. 이어서 `apps/client/tests/features/profile/hooks/useStorageStats.test.ts`에 변경 전 특성화 테스트 6개를 작성해 빈 입력·대상 파일 선별과 단위 표시·DB 중간 실패·`getPacks` 실패·개별 pack 실패 후 계속·`refresh` 재계산을 확인했다. 리팩터링을 구체화하면서 DB 디렉터리 없음, 유효하지 않은 native 용량 제외, 겹친 새로고침의 최신 결과 유지까지 추가해 hook 시나리오는 9개가 됐다.

제품 코드는 같은 파일 안에서 SQLite 집계, Mapbox 집계, 표시 변환, React 상태 연결을 각각 이름 있는 책임으로 나눴다. SQLite 집계는 부분 합계와 완료 여부를 반환하고, 상위 계산 함수가 완료 여부를 보고 Mapbox 진행 또는 중단을 결정하므로 핵심 실패 정책을 함수 호출 흐름에서 읽을 수 있다. Mapbox 팩 목록 실패는 DB 결과를 보존하고 개별 팩 상태 실패는 그 함수 안에서 다음 팩으로 계속한다. 표시값은 `createStorageStats` 한 곳에서 만들며 실제로 쓰이지 않던 포맷 옵션과 매직값을 제거·명명했다. native module의 음수·`NaN` 값과 document directory 부재도 방어한다.

React 연결에서는 `refresh`를 `useCallback`으로 안정화하고 effect dependency로 명시했다. 요청 번호를 사용해 겹친 조회에서는 최신 결과만 반영하며, cleanup 시 진행 중 요청을 무효화해 unmount 뒤의 상태 갱신도 막는다. 병렬 조회·새 공개 실패 상태·새 단위 체계·별도 파일이나 adapter는 추가하지 않았다.

변경 후 저장 용량 hook 시나리오 9개와 현재 작업트리의 전체 client Jest 3 suites·18 tests, hook·특성화 테스트 대상 ESLint, 해당 파일 Prettier와 `git diff --check`가 통과했다. 프로젝트 TypeScript 5.3.3과 에디터 TypeScript 6.0.3 모두 새 테스트와 변경한 hook에서는 진단을 내지 않는다. 단일 client config의 전체 `test:typecheck`는 이번 변경 밖의 기존 client source 오류 3개(`src/shared/lib/mapbox.ts` 1개, `src/shared/services/offline-map/download.ts` 2개) 때문에 실패한다. client 기본 lint는 기존 `eslint-plugin-prettier`와 Prettier 3의 호환 문제로 전체 통과를 확인하지 못했으며, development build와 실제 기기·native module 연결도 미확인이다. 설정 선택과 최초 구축 결과는 [테스트 환경 구축 기록](../../../records/2026-09-11-03-storage-stats-test-setup.md), 이후 정정과 구현 결과는 [리팩터링 실행 기록](../../../records/2026-09-11-04-storage-stats-refactor.md)에 보존한다.

후속 인터뷰에서 사용자는 현재 구현이 기대에 훨씬 가까워져 거의 원하는 수준이라고 평가했고, 더 자세한 분석에서 다른 부족함이 발견될 가능성은 열어 두었다. 이후 Main이 원래 작업 로그에서 최초 적용 diff를 찾아 이전의 미확보 상태를 해소했다. 최초 적용은 포맷 함수를 hook 밖으로 옮기고 표시값 조립을 helper로 모으며 성공·실패의 상태 반영을 `finally`로 합친 범위였다. SQLite 조회, Mapbox 집계, 부분 실패 정책과 React 연결의 내부 책임은 나누지 않은 채 실행자가 Ticket 요청 범위를 모두 수정했다고 보고했다. 사용자는 그 뒤 개선 깊이와 React 관점을 여러 차례 보완해 요구했고 최종 구현으로 이어졌다. 최초 적용 범위와 정정 과정은 [재확인 기록](../../../records/2026-09-12-01-ticket-03-initial-scope-reanalysis.md)에 보존한다. 현재 구현에 대한 평가는 Ticket의 최종 수락이나 제품 Verify 결과가 아니다.
