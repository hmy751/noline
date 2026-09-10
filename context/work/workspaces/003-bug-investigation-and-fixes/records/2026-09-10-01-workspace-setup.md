# Workspace 초기 구성과 분석 항목 배치

구성일 2026-09-10. 리팩토링과 버그 확인·수정을 두 Work로 분리하라는 [사용자 원문](../source/user-direction.md)에 따라 구성했다. 실제 동작 문제를 표현 정리와 구분하고, 리팩토링을 먼저 하려는 순서를 보존했다. 기존 Context Harness 이식 Work의 current·receipt를 제품 검증 근거로 복제하지 않았다.

## 기존 분석과 추가 발견의 대응

- verification의 transaction 의심은 설치 드라이버 분리 재현으로 강화됐고, FAILED/IN_PROGRESS 과제에는 payload에 tripId가 없는 PENDING UPDATE 누락이 추가됐다.
- engine-data의 local 선행 의존, sync 결과/정리, retry 충돌, 앱 초기화 실패를 모두 유지했다. 활성화/지도/경로 완료 의미와 공통 경로 함수 차이는 실제 결함 여부를 별도로 확인한다.
- server-contracts의 소유권·삭제 조건, 경비 응답 변환, 여행 수정 미반영 필드를 유지하고 오류 형태 차이의 실제 소비 영향도 후보로 남겼다.
- code-style의 좌표 0 처리, components의 재진입·callback·오류 표시, verification의 pull 시간 경계와 실패 화면을 유지했다.
- 추가 코드 조사에서 오래된 좌표를 사용하는 일정 수정 경로, routeExists의 ID/profile만 보는 재사용 조건, 늦은 trip 기본 통화와 동일 ID 재열기, local 미전송 변경과 pull upsert, 중단된 queue의 복구 확인을 보완했다. 아직 실사용 재현하지 않은 내용은 후보로 표시했다.

원래 가독성·함수 내부 책임·공통화 관찰은 코드 가독성 리팩토링 Work가 맡는다. 한 파일에서 두 종류가 겹치면 변경 목적·검증 조건으로 구분하며 제품 버그 전체를 리팩토링의 선행 조건으로 만들지 않는다. 상세 원자료는 [source](../source/index.md), 지금 판단할 내용은 [후보](../current/memory/analysis-items.md)가 소유한다.


## 이전 제품 검사와 현재 Verify 계약

2026-09-10 앞선 분석에서 제품 코드를 바꾸지 않고 설치된 실행 파일로 확인한 결과를 이어받았다. 이번 Workspace 생성에서 제품 타입·린트·실기기 검사를 새로 실행한 것은 아니다.

- client `tsc --noEmit --incremental false --composite false -p apps/client/tsconfig.json`: mapbox.ts의 `number[][]`와 `[number, number][]` 차이 1건, offline-map/download.ts의 OfflinePack.size·tileCount 접근 2건, 총 3건.
- server `tsc --noEmit --incremental false -p apps/server/tsconfig.json`: routes/places.ts의 string과 Language 입력 차이 1건.
- ESLint 8.57.1 실행은 `prettier.resolveConfig.sync is not a function`으로 완료하지 못했다. 당시 Prettier 3.6.2와 설치 eslint-plugin-prettier 4.2.5였으나 package 선언은 이미 ^5.2.1이었다. 선언 변경이 아니라 설치 상태 대조가 필요한 가능성을 보존한다. pnpm 경유도 설치 확인 단계에서 중단돼 로컬 실행 파일로 검사했다.
- 기존 분석은 73개 파일의 console 호출 420곳을 집계했으나 모두 불필요한 로그나 제거 목표로 보지 않는다. apps/packages에서 제품 test/spec 파일을 찾지 못했으며 저장소 밖 검증·수동 이력까지 없다고 주장하지 않는다.

새 `verify.json`은 client noEmit 타입 검사라는 제한된 한 claim을 가진다. 생성 시 TypeScript 5.9.3 program이 읽은 로컬 입력을 수집하고 workspace/package/lockfile을 포함했다. 경유한 schema/dist 생성 선언 파일도 실제 입력으로 포함했다. 외부 node_modules와 이후 resolution 변화는 snapshot 보장 밖이며 실행 시 입력 목록을 재대조한다. server·schema·UI 또는 동작 검증은 실행 대상과 claim에 맞게 추가 선택한다. 초기 계약이 모든 Work 결과를 검증한다고 주장하지 않는다. 제품 Verify를 실행하지 않았고 machine result/receipt는 null이다.


## 구성 경계

Spec·후보·source·state를 구성했지만 제품 수정·첫 Ticket·실제 DB/API 재현은 하지 않았다. 이전 분리 실험의 원문을 보존했을 뿐 새 제품 Verify receipt로 만들지 않았다. 기존 분석·사용자 변경·active index·session binding은 그대로 두고 stage·commit·push하지 않았다.
