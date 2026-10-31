# 공유 schema와 실제 검증 경계를 함께 유지한다

**언제 쓰나:** TypeScript 모델·props·공유 request/response·입출력 변환을 바꿀 때 읽는다. 공통 시작은 [개발 기준](INDEX.md)이다.

**핵심 기준:** 공유 shape는 `@repo/schema`에서 정의하고 타입을 추론한다. 외부 값의 유효성은 실제 `parse`/`safeParse`나 검증하는 경계로 확인한다. `z.infer`, 타입 단언, HTTP generic은 런타임 검증을 실행하지 않는다.

## 계약의 종류에 맞는 schema에서 시작한다

| 위치 | 역할과 변경 영향 |
| --- | --- |
| `entities` | 공유 entity shape. 물리 DB 컬럼의 TypeScript 표현과 항상 동일한 것은 아니다. |
| `requests` | 생성·수정 payload의 필드 선택·기본값·검증·호환 변환. 폼 전용 상태와 구별한다. |
| `responses` | 응답 wrapper와 직렬화된 data shape. 실제 server 응답과 client parse를 함께 확인한다. |
| `sync` | push/pull·queue 관련 계약. 전송 payload의 실제 검증과 저장 절차는 각 실행부가 맡는다. |
| `primitives` | 여러 schema가 함께 사용하는 값의 의미·검증. 공개 import 가능 여부는 package export를 확인한다. |

Schema와 같은 DTO shape를 손으로 복제하지 않는다. 사용처에서 `z.infer<typeof schema>`로 추론하고 client model에서 재export할 수 있다. Schema package의 기본 공개 대상은 schema지만, 현재 `entities/user.ts`의 `AuthProvider`처럼 schema에서 추론한 type export도 있다. 따라서 “type import가 전부 불가능”하다고 설명하지 않는다. 이 예외는 별도 수기 DTO를 허용하는 근거가 아니다.

현재 지원하는 subpath와 root export는 [package.json](../../../../packages/schema/package.json)과 [index.ts](../../../../packages/schema/src/index.ts)에서 각각 확인한다. 예를 들어 `@repo/schema/entities/trip`은 있지만 `@repo/schema/entities` 묶음 export는 없다. 파일이 있다는 사실만으로 공개 import 경로라고 추론하지 않는다.

다음은 실제 존재하는 schema의 타입 연결 예시다. 타입 선언만으로 요청이 검증되지는 않는다.

```typescript
import { z } from 'zod';
import { createExpenseRequest } from '@repo/schema/requests/expense';

type CreateExpense = z.infer<typeof createExpenseRequest>;
const request = createExpenseRequest.parse(input); // input은 경계에서 받은 값
```

기본값·transform이 있는 schema에서는 parse 전 입력과 반환 값이 다를 수 있다. 외부 입력을 받는 함수의 타입이 필요하면 `z.input`, 검증·변환 뒤 값은 `z.output` 또는 `z.infer`의 의미를 구별한다. 폼 초안은 local type을 가질 수 있지만 제출할 때 공유 request 계약으로 수렴해야 한다.

## DB·HTTP·폼의 표현이 다르면 변환을 명시한다

예를 들어 Expense amount는 공유 계약에서 string이고 서버 DB는 decimal이다. Expense date는 공유 entity/응답에서 `YYYY-MM-DD`이며 서버 저장은 timestamp다. 옛 datetime 요청의 호환 변환도 남아 있다. schema 주석의 “DB와 1:1”을 모든 메모리·전송 표현이 동일하다는 보장으로 읽지 않는다. [날짜와 시각](../../common/date-and-time.md), [통화와 금액](../../common/currency.md)이 필드 의미와 호환을 소유한다.

