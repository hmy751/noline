# 커밋과 OTA 소스맵: 토큰 배치, 업로드, Sentry 확인

2026-11-17 오전 11시 50분경부터 오후 1시 50분경(KST)까지의 기록이다. 먼저 011 작업을 브랜치에 커밋했다. 이어서 OTA 업데이트의 Sentry 소스맵을 로컬 토큰으로 올리기로 정했다. 시험 업데이트로 실제 오류가 원래 소스 위치로 풀리는 것을 확인했고, 정리 업데이트로 시험 코드를 뺐다. 이로써 [완료 판단](../current/memory/spec/04-quality-and-completion.md) 5 가운데 preview 쪽 소스맵이 확인됐다. production 쪽은 아직이다.

원문은 [source 색인](../source/index.md)의 두 번째 세션 원문이다. 괄호 안 숫자는 그 파일의 행 번호이며, 이 기록의 범위는 3005–3527행이다. 3377행에 컨텍스트 압축 요약이 끼어 있어 그 부분의 timestamp 순서가 어긋나 보인다. 사실은 앞뒤 도구 결과로 대조했다. 토큰과 DSN 같은 값은 적지 않았다.

## 커밋

> "지금 커밋해" (3033)

Main은 브랜치 `feat/011-expo-updates`에 다음을 올렸다(3033–3102). push와 main 병합은 하지 않았다. 사용자가 앞서 "011이 끝나면 병합"하기로 했기 때문이다.

| 커밋 | 내용 |
| --- | --- |
| `cad1ec8f` | main 병합. main에 먼저 낸 서버 수정 `99235878`을 가져왔다. 작업 트리에 있던 같은 내용의 서버 사본은 지우고 이 병합으로 대신했다 |
| `3592a538` | feat(client): expo-updates 설정, dev-client 정렬, dev-menu patch, iOS 15.0, `eas.json`의 channel·environment |
| `233e0a17`(이력 정리 뒤 `ba06e62a`) | docs(context): Work 011 기록 |
| `212040c2`(이력 정리 뒤 `bb459027`) | docs(context): Work 011 문서의 "미커밋" 서술을 커밋 상태로 고침 |

무관한 미커밋 파일은 그대로 두었다. `context/personal/experience/*`, Work 006 문서 두 개, `.pnpm-store/`다.

## 소스맵 방식을 정한 과정

> "Sentry 소스맵은 어떻게 할지 정리해줘" (3107)

Main이 현재 상태를 정리했다(3159).
- 스토어 빌드는 EAS가 빌드할 때 소스맵을 올린다. EAS 서버에서는 SECRET 토큰을 쓸 수 있다.
- OTA 업데이트는 번들을 새로 만들므로 소스맵을 따로 올려야 한다. 지금은 아무도 올리지 않는다.
- 업데이트 번들에는 소스맵과 짝을 맞출 debug ID가 들어 있다. 업로드 도구는 `@sentry/react-native`에 있다. 빠진 것은 로컬에서 쓸 토큰뿐이다.

Main은 두 안을 비교했다. A는 로컬에서 `eas update` 직후 업로드하는 방식이고 Main의 추천이었다. B는 EAS Workflows로 서버에서 발행과 업로드를 함께 하는 방식이다. B는 오래된 로컬 `node_modules` 문제도 없애 주지만 준비 비용이 크다. 그래서 Ticket 02에서 다시 보기로 했다. A의 토큰은 처음에 별도 파일 `apps/client/.env.sentry-build-plugin`에 두자고 했다.

이어서 사용자가 토큰 위치를 두 번 물었다.

> "근데 토큰 파일을 저렇게 해야돼? 그냥 .env.production 이나 .env.devleopment 에 넣으면 안되나?" (3164)

> "지금 개발이랑 운영 나뉜거 아니야? 운영에만 넣어도 되나?" (3184)

Main은 운영에만 넣어도 된다고 답했다(3194). Sentry 프로젝트는 하나이고 environment 표시로 나뉘며, 업로드 토큰은 조직 단위로 하나라는 이유였다. 실제 사용자 오류를 읽어야 하는 것은 production 업데이트라는 점도 들었다. 이 답에서 앞선 설명 하나도 정정했다. `app.config.js`는 `SENTRY_ORG`·`SENTRY_PROJECT`가 둘 다 있을 때만 Sentry 빌드 단계를 넣는다. 그래서 `.env.production`에 토큰만 넣으면 로컬 빌드에는 영향이 없다.

### 확인하지 않은 말의 정정

> "너 실제 env 접근한거야? 확인해봐" (3199)

Main이 실제 파일과 EAS 값을 다시 읽어 보니 앞의 말 두 개가 틀렸다(3203–3253). 값은 출력하지 않았다.
- "로컬 개발 앱에는 Sentry 설정이 없다"는 틀렸다. `.env.development`만 보고 `.env.development.local`을 놓쳤다. 그 파일에 Sentry 설정과 업로드 토큰이 이미 있었다.
- "토큰을 새로 발급해야 한다"도 틀렸다. 로컬에 있던 토큰으로 업로드할 수 있었다.
- 로컬과 EAS production·preview가 같은 Sentry 프로젝트를 가리키고 environment 값만 다르다는 것은 맞았다.

확인한 뒤에 말한다는 기준을 이 대목에서 다시 어겼다. 사용자의 질문으로 정정됐다.

