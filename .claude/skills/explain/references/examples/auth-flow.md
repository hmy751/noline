# 인증 코드의 전체 설명과 후속 질문

여러 부분을 하나의 설명으로 구성할 때 [작성 상세](../constructing-explanations.md#여러-부분을-하나의-설명으로-구성한다)와 함께 읽는다. 같은 코드의 전체 관계를 설명하는 경우와 이미 공유한 흐름의 한 대목을 다시 묻는 경우를 대비한다. 단순 표현 질문에 이 예시 전체를 읽거나 재현할 필요는 없다. 공통 설명 기준·권한·마무리는 [본체](../../SKILL.md)가 맡는다.

## 인증 코드 전체: 등록된 처리와 공유 갱신을 함께 읽는다

과거 대화에서 사용자는 `??=`의 문법을 물은 뒤 인증 요청·응답 처리 코드 전체가 어렵다고 했다. 이때는 ‘요청에 토큰을 붙이고401이면 갱신한다’는 요약이나 갱신 실패 한 대목만으로 끝내지 않는다. 다음은 당시 관측 코드로 구성한 전체 설명 예시다. 코드 블록들은 서로 다른 위치의 발췌이며, 등록부를 제외하면 각 블록 내부의 실행문은 연속된 원문이다. 등록부는 callback 내부를 생략해 위치를 표시한 것으로, 실행 가능한 대체 구현이 아니다. 설명용 사건은 실제 관측 결과가 아니다.

**전체 설명 예시**

이 코드는 **요청이 속한 로그인 세션을 유지하면서, 필요한 토큰 갱신을 같은 세션의 요청들이 공유하고,401 뒤에는 한 번 재시도하도록** 일반 API와 sync의 인증 처리를 연결한다. 먼저 `setupAuthInterceptors`를 호출하는 순간과 나중에 API 요청이 실행되는 순간을 구별한다.

```ts
export function setupAuthInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(async (config: AuthRequest) => {
    // … 아래에서 설명할 요청 전 처리 …
  });

  client.interceptors.response.use(
    (response) => {
      // … 성공 응답의 세션 검사와 반환 …
    },
    async (error: AxiosError) => {
      // … 아래에서 설명할 실패 응답 처리 …
    },
  );
}
```

이 함수를 호출하면 Axios가 나중에 사용할 처리를 등록한다. 이 자리에서 요청·응답·갱신이 모두 한 번 실행되는 것은 아니다. API 요청 때는 요청 전 callback을 거치고, 응답이 오면 성공 또는 실패 callback을 거친다. 두 경로가 필요에 따라 같은 `renewSession`을 호출한다.

```text
요청 전 처리 ── 토큰이 없을 때 ──┐
                                ├─ renewSession: 같은 세션의 갱신 작업 공유
401 응답 처리 ── 첫 재시도 때 ───┘
```

이 그림은 두 호출 경로가 하나의 갱신 기능을 사용한다는 관계만 나타낸다. 요청 전 처리에서 반드시 갱신하는 것도, 모든 응답이401인 것도 아니다. 이제 그 연결을 실제 코드에서 읽는다.

**요청 전에는 이 요청의 세션을 잡고, 그 세션의 토큰을 붙인다.** 다음은 request callback의 본문이다.

```ts
config.sessionId ??= useAuthStore.getState().sessionId ?? undefined;
assertCurrentSession(config.sessionId);

if (!useAuthStore.getAccessToken(config.sessionId)) {
  await renewSession(config.sessionId);
}

assertCurrentSession(config.sessionId);

const accessToken = useAuthStore.getAccessToken(config.sessionId);
if (!accessToken) {
  throw new AuthRequiredError();
}

config.headers.Authorization = `Bearer ${accessToken}`;
return config;
```

`??=`는 이 요청에 세션이 아직 없을 때만 현재 세션을 넣는다. 재시도로 같은 요청이 다시 들어오면 처음 붙인 세션을 유지하므로, 로그인 상태가 바뀌었다고 기존 요청이 새 로그인에 속하게 되지는 않는다.

그 세션의 토큰이 없으면 갱신을 기다린다. 기다리는 동안 로그인이 바뀔 수 있어 `await` 뒤에 다시 세션을 검사한다. 검사를 통과하고 토큰도 있으면 헤더에 붙여 요청 설정을 반환하고, Axios가 요청을 계속 보낸다.

**응답 뒤에는 세션을 확인하고, 첫401에만 재시도한다.** 성공 응답은 요청에 저장된 세션이 여전히 현재인지 검사한 뒤 반환한다. 이전 로그인에서 시작한 응답을 현재 로그인 결과로 받아들이지 않기 위한 처리다.

실패 응답에서는 요청 설정이 없거나 상태가401이 아니면 원래 오류를 전달한다. 요청 설정이 있는401 응답은 아래 처리로 들어간다.

```ts
assertCurrentSession(request.sessionId);

if (request.authRetried) {
  return rejectCredentials(request.sessionId);
}

request.authRetried = true;

await renewSession(request.sessionId);

assertCurrentSession(request.sessionId);

return client(request);
```

`authRetried`는 이 요청이 이미 인증 재시도를 했는지 표시한다. 첫401이면 표시를 남기고 갱신을 기다린다. 세션이 유지됐는지 다시 확인한 뒤 `client(request)`로 같은 요청을 보낸다. 이 요청은 앞의 요청 전 처리를 다시 거쳐 새 토큰을 붙인다.

다시401이면 이미 `authRetried`가 있으므로 재시도하지 않는다. `rejectCredentials`를 통해 재인증을 요구하고 인증 오류로 끝낸다.

**두 경로의 `renewSession`은 같은 세션에서 진행 중인 갱신을 공유한다.** 함수의 시작과 끝을 따로 발췌한다.

```ts
const existing = refreshes.get(sessionId);
if (existing) {
  return existing;
}
```

이미 해당 세션의 갱신 Promise가 있으면 그것을 반환한다. 없다면 그 사이 코드에서 `renewal`이라는 갱신 작업을 만든다. 이 작업은 현재 세션 확인, refresh token 확보, 서버 갱신, 받은 토큰 저장을 수행한다. 다음은 작업을 만든 뒤의 보관·정리·반환이다.

```ts
refreshes.set(sessionId, renewal);
renewal.finally(() => refreshes.delete(sessionId)).catch(() => undefined);
return renewal;
```

같은 세션의 첫 호출이 만든 `renewal`을 Map에 보관하면, 뒤의 호출은 그 Promise를 반환받는다. 예를 들어 두 요청이 함께 토큰 갱신을 요구해도 갱신 작업은 공유한다.

**갱신이 성공한 뒤에는 각 요청의 처리가 이어진다.** 요청 전 처리에서 기다렸다면 토큰을 붙이는 단계로 돌아가고,401 처리에서 기다렸다면 원 요청을 재시도하는 단계로 돌아간다. 두 요청 전체가 하나로 합쳐지는 것은 아니다. 각 경로에 남아 있는 세션 검사도 그대로 거친다.

**갱신 항목의 정리와 호출자에게 결과를 돌려주는 일은 다르다.** `finally`는 끝난 갱신을 Map에서 지워 이후 갱신이 다시 시작될 수 있게 한다. 그 뒤의 `catch`는 정리용 Promise에 붙어 있고, 호출자는 마지막 줄의 원래 `renewal`을 받는다. 따라서 원래 갱신이 실패하면 기다리던 호출자도 실패를 받는다.

실패하면 기다리던 요청도 다음 단계로 진행하지 못한다. 다만 어떤 오류로 끝내고 로그인 상태를 바꾸는지는 조건마다 다르다.

| 갱신 중 조건 | 이어지는 처리 |
| --- | --- |
| 세션 검사 시 작업의 세션이 더 이상 현재 세션이 아님 | 인증 오류로 중단한다. 그 검사 뒤의 자격 증명 거부 처리로 진행하지 않는다. |
| refresh token이 없거나, 현재 세션의 갱신이401·403으로 거부됨 | 재인증을 요구하고 인증 오류로 끝낸다. |
| 연결·서버 장애 등 다른 갱신 오류 | 원래 오류를 전달한다. |
| 받은 토큰의 저장이 수용되지 않음 | 인증 오류로 끝낸다. 이 분기 자체가 재인증 요구를 호출하는 것은 아니다. |

**예시 구성에서 볼 점**

이 예시는 등록부에서 실행 시점을 잡고, 두 호출 경로에서 공유 작업으로 합류한 뒤 각 요청으로 돌아오는 연결을 코드와 대응시켰다. 같은 코드 아래에서도 세션 유지와 대기 후 검사, 공유와 복귀·정리·오류 전달은 구분해 읽게 했다. 성공/실패 경로의 전환과 결과를 바꾸는 조건도 해당 설명 가까이에 둔다. 함수 선언 순서를 그대로 따르거나 각 함수의 역할 표만 제시한 구성과 구별한다. 모든 답에 이 목차·도식·발췌 수를 요구하지 않으며, 이미 공유한 전체를 후속 질문마다 반복하지 않는다.

## 같은 코드의 후속: 갱신 실패 때 어느 세션을 바꾸는가

그 뒤 실제로 코드와 순서를 자세히 설명한 응답이 있었지만, 사용자는 갱신 실패 처리의 특정 대목을 다시 물었다. 그때 다음처럼 이름과 순서만 반복하면 관계가 남는다.

> `catch`에서 현재 세션을 확인하고, 상태가401 또는403이면 자격 증명을 거부합니다.

이는 보완 방법을 보여 주기 위한 요약이다. 보완할 핵심은 **작업이 보관한 세션 값과 현재 저장소의 세션 값이 다를 수 있음**이다. 다음은 원자료의 동작에서 구성한 가능한 상황이며 당시 사용자의 내적 혼동을 확정한 진단은 아니다.

이 관계가 구현된 부분을 먼저 보여 준다. 다음은 당시 `renewSession`의 서버 갱신과 실패 처리 발췌다.

```ts
try {
  tokens = await refreshTokens(refreshToken);
} catch (error) {
  assertCurrentSession(sessionId);

  const status = (error as AxiosError).response?.status;
  if (status === 401 || status === 403) {
    return rejectCredentials(sessionId);
  }

  // 연결 실패·서버 장애는 자격 증명이 거부됐다는 증거가 아니다.
  throw error;
}
```

이 실패 처리는 **현재 세션의 자격 증명이 거부된 경우와 다른 오류를 구별하는 일**을 맡는다. 그런데 다른 로그인으로 바뀐 뒤 옛 요청이 실패했다면, 지금 세션을 재인증 상태로 바꾸면 안 된다. 그래서 오류 종류를 판단하기 전에 `assertCurrentSession(sessionId)`가 작업의 세션이 아직 현재인지 확인한다.

| 기다리는 동안의 값 | 설명용 상황에서의 의미 |
| --- | --- |
| 이 작업이 보관한 `sessionId` | 갱신을 시작한 A이며, 로그인 상태가 바뀌어도 이 값 자체가 B로 바뀌지는 않는다. |
| 현재 Store의 세션 | 기다리는 사이 다른 로그인으로 B가 될 수 있다. |
| `assertCurrentSession(A)` | 현재 B와 다르면 예외를 던져 아래 상태 판정과 `rejectCredentials`로 진행하지 못하게 한다. |

A가 여전히 현재라면 그다음 분기로 간다.401·403이면 자격 증명 거부 처리를 반환하고, 그 밖의 오류는 원래 오류를 던진다. 따라서 코드와 함께 **어느 값이 유지되고 무엇과 비교되며 어떤 후속 처리가 막히는지**를 읽을 수 있다. 이 상황이 실제로 관찰됐다고 말하려면 별도의 실행 근거가 필요하다.

반면 `??=` 자체의 뜻만 묻는다면 `config.sessionId ??= 값`은 왼쪽이 `null` 또는 `undefined`일 때만 오른쪽 값을 대입한다는 짧은 설명과 필요한 대비로 끝날 수 있다. 코드 제시가 필요하다는 사실과 전체 인증 흐름·모든 문법을 다시 설명해야 한다는 판단은 다르다.

예시의 출처·판본·발췌 범위는 [형성 근거](../../_background/evidence.md#실행-상세-예시의-출처와-한계)에 있다. 이 예시는 현재 설명 방법을 적용하는 실행 자료이며 새로운 관찰·시험 결과가 아니다. 설명 방법을 더 이어 볼 때는 [작성 상세](../constructing-explanations.md)로 돌아간다.
