# 서버 테스트 기반과 Schedule 응답 검증 방식 결정

날짜: 2026-09-13
Workspace: `002-code-readability-refactoring`

이 기록은 Ticket 05의 날짜 직렬화 리팩터링에 앞서 서버 테스트 기반을 고른 논의와 결정 이유를 보존한다. 현재 실행 기준은 [Ticket 05](../current/memory/tickets/05-schedule-response.md), Workspace 전체의 다음 행동은 [state](../current/state/index.md)가 소유한다. 이 기록 자체는 dependency 설치, 테스트 통과, 날짜 직렬화 공통화나 Ticket 완료의 증거가 아니다.

## 사용자 결정과 채택한 기본안

사용자는 Vitest와 Supertest의 역할 차이, 대안별 tradeoff와 현재 서버의 ESM 실행 구조를 확인한 뒤 “그래 좋아 그럼 이렇게 하고 문서좀 남겨줘”라고 지시했다. 이에 따라 다음을 Ticket 05의 서버 검사 기반으로 채택한다.

- server package가 Vitest `4.1.11`과 Supertest `7.2.2`를 정확한 버전으로 소유한다. client의 Expo용 Jest 설정과 root 공용 test config로 합치지 않는다.
- 첫 검증은 DB와 auth 의존성을 통제한 mock 기반 Schedule route 계약 테스트로 시작한다. `src/app.ts`를 import하기 전에 관련 ESM module mock을 등록한다.
- Vitest는 TypeScript·ESM 테스트 실행, module mock, 일반 assertion과 결과 보고를 맡는다. Supertest는 export된 Express app에 method·path·header·body를 가진 HTTP 요청을 보내고 status·header·JSON 응답을 수집한다.
- 순수 Schedule 직렬화 helper가 생기면 Vitest 단위 테스트를 둘 수 있지만, helper 테스트만으로 실제 route 연결과 응답 보존을 주장하지 않는다. 공통 직렬화를 실행한다면 일곱 소비 지점의 실제 endpoint 응답을 route 계약 테스트로 확인한다.
- 실제 PostgreSQL의 ownership 조건, soft-delete 가시성, query 의미를 변경하거나 입증할 때에는 mock 계약 테스트와 구별한 통합 테스트를 사용한다. 이 별도 결함·정책 검증을 Ticket 05의 좁은 날짜 직렬화 helper 안에 합치지 않는다.
- 테스트 결과를 Node 20 계약으로 사용할 때에는 `.nvmrc`를 읽었다는 사실만으로 버전을 가정하지 않고 실제 Node `20.18.1` 실행을 확인한다.

## 기술 스택 선택과 tradeoff

| 선택지 | 얻는 점 | 비용·위험 | 이번 결정 | 재검토 조건 |
| --- | --- | --- | --- | --- |
| **Vitest 4.1.11 + Supertest 7.2.2** | Node 20에서 TypeScript·ESM 실행과 import 전 module mock을 구성하고, export된 Express app의 실제 HTTP 응답 경계를 포트 관리 없이 검사한다. | Vitest 4는 최신 major가 아니며 test dependency와 Vite 계열 실행 기반이 추가된다. Supertest 검사는 실제 배포 process·proxy까지 증명하지 않는다. | **채택** | Node major upgrade, Vitest 4 지원 종료, Express가 아닌 다른 server framework로 전환할 때 |
| **`node:test` + Supertest** | 별도 test runner dependency를 줄이고 Node 내장 assertion·runner를 사용한다. | Node 20.18.1의 ESM module mock에 실험 플래그가 필요하고 TypeScript 실행을 위해 `tsx` 연결도 관리해야 한다. | 미선택 | `mock.module`이 안정화되거나 dependency 최소화가 ESM mock 편의보다 중요해질 때 |
| **Jest 29 + Supertest** | client와 비슷한 test API를 사용할 수 있다. | 기존 Jest는 `jest-expo` client 전용이고 server용 config를 새로 만들어야 한다. Jest 29의 ESM 실행과 module mock도 실험 경로에 의존한다. | 미선택 | server가 CommonJS로 바뀌거나 Jest ESM 경로가 안정되고 조직 표준화 이득이 커질 때 |
| **Mocha + assertion·mock 도구 + Supertest** | 오래된 Node test runner와 자유로운 도구 조합을 사용할 수 있다. | assertion, spy, ESM module mock을 여러 package와 규약으로 조립해 첫 server test 기반의 복잡성이 커진다. | 미선택 | 기존 server test 자산이나 팀 표준이 Mocha 조합으로 생길 때 |
| **Node 22.12 이상 + Vitest 5 + Supertest** | 최신 Vitest major와 더 긴 향후 지원 구간을 사용한다. | 테스트 도입을 위해 server runtime·CI·배포 조건까지 함께 바꾸게 된다. | 이번 범위에서 유보 | 별도 Node upgrade가 결정되면 Vitest 5 전환을 함께 검토 |

