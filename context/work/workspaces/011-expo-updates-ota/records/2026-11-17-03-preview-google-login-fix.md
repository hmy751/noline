# preview 앱 Google 로그인: 원인과 수정

2026-11-17 오전 11시경부터 11시 50분경(KST)까지의 기록이다. 실기기 시험 중 시험 앱의 Google 로그인이 "액세스 차단됨"으로 막혔다. 이 구간에서 원인을 확인하고, 서버·EAS·운영 서버 설정을 고쳐 운영 앱과 시험 앱 모두 로그인되게 했다. OTA 확인과는 별개의 일이다. 하지만 원인이 이 Work에서 EAS preview 환경을 채운 방식에 있었고, 고치는 과정에서 운영 서버를 바꿨으므로 여기에 남긴다.

원문은 [source 색인](../source/index.md)의 두 번째 세션 원문이다. 괄호 안 숫자는 그 파일의 행 번호이며, 이 기록의 범위는 2268–3005행이다. Main은 Google Cloud Console과 Render 대시보드를 사용자의 Chrome에서 직접 읽고 조작했다. 비밀값과 client ID 값은 대화와 이 기록에 적지 않았다.

## 확인 방법 질문과 원인

사용자가 "구글 그거 어디서 어떻게 구체적으로 확인하지?"(2211)라고 물었다. Main은 두 가지 확인 방법을 안내했다(2272). 하나는 iPhone의 오류 세부정보이고, 다른 하나는 Google Cloud Console의 OAuth 클라이언트 번들 ID와 동의 화면 상태다. 이어서 사용자가 열어 둔 Chrome 탭을 함께 확인했다(2301–2442). 처음에는 Claude 탭 그룹 밖의 탭이라 보이지 않았고, 사용자가 다시 열자 읽을 수 있었다.

Google Cloud Console의 noline-auth 프로젝트에는 OAuth 클라이언트가 셋 있다(2442–2511).

| 이름 | 유형 | 번들 ID |
| --- | --- | --- |
| noline-ios-prod | iOS | 운영 앱용(화면에서 열어 보지는 않음) |
| noline-ios-dev | iOS | `com.noline.dev`(화면에서 확인) |
| noline-web | 웹 | – |