[Expense API](../../../../apps/client/src/entities/expense/api/expenses.ts)는 request parse 후 HTTP를 호출하고 response를 parse해 data를 반환한다. [서버 Expense route](../../../../apps/server/src/routes/expenses.ts)는 request·직렬화 응답을 검증한다. 이 직접 대조는 모든 API·sync payload가 같은 강도로 검증된다는 뜻은 아니다. 현재 sync push schema의 payload는 `z.any()`이므로 그 선언만으로 entity별 입력이 검증된다고 말할 수 없다. 실제 처리·오류 계약은 [API 가이드](../api-contracts.md)와 [데이터 수명](../data-lifecycle/INDEX.md)을 따른다.

## 타입으로 알고 있는 것과 확인한 것을 구별한다

함수 parameter와 props의 계약, 복잡한 반환값을 명시한다. 불확실한 외부 값은 `unknown`에서 필요한 shape를 검증한다. `any`, `as`, non-null assertion을 쓰기 전에 좁히기·schema 검증을 우선하고, 불가피한 `any`는 이유를 주석으로 남긴다. 속성 존재만 검사한 guard로 그 속성의 값 타입까지 확인했다고 주장하지 않는다. Optional chaining은 null 접근을 줄일 뿐 외부 값의 shape 검증을 대신하지 않는다.

기본 타입 선언은 `type`을 사용한다. Union·utility 조합·함수 signature·props도 같은 기본을 따르고, declaration merging이나 class 구현 등 interface의 이유가 있는 경우를 구별한다. 현재 UI·network·policy에는 interface 사용이 남아 있으므로 전부 이 기준을 준수한다고 설명하지 않는다. 문서 이관을 이유로 제품 타입을 일괄 변경하지 않는다.

선택적인 prop은 `?`로 표시하고 기본값은 구현에서 정한다. 여러 성공·실패 상태는 discriminated union으로 좁힐 수 있으며, generic·Pick/Omit 같은 도구는 실제 재사용 관계를 표현할 때 쓴다. 교육용 store·인증 예제를 새 인프라나 실제 보안 보장으로 복사하지 않는다.

## 코드 스타일은 기존 기준과 실제 검사 범위를 나누어 적용한다

- Import는 React·React Native·Expo, 외부 라이브러리, `@repo/*`, 앱 절대경로, 상대경로 순으로 묶는다. 외부·workspace·앱 절대경로 묶음은 알파벳순, 상대경로는 가까운 순이라는 기존 기준을 적용한다. 실제 package export와 React Native 코드를 사용한다.
- 변수·함수는 camelCase, component·class·type은 PascalCase, 상수는 UPPER_SNAKE_CASE를 사용한다. Boolean은 is/has/should, event handler는 handle로 의도를 드러내며 모호한 data/temp/flag 대신 대상과 상태를 구체화한다.
- 일반 함수는 화살표 함수, 비동기는 async/await를 기본으로 한다. 기존 선언식 함수와 Promise 체인이 존재한다는 사실은 전역적으로 정리됐다는 뜻이 아니다. 관련 수정에서 책임과 실패 전달이 읽히는지 함께 본다.
- 조건문의 중괄호를 생략하지 않고 임시 console.log·미사용 변수는 남기지 않는다. 의도적으로 무시한 값은 `_` prefix로 드러낸다. warn/error 허용을 같은 오류의 반복 기록 의무로 해석하지 않는다.
- 복잡한 함수는 필요한 입력·반환·실패 의미와 예시를 JSDoc으로 설명한다. 한 작업의 책임을 드러내되 검증·변환·저장을 조율하는 함수가 있다는 이유만으로 무조건 분리하지 않는다.

실패는 소비자가 처리할 수 있게 전달한다. 의미를 바꾸지 않고 기록 뒤 다시 throw만 하는 catch를 매 함수에 붙이지 않으며, 오류를 null·빈 배열로 바꾸는 예제를 일반 규칙으로 적용하지 않는다. 그런 반환이 기존 계약이면 해당 Owner에서 보존·변경 여부를 판단한다. 현재 [ESLint 설정](../../../../packages/eslint-config/src/index.js)과 코드 스타일의 선언을 구별하고, lint 통과만으로 이 본문의 모든 규칙과 API 동작이 검증됐다고 하지 않는다.