HTTP route를 호출하는 방식도 별도로 비교했다.

| 호출 방식 | 장점 | 놓치거나 부담하는 것 | 이번 결정 |
| --- | --- | --- | --- |
| Vitest에서 handler 직접 호출 | 추가 HTTP 도구 없이 빠르게 검사한다. | router mount, body parser, middleware 순서, 실제 status·JSON 생성을 건너뛰고 가짜 `req`·`res` 유지비가 생긴다. | route 계약의 주 검사로 미선택 |
| Vitest에서 `app.listen` + Node `fetch` | 별도 HTTP assertion package 없이 실제 socket 요청을 보낸다. | 임시 port, 준비 대기, server·socket cleanup을 테스트가 직접 관리한다. | 배포·process 경계가 필요할 때의 별도 후보 |
| Vitest + Supertest | Express app을 실제 request 형태로 통과시키되 고정 port와 별도 process를 관리하지 않는다. | 별도 devDependency가 추가되고 실제 배포 process는 검증하지 않는다. | **route 계약 검사로 채택** |

이 표의 “미선택”은 도구가 프로덕션 수준이 아니거나 사용할 수 없다는 판정이 아니다. 현재 server의 Node 20·ESM·Express 구조와 Ticket 05가 요구하는 실제 응답 보존에 비해 추가 설정이나 실행 범위가 더 크다는 이번 선택이다.

## 결정에 사용한 현재 저장소 근거

- [server package 설정](../../../../../apps/server/package.json)은 `type: module`, `tsx` 개발 실행, `tsup` 빌드와 `node dist/index.js` 시작을 사용하며 아직 test script가 없다.
- [server TypeScript 설정](../../../../../apps/server/tsconfig.json)은 `module: ESNext`, `moduleResolution: bundler`, `target: ES2022`다.
- [server build 설정](../../../../../apps/server/tsup.config.ts)은 Node 20 대상 단일 ESM 출력을 만든다.
- [Express app](../../../../../apps/server/src/app.ts)은 listen과 분리돼 Supertest에 직접 전달할 수 있지만 routes import를 통해 config와 DB 생성까지 이어진다.
- [client Jest 설정](../../../../../apps/client/jest.config.cjs)은 `jest-expo` preset과 React Native 변환을 소유하므로 server test config의 기존 원천으로 사용하지 않는다.

## 왜 Vitest를 선택했는가

서버는 `type: module`, TypeScript `module: ESNext`, `moduleResolution: bundler`를 사용하며 개발은 `tsx`, 배포 빌드는 `tsup`의 단일 ESM 출력이다. `app.ts`를 import하면 routes를 거쳐 config 검사와 DB client 생성까지 이어지므로 실제 DB와 auth를 대체하려면 app 평가 전에 module mock을 적용해야 한다.

Vitest 4.1.11은 현재 선언된 Node 20에서 TypeScript·ESM을 실행하고 `vi.mock`으로 import 전 module 대체를 구성할 수 있다. 최신 Vitest 5를 사용하려면 Node 22.12 이상으로 서버 runtime까지 올려야 하므로 테스트 기반 도입과 별도 migration으로 남겼다. Vitest 4가 직전 major라는 비용은 받아들이되 정확한 버전을 고정하고 Node upgrade 시 지원 상태와 Vitest 5 전환을 재검토한다.

Node 20.18.1의 `node:test` runner 자체는 stable이며 module mock도 불가능하지 않다. 다만 `mock.module`은 기본 상태에서 비활성화되고 `--experimental-test-module-mocks`가 필요하며 공식 문서상 `Early development`다. TypeScript 실행에는 `tsx` 연결도 필요하다. 앞선 조사에서 이를 “없다”라고 배제했던 설명은 잘못이었고, 실제 고정 Node 바이너리와 공식 문서를 다시 확인해 실험 기능 의존의 가능한 대안으로 바로잡았다. dependency 최소화보다 안정된 ESM mock과 단순한 실행 계약을 우선해 이번에는 선택하지 않았다.

client에 설치된 Jest 29는 `jest-expo`와 React Native 변환을 위한 client 전용 설정이다. 서버에서 재사용하려면 별도 config와 ESM 실행·mock 설정이 필요하고 Jest 29의 ESM module mock은 실험 API를 사용하므로, 같은 이름의 runner를 쓴다는 이점보다 runtime별 설정 분리가 낫다고 판단했다. Mocha 조합은 ESM 테스트를 지원하지만 assertion과 module mock 도구를 추가로 조립해야 해 이번 기반에서는 선택하지 않았다.

## 왜 Supertest를 함께 선택했는가