원인은 이렇다(2448, 2511–2557).
- [착수 기록](2026-11-17-01-ticket01-build-gate-and-publish-env.md)에서 EAS preview 환경을 채울 때 production의 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`를 그대로 공유했다. 그래서 preview 앱이 운영용 client를 썼다. 로컬 `.env.development`는 원래 개발용 client였는데, 공통 변수를 고를 때 이 차이를 놓쳤다.
- `expo-auth-session`의 Google provider는 redirect URI를 `${applicationId}:/oauthredirect`로 만든다. 시험 앱에서는 `com.noline.dev:/oauthredirect`다. 운영용 client에는 이 번들이 등록돼 있지 않아 Google이 "액세스 차단됨"을 냈다.
- 서버도 문제였다. `apps/server/src/routes/auth.ts` 140행은 ID 토큰의 audience로 `[GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID]`만 허용했다. iOS client는 하나뿐이다. 그래서 앱이 개발용 client로 Google을 통과해도 운영 서버가 그 토큰을 거부할 상황이었다.

사용자가 이해되지 않는다며 표와 구체적인 값으로 다시 설명해 달라고 했다(2516, 2531). Main은 로그인을 세 단계로 나눠 표로 설명했다. 앱의 요청, Google의 번들 검사, 서버의 audience 검사다. 각 단계에서 오가는 값(`client_id`, `redirect_uri`, `aud`)과 코드 위치를 함께 보였다(2520, 2557).

## 사용자의 진행 지시

> "그럼 다 진행하자 근데 너무 비밀값다 노출하진말고 대화에 날 시키던가" (2562)

Main은 서버 코드와 EAS를 고친 뒤, 운영 배포와 Render 환경 변수 변경은 승인이 필요하고 순서가 중요하다고 정리했다(2696). 사용자가 답했다.

> "그냥 니가 env확인해서 처리해주라 보니까 좀 안맞는것도 있어보이네" (2701)

## 수정

### 1. 서버: iOS client를 여러 개 허용

`GOOGLE_IOS_CLIENT_ID`를 쉼표로 구분한 목록으로 받게 했다(2611–2649). 값이 하나면 이전과 같이 동작한다.
- `apps/server/src/config/env-list.ts`의 `parseCommaList`를 새로 만들었다.
- `config.googleOAuth.iosClientIds`로 바꿨다.
- `auth.ts`의 허용 audience에 목록 전체를 넣었다.
- 서버 README의 환경 변수 설명을 고쳤다.
- `tests/config/env-list.test.ts`를 새로 만들었다.

`pnpm run server typecheck`가 통과했고, 서버 테스트는 89개 모두 통과했다(새 테스트 3개 포함).

서버 파일만 별도 worktree에서 커밋해 main에 push했다(2808–2825). 커밋은 `99235878` "fix(server): Google 로그인에서 iOS client를 여러 개 허용한다"이고, main은 `08ff4c27`에서 이 커밋으로 올라갔다. 클라이언트 변경과 독립적이라 011 브랜치를 기다리지 않고 따로 냈다. Render가 main을 auto-deploy해 Live가 됐다(Render 표시 커밋 `9923587`). 임시 worktree와 브랜치는 지웠다(2941–2949). 같은 서버 변경은 `feat/011-expo-updates` 작업 트리에도 미커밋으로 남아 있다. 내용이 같으므로 병합 때 겹친다.

### 2. EAS: Google iOS client를 환경별로 분리

`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`를 production 전용으로 바꾸고, preview 전용 값을 새로 만들었다(2658). 값은 출력하지 않고 두 환경에 서로 다른 client가 들어간 것만 확인했다. 착수 기록에서 "공통 13개"라고 적은 변수 가운데 이 하나는 이제 환경별 값이다.

### 3. preview OTA

이 client ID는 JS에서만 쓰므로 다시 빌드하지 않고 업데이트로 고쳤다. `eas update --channel preview --environment preview`로 그룹 `a86d1596-fc55-46e1-a357-6ae6486e91ac`를 발행했다. runtime은 `54a96787…`로 빌드와 같다(2677–2785). 번들에는 preview client가 1번 들어 있고, 운영 client는 0번이었다. 이제 preview 채널의 최신 업데이트는 rollback-to-embedded가 아니라 이 업데이트다.

### 4. Render 환경 변수

배포가 Live가 된 뒤 Render의 `GOOGLE_IOS_CLIENT_ID`를 "운영,개발" 두 값으로 바꿨다. 이어서 Save, rebuild, and deploy를 실행해 Live가 됐다(2859–2965). 넣은 두 값은 값을 출력하지 않는 방식으로 로컬 값과 대조해 일치를 확인했다.

**순서를 지킨 이유:** 옛 서버 코드는 쉼표가 든 값을 통째로 ID 하나로 읽는다. 값을 먼저 바꿨다면 운영 앱의 Google 로그인까지 깨졌을 것이다. 그래서 코드 배포가 Live가 된 것을 확인한 뒤 값을 바꿨다(2696, 2859).

## 확인

- 운영 서버 `/api/health`가 200을 반환했다. Google 로그인 경로는 빈 요청에 400을 반환했다(2970–2974).
- 사용자가 실기기에서 확인했다. 시험 앱은 업데이트를 받도록 두 번 실행한 뒤 시도했다.

> "둘 다 로그인 잘 돼" (2985)

운영 앱과 preview 앱 모두 Google 로그인에 성공했다.

## 변수 이름 비교 (값은 비교하지 않음)

사용자가 "좀 안맞는것도 있어보이네"라고 한 데 따라 Main이 변수 이름을 비교했다. 대상은 서버 코드, Render, `render.yaml`, 로컬 `.env.production`이다(2974). 동작 문제는 없어서 그대로 두었다.
- `JWT_EXPIRES_IN`: 코드가 읽지 않는다(무해).
- `SENTRY_*`: Render와 코드에만 있다.
- `NODE_VERSION`: `render.yaml`에만 있다. `render.yaml`이 실제 서비스에 적용되지 않는 것으로 보인다(Main 판단, 미확인).
- `PORT`: Render가 자동으로 주는 값이다.

## 남은 제한

- preview 앱의 Apple 로그인은 실패할 수 있다. 서버의 `APPLE_CLIENT_ID`가 운영 번들이기 때문이다. 미확인이며 이번 범위 밖이다.
- 이 서버 변경(iOS client 목록)은 Project 반영 후보다. 서버 README는 이미 갱신했다. [Ticket 03](../current/memory/tickets/03-project-context-reflection.md)에 연결했다.

## 이 기록으로 고친 current

- state, Ticket 01 주의, Ticket 03 연결, Spec 05의 preview 로그인 가정, output·source·records 색인
