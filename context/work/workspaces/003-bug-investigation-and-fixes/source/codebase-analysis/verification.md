# 검증 결과와 남은 확인

[전체 목차와 분석 범위](README.md)

> 2026-09-06 분석 기록 · 기준 코드: `b4ed41f6e4bbae26fd45827b3b9063097a2c1ea4`
> 2026-09-08에 카테고리별로 분리했다. 관찰과 검증 결과는 원래 분석 시점 기준이다.

## 실행한 타입 검사와 린트

제품 코드를 수정하지 않은 상태에서 검사했다. pnpm 경유 명령은 설치 상태 확인 단계에서 중단돼, 이미 설치된 로컬 실행 파일로 검사했다. 도구 재설치는 하지 않았다. 아래는 그 시점의 결과이며 선언된 의존성만으로 다시 설치한 환경의 결과를 뜻하지 않는다.

사용 도구: TypeScript 5.9.3, ESLint 8.57.1, Prettier 3.6.2, eslint-plugin-prettier 4.2.5.

| 검사 | 실행 명령 | 확인된 결과 |
| --- | --- | --- |
| client 타입 검사 | `node node_modules/typescript/bin/tsc --noEmit --incremental false --composite false -p apps/client/tsconfig.json` | 오류 3건 |
| server 타입 검사 | `node node_modules/typescript/bin/tsc --noEmit --incremental false -p apps/server/tsconfig.json` | 오류 1건 |
| client 린트 | client 디렉터리에서 `node ../../node_modules/eslint/bin/eslint.js . --ext .js,.jsx,.ts,.tsx -f json` | 도구 호환성 오류로 완료하지 못함 |

핵심 진단 원문:

```text
apps/client/src/shared/lib/mapbox.ts(61,26): error TS2345:
Argument of type 'number[][]' is not assignable to parameter of type '[number, number][]'.

apps/client/src/shared/services/offline-map/download.ts(165,22): error TS2339:
Property 'size' does not exist on type 'OfflinePack'.

apps/client/src/shared/services/offline-map/download.ts(166,22): error TS2339:
Property 'tileCount' does not exist on type 'OfflinePack'.

apps/server/src/routes/places.ts(138,9): error TS2322:
Type 'string' is not assignable to type 'Language | undefined'.

TypeError: prettier.resolveConfig.sync is not a function
Rule: "prettier/prettier"
```

린트가 완료되지 않았으므로 전체 lint 위반 건수나 통과 여부는 판정할 수 없다. 이 분석 기록을 작성하면서 제품 검사를 다시 실행하지는 않았다.

## 로그와 자동화된 제품 테스트

선언 파일과 주석을 제외하고 TypeScript 구문 트리의 실제 `console` 호출을 집계했다. 73개 파일에서 420곳이 확인됐다: log 248곳, error 155곳, warn 17곳. 조회 확인·진행 상황·실패 기록·디버그 기능이 섞여 있다. 이 숫자만으로 품질을 평가하지 않는다.

앱·서버·공유 패키지 범위에서 자동화된 제품 test/spec 파일을 찾지 못했다. Debug 화면과 하네스 검사는 제품의 오프라인·재연결·데이터 보존 테스트를 대신하지 않는다. 저장소 밖의 테스트나 수동 검증 이력까지 없다고 판단한 것은 아니다.

## 별도로 재현해야 할 조건

다음은 코드 근거가 있는 확인 과제이며, 발생한 장애로 확정하지 않았다.

| 확인할 내용 | 현재 근거와 남은 확인 |
| --- | --- |
| local 저장과 queue 기록의 원자성 | `withTransaction`은 `_tx`를 사용하지 않고 callback은 전역 db를 사용한다. 드라이버 동작과 중간 실패 시 rollback을 확인해야 한다. [helper](../../../../../../apps/client/src/shared/db/utils.ts) 21행 |
| 실패·진행 중 queue 작업과 cleanup | 여행 대기 작업 조회는 PENDING만 포함한다. FAILED·IN_PROGRESS가 남은 비활성화와 정리 상황을 확인해야 한다. [queue](../../../../../../apps/client/src/shared/services/sync/queue.ts) 231행 |
| pull 변경분의 시간 경계 | 서버는 데이터 조회 후 serverTime을 만든다. 조회와 시간 생성 사이에 기록된 변경을 다음 pull에서 놓치는지 동시 쓰기로 재현해야 한다. query schema import와 실제 직접 query 처리의 차이도 확인됐다. [pull](../../../../../../apps/server/src/routes/sync.ts) 38·124행 |
| 좌표 0·누락·null 처리 | 선택 장소, 저장 요청, 서버 변환, 경로 필터까지 값이 어떻게 전달되는지 확인해야 한다. [경로 필터](../../../../../../apps/client/src/shared/services/directions/route-downloader.ts) 50행 |
| 비활성 여행의 수정·삭제 | local 데이터가 준비되지 않은 상황에서 Repository의 선행 조회가 어떤 결과를 내는지 확인해야 한다. [Repository](../../../../../../apps/client/src/entities/schedule/repository/schedule-repository.ts) 62행 |
| 실패와 재진입의 화면 표시 | 초기화 실패, 목록 조회 실패, picker 닫기, 저장 후 백그라운드 작업 실패의 실제 화면을 확인해야 한다. |