Vitest만으로 순수 함수를 호출하거나 가짜 `req`·`res` 객체를 만들어 route handler를 직접 검사할 수 있다. 그러나 handler 직접 호출은 `/api`와 `/schedules` router 연결, Express body parser, middleware 순서, not-found·error 처리와 실제 status·JSON 생성을 건너뛴다. Vitest 안에서 서버를 직접 `listen`하고 Node `fetch`를 호출하는 방법도 가능하지만 임시 port, 준비 대기, socket과 server 종료를 테스트가 직접 관리해야 한다.

Supertest는 테스트 runner를 대체하지 않는다. 현재 `src/app.ts`가 listen과 분리해 export하는 Express app을 받아 임시 HTTP server lifecycle을 관리하고, 실제 request 형태로 middleware와 router를 통과한 응답을 돌려준다. 이후 Vitest가 그 응답을 판정한다. 따라서 두 도구의 관계는 중복이 아니라 다음 책임 조합이다.

```text
Vitest가 test case 실행·mock 등록
  → Supertest가 Express app에 HTTP 요청
  → middleware·router·handler가 mock DB/auth를 사용
  → Supertest가 status·header·JSON 수집
  → Vitest assertion이 계약 보존 판정
```

Ticket 05에서 중요한 것은 serializer 함수가 올바르다는 사실뿐 아니라 실제 endpoint가 그 직렬화를 사용해 기존 status·response envelope·네 날짜 필드를 유지한다는 것이다. 이 연결을 낮은 server lifecycle 비용으로 검사하기 때문에 Supertest를 함께 선택했다.

## 검사 층과 증명 범위

첫 설정과 실행은 다음 층을 구별한다.

1. **Vitest 단위 검사:** 직렬화 함수가 생기면 `Date`와 nullable `deletedAt`을 API ISO 문자열로 바꾸는 순수 변환을 확인한다.
2. **Vitest + Supertest route 계약 검사:** mock DB/auth 아래에서 Schedule을 반환하는 실제 route의 method·path·status·envelope·날짜 JSON을 확인한다. 공통 직렬화 실행 전 특성화 결과와 실행 후 결과를 같은 조건으로 비교한다.
3. **실제 PostgreSQL 통합 검사:** ownership, soft delete와 실제 query 결과가 작업 범위에 들어올 때 격리된 test DB에서 확인한다. mock route 검사 통과를 실제 SQL 의미의 증거로 확대하지 않는다.

Supertest는 별도 프로세스로 배포된 서버의 실제 socket·reverse proxy·운영 환경 파일 로딩을 증명하지 않는다. 그런 배포 경계가 필요하면 server를 실제로 기동한 smoke 또는 integration 검사를 별도로 둔다.

## 현재 설정에서 함께 발견했지만 이번 결정에 합치지 않은 사항

- `.nvmrc`는 Node 20.18.1을 선언하지만 server `package.json`의 `engines`나 CI가 이를 강제하지 않는다.
- 단일 `dist/index.js` 번들에서 `config/index.ts`의 상대 환경 파일 경로가 `apps/server/.env.production`이 아니라 `apps/.env.production`을 가리키는 것으로 재구성됐다. 실제 production process는 기동하지 않았다.
- 일부 내부 import는 `.js` 확장자를 명시하고 일부는 생략한다. 현재 `tsx`·`tsup`에서는 해결되지만 번들 없는 native ESM이나 `NodeNext` 검사로 바꾸면 재검토해야 한다.
- 현재 Docker Compose는 server app이 아니라 개발용 PostgreSQL 14만 제공한다. 통합 테스트 DB의 생성·격리·정리 방식은 실제 통합 테스트를 도입할 때 정한다.

이 항목은 테스트 기반 선택에 영향을 준 조건과 별도 확인 후보다. 이번 결정으로 배포 설정 결함 수정, Node upgrade, import 정리나 PostgreSQL test fixture 설계까지 승인된 것으로 보지 않는다.

## 아직 하지 않은 일과 다음 행동

현재 server package에는 Vitest·Supertest dependency, test script, config와 server test 파일이 없다. TypeScript에서 Supertest를 사용할 때 필요한 type package의 정확한 버전도 실제 설치 호환성을 보고 정한다. 설치·설정·smoke test, mock이 app import 부작용을 실제로 차단하는지 확인, Schedule 특성화 테스트와 제품 코드 변경도 아직 수행하지 않았다.

다음 실행은 server package 안에 최소 테스트 설정을 만들고 실제 Node 20.18.1에서 smoke test를 통과시킨 뒤, mock 기반 Schedule route 계약 테스트로 현재 응답을 먼저 고정하는 것이다. 그 근거가 생긴 뒤 일곱 소비 지점의 공통 직렬화 책임과 helper Owner를 최종 확정하고 제품 코드를 변경한다.
