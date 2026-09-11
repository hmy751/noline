# 03 — 저장 용량의 집계·부분 실패·표시

## 맡은 결과와 범위

`apps/client/src/features/profile/hooks/useStorageStats.ts`와 프로필 표시 연결에서 같은 stats 조립을 두 곳에서 맞춰야 하는 부담을 줄인다. 병렬 조회·새 실패 상태·새 단위 체계는 도입하지 않는다. [Spec 품질·완료 판단](../spec/04-quality-and-completion.md)을 따른다.

Main의 코드 확인 보고상 `ProfileScreen`은 `dbSize`와 `mapPackSize`만 표시하고 `totalSize`는 소비하지 않는다. 이번 범위에서는 새 표시를 추가하거나 반환 필드를 제거하지 않는다.

## 실행 맥락과 접근

[추가 조사](../additional-research.md)와 후속 Main 보고에 따르면 성공 경로와 바깥 catch가 같은 표시값 조립을 반복한다. DB 파일 조회 중 실패하면 그때까지의 DB 합계를 남기고 Mapbox 조회를 시작하지 않는다. `getPacks` 실패는 DB 결과를 보존하며, 개별 `pack.status` 실패는 다음 팩 조회를 계속한다. 이는 Main의 코드 확인 보고이며 변경 전 hook 검사로 확인할 보존 조건이다.

표시 조립의 중복을 줄이되 실패 시 중단·계속과 부분 결과 보존 정책을 같은 hook 파일 가까이에서 읽을 수 있게 한다. 명확한 stats 조립 helper나 단일 조립 지점은 가능하다. 작은 중복을 없애려고 여러 파일과 adapter를 따라가게 만들면 개선 여부를 다시 판단한다.

주 자동 검증은 `apps/client`가 소유하는 Jest 29.7.0, `jest-expo` 51.0.4, `@testing-library/react-native` 13.3.3과 module mock으로 실제 hook을 실행하는 방식으로 한다. 테스트는 `apps/client/tests/features/profile/hooks/useStorageStats.test.ts`처럼 별도 `tests` 아래 source 소유 구조를 따라 두고, 처음에는 시나리오 mock도 해당 테스트 파일이 소유한다.

이번 Ticket을 위해 root나 다른 package에 테스트 의존성·설정·집계를 추가하지 않는다. Jest 변환과 alias는 `apps/client/jest.config.cjs`, 테스트 전용 타입 검사는 `apps/client/tsconfig.test.json`이 소유한다. 공용 setup·mock은 아직 만들지 않으며 반복되는 준비가 생길 때 다시 판단한다. 선택지와 이유, monorepo 경계는 [테스트 전략 논의 기록](../../../records/2026-09-11-02-storage-stats-test-strategy.md), 실제 설정과 검증 결과는 [테스트 환경 구축 기록](../../../records/2026-09-11-03-storage-stats-test-setup.md)이 소유한다.

## 완료 조건과 확인 방법

변경 전 실제 hook에서 FileSystem/Mapbox 의존성을 제어하여 다음 조건을 확인하고 수정 후 같은 조건으로 비교한다.

- 빈 디렉터리와 대상 확장자·무관 파일이 섞인 입력.
- 0·1,024·소수 단위의 표시와 최종 DB·지도·합계 값.
- DB 파일 조회 중간 실패에서 부분 합계 보존과 Mapbox 미호출.
- `getPacks` 실패에서 DB 결과 보존.
- 개별 `pack.status` 실패 뒤 다음 팩의 성공 결과 반영.
- `refresh` 호출 뒤 값 재계산.

결과와 중요한 중단·계속 조건을 검사하며 내부 helper나 모든 호출 순서를 고정하지 않는다. 순수 helper 검사는 hook 검사의 보조로만 사용한다. ProfileScreen 전체 렌더·snapshot·E2E는 이번 Ticket의 주 자동 검증 범위에 포함하지 않는다.

실제 Expo 파일 경로와 Mapbox native pack은 development build의 선택적 smoke test로 보완한다. 실제 기기·플랫폼에서 실행하지 않은 범위는 미확인으로 남긴다. mock 기반 hook 결과를 실제 native 연결 검증으로 확대하지 않는다.

동작 보존과 별도로 성공·실패 표시 조립을 함께 수정할 위치가 줄었는지, 부분 결과와 실패 정책을 가까운 코드에서 이해할 수 있는지 변경 전후를 비교한다.

## 현재 상태와 실제 결과

2026-09-11에 client 소유 테스트 환경과 최소 React hook smoke test를 구성했다. Jest 실행 1 suite·1 test와 테스트 전용 TypeScript 검사가 통과했고, 신규 설정 파일의 formatting과 Prettier 연동을 제외한 대상 ESLint 검사도 통과했다.

`useStorageStats`의 변경 전 특성화 테스트와 제품 리팩터링은 아직 시작하지 않았다. client 기본 lint는 기존 `eslint-plugin-prettier`와 Prettier 3의 호환 문제로 전체 통과를 확인하지 못했으며, development build와 실제 기기·native module 연결도 미확인이다. 설정 결과와 검증 범위는 [테스트 환경 구축 기록](../../../records/2026-09-11-03-storage-stats-test-setup.md)에 보존한다.
