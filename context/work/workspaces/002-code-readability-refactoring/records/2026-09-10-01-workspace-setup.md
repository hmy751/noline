# Workspace 초기 구성과 분석 항목 배치

구성일 2026-09-10. 사용자 요청은 두 Workspace 생성이며 리팩토링부터 작은 코드 요소에 집중하는 방향이다. 근거 원문은 [선택 발췌](../source/user-direction.md), 기존 분석의 해시는 [provenance](../source/provenance.json)에 있다.

이 Work는 표현·처리 방식 개선을 맡고 버그 Work는 실제 동작 확인·수정을 맡는다. 원래 분석의 첫 제안인 '일정 생성부터'는 채택하지 않았으며, 작은 요소부터라는 방향을 특정 파일 전수 수정이나 큰 아키텍처 재편으로 확대하지 않았다.

## 기존 분석에서 이어받은 내용

- code-style의 7개 주제: 로그/주석/catch, 변환·기본값, 조건 의미, 타입 우회, 중복 검증, 도달하지 않는 분기, 효과 없는 memo를 현재 후보에 각각 유지했다. 좌표 0의 결과 수정은 버그 Work에 둔다.
- components의 4개 주제: 초기화, callback, 저장 이후 책임, 생성·수정 중복/차이를 유지했다. 추가 관찰인 늦은 기본 통화·동일 ID 재열기·저장 결과 사용을 포함했다.
- engine-data의 책임·완료 표현, 공통 구현/설정은 이 Work가 맡는다. local 선행 의존, sync 실패/queue, retry, 초기화 실패는 버그 Work가 맡으며 같은 코드의 표현 정리는 경계를 표시했다.
- server-contracts의 데이터/오류 변환 책임은 이 Work, 소유권·삭제·누락 변환·미반영 필드와 실제 오류 소비 문제는 버그 Work에 배치했다.
- architecture의 역할 분리·Data/Service 분리·ID/schema/soft delete 기반은 보존 기준이다. verification의 도구 기준선과 검증 한계는 공통 지원 작업이며 재현 과제는 버그 Work에서 유지한다.

추가 발견의 세부 증거는 필요한 경우에만 [버그 Work의 정확한 추가 조사 기록](../../003-bug-investigation-and-fixes/records/2026-09-10-02-additional-findings.md)으로 접근한다. 다른 Work의 current 전체를 읽거나 자동 추종하지 않는다. 이 Work의 첫 판단과 제약은 자체 Spec에 직접 서술했다.


## 이전 제품 검사와 현재 Verify 계약

2026-09-10 앞선 분석에서 제품 코드를 바꾸지 않고 설치된 실행 파일로 확인한 결과를 이어받았다. 이번 Workspace 생성에서 제품 타입·린트·실기기 검사를 새로 실행한 것은 아니다.

- client `tsc --noEmit --incremental false --composite false -p apps/client/tsconfig.json`: mapbox.ts의 `number[][]`와 `[number, number][]` 차이 1건, offline-map/download.ts의 OfflinePack.size·tileCount 접근 2건, 총 3건.
- server `tsc --noEmit --incremental false -p apps/server/tsconfig.json`: routes/places.ts의 string과 Language 입력 차이 1건.
- ESLint 8.57.1 실행은 `prettier.resolveConfig.sync is not a function`으로 완료하지 못했다. 당시 Prettier 3.6.2와 설치 eslint-plugin-prettier 4.2.5였으나 package 선언은 이미 ^5.2.1이었다. 선언 변경이 아니라 설치 상태 대조가 필요한 가능성을 보존한다. pnpm 경유도 설치 확인 단계에서 중단돼 로컬 실행 파일로 검사했다.
- 기존 분석은 73개 파일의 console 호출 420곳을 집계했으나 모두 불필요한 로그나 제거 목표로 보지 않는다. apps/packages에서 제품 test/spec 파일을 찾지 못했으며 저장소 밖 검증·수동 이력까지 없다고 주장하지 않는다.

새 `verify.json`은 client noEmit 타입 검사라는 제한된 한 claim을 가진다. 생성 시 TypeScript 5.9.3 program이 읽은 로컬 입력을 수집하고 workspace/package/lockfile을 포함했다. 경유한 schema/dist 생성 선언 파일도 실제 입력으로 포함했다. 외부 node_modules와 이후 resolution 변화는 snapshot 보장 밖이며 실행 시 입력 목록을 재대조한다. server·schema·UI 또는 동작 검증은 실행 대상과 claim에 맞게 추가 선택한다. 초기 계약이 모든 Work 결과를 검증한다고 주장하지 않는다. 제품 Verify를 실행하지 않았고 machine result/receipt는 null이다.


## 구성 경계

기존 분석 7개 파일과 기존 미커밋 파일의 내용은 변경하지 않고 두 새 경로에만 썼다. Work당 Spec 하나를 다섯 파일로 나누고 후보·Project context·빈 Ticket 색인·state·source·output·machine 계약을 구성했다. 실제 제품 산출물은 없다고 표시했다. 기존 Work·Project Owner·active index·session binding을 변경하거나 자동 Maintain·증거 수집을 활성화하지 않았다. commit은 만들지 않았다.
