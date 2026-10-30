# 저장 용량 Hook 읽기 순서·검사 보완

2026-10-30. 사용자 요청: “그래 그 두 부분 보완하고 테스트까지 해봐”. [앞선 검토](2026-10-30-04-storage-stats-review.md)에서 고른 읽기 순서와 검사 공백을 같은 Ticket 01에서 구현·확인했다.

## 실제 변경과 효과

[useStorageStats](../../../../../apps/client/src/features/profile/hooks/useStorageStats.ts)는 타입·상수 다음에 공개 Hook, 전체 계산, DB·지도 집계, 표시 변환을 놓았다. DB 파일 선별 helper는 DB 집계 가까이에 둔다. 이제 처음부터 React의 요청·상태 반영과 DB 중단·지도 fallback을 읽고 필요한 상세로 내려갈 수 있다. 기존 여덟 함수의 본문은 그대로이며 공개 반환값·계산·실패 순서·요청 수명은 바꾸지 않았다. 파일이나 범용 adapter를 추가하지 않았다.

[Hook 테스트](../../../../../apps/client/tests/features/profile/hooks/useStorageStats.test.ts)에 두 시나리오를 추가했다.

- 문서 디렉터리를 사용할 수 없을 때: 먼저 정상 3 KB 결과를 얻고 경로를 null로 바꾼 뒤 refresh한다. 세 표시값이 0 B로 바뀌고 파일 정보·목록·지도 팩 조회를 시작하지 않는지 확인한다. 초기값이 이미 0이라 우연히 통과하는 검사를 피했다. 기존의 SQLite 디렉터리 없음→지도 조회 계속 검사도 유지했다.
- unmount 뒤 응답이 도착할 때: 정상 1 KB 반영으로 관찰 장치가 동작함을 먼저 확인한다. 다음 refresh를 지연시킨 채 unmount하고, 뒤늦게 2 KB 지도 팩 응답을 완료시킨다. 실제 계산이 끝났지만 상태 반영 요청은 없는지 확인한다.

Unmount 검사는 real React useState와 setter를 유지하고 setter 호출만 관찰한다. React가 unmount된 컴포넌트의 갱신을 무시하더라도 Hook의 잘못된 반영 시도를 잡을 수 있다. 이는 React 상태 반영 경계에 의존하는 검사이므로 향후 useReducer 등으로 바꿀 때 관찰 방식도 조정해야 한다. 내부 helper·요청 번호의 구현을 assertion으로 고정하지는 않았다. FileSystem mock은 동일 export의 documentDirectory를 교체·복구할 수 있도록 __esModule을 명시했고, afterEach에서 복구한다.

## 검사와 결함 검출 확인

실제 제품 코드는 유지한 채 임시 Hook 복사본만 Jest의 정확한 모듈 경로에 연결해 각 새 테스트의 판별력을 확인했다. 각 실험 뒤 복사본을 제거했다.

| 확인 | 결과와 입증 범위 |
| --- | --- |
| 현재 Hook Jest | 1 suite·11 tests 통과. 기존 9개와 새 2개가 실제 Hook을 실행한다. |
| cleanup의 요청 무효화를 제거한 복사본 | unmount 테스트 실패. 예상 0회와 달리 setter가 `{dbSize: '0 B', mapPackSize: '2 KB', totalSize: '2 KB'}`로 1회 호출됐다. |
| 문서 경로 부재 guard를 우회한 복사본 | 경로 부재 테스트 실패. 예상 0 B와 달리 지도·전체가 2 KB가 됐다. |
| 두 변경 파일 Prettier | 통과. |
| 기본 대상 ESLint | 기존 prettier 플러그인의 `resolveConfig.sync is not a function` 오류로 실행 실패. |
| 같은 ESLint에서 prettier/prettier만 off | warning·error 없이 통과. 포맷은 별도 Prettier로 확인했으며 기본 lint 통과로 보고하지 않는다. |
| client 전체 TypeScript | 최초 root TypeScript 5.9.3 실행은 7개, client가 선언한 TypeScript 5.3.3의 clean CLI는 기존 8개 진단으로 실패. 변경 Hook·테스트 진단 없음. 별도 검증자가 두 파일의 HEAD 내용을 메모리에서 대체해 현재판과 동일한 8개 진단임을 확인했다. |

실행은 설치된 도구를 직접 사용했다. 의존성·설정 변경은 없다.

```text
# apps/client
node ../../node_modules/jest/bin/jest.js --config jest.config.cjs --runInBand --runTestsByPath tests/features/profile/hooks/useStorageStats.test.ts
node node_modules/typescript/bin/tsc --project tsconfig.json --noEmit --tsBuildInfoFile /tmp/noline-storage-independent-clean.tsbuildinfo
# client의 TypeScript 5.3.3. 최초 root TypeScript 5.9.3 실행은 참고 결과로 구별한다.
node ../../node_modules/eslint/bin/eslint.js src/features/profile/hooks/useStorageStats.ts tests/features/profile/hooks/useStorageStats.test.ts
node ../../node_modules/eslint/bin/eslint.js src/features/profile/hooks/useStorageStats.ts tests/features/profile/hooks/useStorageStats.test.ts --rule 'prettier/prettier: off'
# Project root
node node_modules/prettier/bin/prettier.cjs --check apps/client/src/features/profile/hooks/useStorageStats.ts apps/client/tests/features/profile/hooks/useStorageStats.test.ts
```

타입 진단은 `shared/components/Form/TimeField.tsx` TS2345 1개, `shared/lib/mapbox.ts` 좌표 tuple 1개, `shared/services/offline-map/download.ts`의 OfflinePack 속성 2개, UI utils·Select 파일의 rootDir/include 경계 4개다. 해당 실패를 이번 보완에 포함해 숨기거나 검사에서 제외하지 않았다. 두 실행은 TypeScript 판본도 다르므로 진단 수 차이를 캐시 때문이라고 확정하지 않는다. 완료 판단에는 client가 선언한 5.3.3의 clean CLI와 HEAD/현재 in-memory 기준선에서 확인한 동일한 8개 진단을 사용했다.

## 완료 판단과 한계

구현에 참여하지 않은 별도 검증자가 제품 계약·diff·검사·결함 주입 근거와 타입 기준선을 대조했다. 기존 함수 본문·제품 동작 보존과 두 테스트의 판별 근거를 확인했다. Main은 이 결과와 직접 실행을 종합해 Ticket 01의 이번 보완을 완료로 판단한다.

FileSystem·Mapbox는 mock이며 실제 Expo 경로·지도 native pack·기기 동작은 이번 검사로 입증하지 않는다. 변경이 없는 화면 전체·전체 client Jest는 재실행하지 않았다. Verify 계약은 기존 초기 JSON 검사로 유지했고 durable Verify·기계 status를 실행·변경하지 않았다. Ticket 완료는 사람용 상태에 남긴다. 사용자 수락·Work 전체 완료·커밋·배포를 뜻하지 않는다.

다음 검토 대상은 Ticket 02의 일정·경비 조회 조합이다. 기존 미검토 범위는 그대로 이어간다.