### 사용자의 선택

Main은 토큰을 한 곳에 두고 업로드 때 `.env.development.local`을 읽자고 추천했다. 사용자가 답했다.

> "그냥 복사해서 토큰 두곳에 있게 하는게 덜 헤깔리고 그렇지 않ㄴ아?" (3258)

Main이 동의했다. 단점은 토큰을 바꿀 때 두 곳을 모두 고쳐야 한다는 것이다. Main은 `.env.development.local`의 `SENTRY_AUTH_TOKEN` 한 줄을 설명 주석과 함께 `apps/client/.env.production`에 복사했다(3268–3291). 이 파일은 gitignore 대상이다. 값은 출력하지 않았다. `.env.production`에는 Sentry 값이 토큰만 있으므로 로컬 Release 빌드에는 영향이 없다.

업로드 시험도 했다. 마지막 preview 업데이트 `a86d1596…`의 `dist` 번들로 올렸고 성공했다. 대상은 Sentry 조직 `hmy-k0`의 `noline-mobile` 프로젝트, debug ID는 `544fabb1…`이다.

## 업로드 명령

`apps/client`에서 `eas update` 다음에 실행한다. `dist`의 hbc와 map을 debug ID로 올린다.

```
EXPO_NO_DOTENV=1 eas env:exec <환경> 'node --env-file=.env.production ../../node_modules/@sentry/react-native/scripts/expo-upload-sourcemaps.js dist' --non-interactive
```

토큰은 `.env.production`에서, `SENTRY_ORG`·`SENTRY_PROJECT`는 EAS 환경에서 읽는다. 이번 시험은 preview로 했다. Main이 정리한 운영 발행 순서는 이렇다(3291). 깨끗한 재설치와 runtime 대조, 그다음 `eas update --channel production --environment production`, 그다음 이 업로드다.

## end-to-end 확인

> "그럼 진행해봐" (3297)

**시험 업데이트(3297–3359).**
- LoginScreen 문구 끝에 " · S"를 붙였다. 그 문구를 길게 누르면 `captureException(new Error('ota-sourcemap-test'))`를 보내고 알림을 띄우도록 임시로 바꿨다.
- runtime이 `54a96787…`인 것을 확인한 뒤 preview 그룹 `8c8eb6e9-5c76-467e-ac61-79dbfe49d7d5`로 발행했다.
- 소스맵을 올렸다(debug ID `1b61972b-0816-41c9-8988-2c9777ab12fc`, 성공).
- 그 뒤 코드를 `git checkout`으로 되돌렸다.

사용자가 실기기에서 업데이트를 받고 문구를 길게 눌렀다.

> "알림 떴어 확인해봐" (3364)

**Sentry 확인(3449–3471).** Main이 Chrome에서 Sentry API를 읽었다. 조직은 `hmy-k0`, 조건은 environment:preview다.
- issue `7851900817`, "Error: Application exception", 2026-11-17 04:43:55Z, 1건. 메시지는 개인정보를 거르는 처리 때문에 이렇게 바뀐 것으로 Main이 설명했다.
- culprit은 `Text.props.onLongPress(src/screens/LoginScreen)`다.
- 최상위 in-app frame은 `/src/screens/LoginScreen.tsx`의 `Text.props.onLongPress`, 144:133이다. 그 위로 `node_modules/react-native/.../Pressability.js`가 이어진다.
- raw frame은 `app:///main.jsbundle` 1:1683257이다. 번들 전체가 한 줄이라 이 위치만으로는 어느 코드인지 알 수 없다.
- event error는 없었다.

결론: OTA 번들에서 난 오류가 업로드한 소스맵으로 원래 소스 위치까지 풀린다. 이 길게 누르기 코드는 설치된 빌드에는 없고 시험 업데이트에만 있다. 그래서 이번에 올린 소스맵이 쓰였다는 근거가 된다.

**정리 발행(3471–3522).**
- 시험 코드가 없는 트리에서 runtime이 `54a96787…`인 것을 다시 확인했다.
- preview 그룹 `f40c0676-efe7-479d-a0aa-a137e547ccdc`("Sentry 시험 문구 제거")를 발행했다.
- 번들에 `ota-sourcemap-test`가 없는 것을 확인했다.
- 소스맵을 올렸다(debug ID `544fabb1-9faf-459e-bf60-053317c91636`, 성공). 앞서 시험 업로드한 `a86d1596…` 번들과 debug ID가 같다. 소스가 같아 같은 번들이 나온 것으로 보인다.
- 롤백 대신 재발행한 이유가 있다. 설치된 빌드에는 운영용 Google client가 들어 있어서, 롤백하면 시험 앱의 Google 로그인이 다시 막힌다.

> "원래 문구로 돌아옴" (3527)

## 남은 것

- 완료 판단 5의 production 쪽: production 채널 번들의 환경값과 소스맵
- 발행 절차를 [Ticket 02](../current/memory/tickets/02-ota-publish-guard.md)의 스크립트로 묶기: 깨끗한 재설치 → runtime 대조 → `eas update` → 소스맵 업로드
- 토큰을 바꿀 때 `.env.production`과 `.env.development.local` 두 곳을 모두 고칠 것

## 이 기록으로 고친 current

- Ticket 01 단계 5·6, Ticket 02 발행 절차 후보, Spec 05 발행 행, state, recover, output·source·records 색인
