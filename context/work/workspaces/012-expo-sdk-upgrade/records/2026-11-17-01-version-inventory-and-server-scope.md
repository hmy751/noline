# 2026-11-17 — 버전 설정 전수 조사와 서버 Node를 범위에 넣은 이유

## 쟁점

012를 다시 읽은 뒤 사용자가 Node도 올리고 싶다며 저장소 전체의 버전 설정을 정리해 달라고 했다.

> "노드버전도 올리고 싶어 그리고 전반적 버전 셋팅을 확인하면 좋겠어 그래서 좀 정리해줘 봐 리스트업"

Main이 앱·공유 패키지·서버의 버전 설정을 모아 보여 주자, 012가 범위에서 뺐던 서버를 다시 물었다.

> "서버도 하는게 낫지 않나? 좀 잘 정리해봐 필요한 요소들이랑 현재 이후 랑해서"

쟁점은 세 가지였다. 서버 Node를 이 Work에 넣을지, 목표 Node를 몇으로 할지, Node·SDK를 어떤 순서로 바꿀지다. 원문은 Main 대화 `cf346e87-7dfb-4441-ae53-cf37d3cefece`(JSONL 로그)의 줄 번호로 찾는다. 사용자 발화는 98·174·212행, Main의 두 정리는 169·202행이다.

## 012 작성 뒤 바뀐 전제

012는 2026-11-16 작성됐고, 그 뒤 Work 011이 main에 병합됐다. Main이 대화 처음에 `git log 08ff4c27..HEAD`와 설정 파일로 확인한 변화다.

- dev-client는 SDK 51용 4.0.29로 정렬됐고 `expo-updates` 0.25.28이 들어갔다. `expo-build-properties`로 최소 iOS가 15.0이 됐다(`3592a538`).
- 011의 판단 지점("SDK 51용 expo-updates·dev-client가 Xcode 26에서 빌드되지 않으면 OTA를 012에 합친다")은 `expo-dev-menu@5.0.23`을 pnpm patch로 고쳐 통과했다. OTA를 012에 합칠 이유는 없어졌다.
- 1.1.4(빌드 18)는 심사 대기 중이다(011 state 기준). 012를 시작하는 순서 조건은 사실상 충족됐고 심사 결과만 남았다.
- Project에 [앱 변경을 사용자에게 내보낼 때의 기준](../../../../project/guidance/app-release-and-ota.md)이 생겼다. 012 `recover.md`의 "Project에 릴리스 본문이 아직 없다"는 더 이상 맞지 않는다.
- EAS 이미지 `xcode-26.2` 고정, Node 20.18.1, `newArchEnabled: false`는 그대로다.

## 전수 조사에서 드러난 것

Main이 `package.json` 여러 개, lockfile에서 실제 설치 버전, `eas.json`, `render.yaml`, `nixpacks.toml`, docker-compose, `START_GUIDE.md`, 로컬 `node`·`eas --version`을 읽어 정리했다. 버전 값 전체는 [제약·현재 설계·가정](../current/memory/spec/05-constraints-design-assumptions.md)의 표에 있다. 여기서는 판단에 영향을 준 발견만 둔다.

**Node 설정과 실제 실행이 다르다.** Node는 네 곳(`.nvmrc` 20.18.1, `eas.json` `base.node` 20.18.1, `render.yaml` `NODE_VERSION` 20, `nixpacks.toml` `nodejs_20`)에 따로 적혀 있는데 로컬 개발은 v24.16.0으로 돌고 있었다. eas-cli 16.28.0도 Node 20 폴더에 설치돼 있지만 Node 24로 실행된다. `engines` 필드가 없어 어긋나도 막는 장치가 없다. Node 20은 2026-04-30에 지원이 끝났다.

**같은 라이브러리가 여러 곳에 다르게 선언돼 있다.**
- react: root `dependencies`에 `^18.2.0`, client·ui `18.3.1`, eslint-config devDependencies `18.2.0`. 이 저장소는 `node-linker=hoisted`로 패키지를 루트 `node_modules`에 끌어올리므로, SDK를 올린 뒤 root의 react 18 선언이 남으면 React 18과 19가 함께 설치될 수 있다. root 선언이 왜 있는지는 확인하지 못했다.
- `packages/ui`가 react 18.3.1·react-native 0.74.5·reanimated ~3.10을 일반 의존성으로 직접 고정한다. SDK를 올릴 때 client와 함께 맞춰야 한다.
- TypeScript 선언은 client `~5.3.3`, ui `^5.5.3`, root `^5.5.4`로 제각각인데 실제 설치는 5.9.3이다.
- ESLint 8과 @typescript-eslint 7을 쓴다. ESLint 8은 지원이 끝났다. 새 SDK의 lint 설정과 맞는지는 보지 않았다.

**서버도 오래된 버전이 섞여 있다.** express 4.21.2, drizzle-orm 0.29.5(client는 0.30.10), drizzle-kit 0.20.18, zod 3.25.76, @sentry/node 10.78.0, 로컬 DB `postgres:14-alpine`. Main은 PostgreSQL 14가 2026년 11월에 지원이 끝난다고 "알고 있다"고 했고 출처로 확인하지 않았다. Render의 실제 DB 버전도 확인하지 않았다.

## 외부 확인

2026-11-17 Main이 웹 검색과 Expo 문서로 확인했다. 출처는 [source 색인](../source/index.md)에 있다.

| Node | 상태(2026-11-17 기준) | 지원 종료 |
| --- | --- | --- |
| 20 | 종료 | 2026-04-30 |
| 22 | Maintenance LTS | 2027-04-30 |
| 24 | 2026-10-20 Maintenance 전환 | 2028-04-30 |
| 26 | 2026-10-28 Active LTS | 2029-04-30 |

Expo SDK 58 changelog는 Node 22.13+·24.3+·26+를 지원하고 홀수 버전(23·25)은 지원하지 않는다고 밝힌다. SDK 58 버전 문서에는 React 19.3.0, RN 0.88, 최소 iOS 16.4, Xcode 26.4+가 있다. changelog에는 RN 0.87부터 Strict TypeScript API가 기본이 된다는 점, expo-router의 navigation core가 다시 짜였다는 점도 있다.

첫 정리(169행) 때 Main은 Node 26 지원과 24.3 하한을 제3자 블로그에서만 봐 "미검증"이라고 했다. 두 번째 정리(202행)에서 공식 changelog로 확인해 갱신했다. Node 날짜는 Node.js 공지와 이를 인용한 요약에서 읽었고, Node.js GitHub 일정표를 직접 열지는 않았다.

## 서버 Node를 넣은 이유

012 spec은 "서버 런타임(Node·Express)은 제외, 앱 빌드 도구로서의 Node만"이라고 적고 있었다. Main은 서버를 넣되 **Node와 그에 따른 도구까지만** 넣자고 추천했다. 이유는 셋이다.

1. **Node 20이 지원 종료됐다.** 2026-04 이후 보안 패치가 없다. 인터넷에 열린 Render 서버가 앱 빌드 도구보다 더 노출돼 있다.
2. **서버 배포가 client 의존성까지 설치한다.** `render.yaml`의 빌드 명령은 루트에서 `pnpm install`을 실행한다. client를 SDK 58로 올리면 서버 배포도 그 패키지들을 Node 20으로 설치하게 되는데, SDK 58은 Node 20을 지원하지 않는다. 앱만 올리면 서버 배포가 깨질 수 있다.
3. **Node 설정을 한 번에 맞춰야 다시 어긋나지 않는다.** 네 곳에 흩어진 값을 같은 작업에서 일원화한다.

서버 라이브러리(Express 5, 최신 drizzle, zod 4, PostgreSQL)는 넣지 않는다. Apple 마감과 무관하고 각각 깨질 위험이 따로 있어, 012에 묶으면 문제가 났을 때 원인을 가르기 어렵다. zod는 `@repo/schema`로 client와 공유하므로 올린다면 함께 판단해야 한다. 이들은 012 밖에서 따로 판단한다.

사용자는 이 정리에 "반영하고"로 답했다(212행). 서버를 Node와 도구까지 범위에 넣는 것은 채택으로 본다. 직접 질문을 던진 것도 사용자였다.

## 목표 Node: 24 (추천)

| 후보 | 판단 |
| --- | --- |
| 22 | SDK 58 공식 최소지만 2027-04-30에 지원이 끝난다. Apple 마감 직후라 제외 |
| 24 | 2028-04-30까지. 로컬에서 이미 24.16으로 개발해 왔다는 실제 근거가 있다 |
| 26 | 2029-04-30까지로 가장 길다. 대신 drizzle-kit 0.20 같은 오래된 도구가 깨질 위험이 더 크다고 보았다(시험하지 않은 판단) |

## 진행 순서 (추천)

1. **서버와 로컬 Node를 24로.** `.nvmrc`, `render.yaml`, `@types/node`, `nixpacks.toml`을 바꾸고 서버 test·integration·typecheck·build를 돌린 뒤 Render에 배포해 확인한다. Expo와 무관해 지금 할 수 있고, 로컬은 이미 24라 위험이 작다.
2. **EAS 빌드 Node 24는 SDK를 올리는 첫 단계와 함께.** SDK 51을 EAS에서 Node 24로 빌드해 본 적이 없다. 지금 따로 바꾸면 1.1.x 핫픽스 스토어 빌드가 막힐 수 있다.
3. **SDK 51 → 54 → New Architecture → 58**, 마지막에 Xcode 27 이미지로 바꾼다. 2026-11-16 추천 그대로다.

사용자는 이 추천에 반대 없이 "반영하고"라고 했다. 다만 Node 24와 이 순서를 따로 골라 확정한 발화는 없으므로 Main 추천으로 둔다. 같은 발화에서 사용자는 이 작업을 이렇게 규정하며 티켓 구성 논의를 요청했다.

> "이게 버전 의존성 문제 때문에 앱이 깨지고 그래서 확인하고 되게 중요한 작업인데 이런 안정성과 순서를 고려해서 티켓 구성도 논의해보자"

이 말은 순서 추천을 다시 볼 기준(깨질 때 원인을 가르고 확인할 수 있는가)을 정한 것으로 읽었다. 티켓 구성은 다음 논의에서 정한다.

## 아직 정하지 않은 것

- 표의 "정리" 항목(ESLint 9 flat config, `engines` 추가)을 012에 넣을지. "연동" 항목(root react 삭제, ui·eslint-config의 react, TypeScript 통일, `@types/node`, START_GUIDE)은 필수 변경을 따라 바뀐다고 분류했다.
- `nixpacks.toml`(Railway)을 실제로 쓰는지. Render를 쓰는 것으로 보여 삭제 후보다.
- eas-cli를 몇으로 올릴지. `eas.json`은 `>= 5.0.0`만 요구한다.
- 서버 라이브러리와 PostgreSQL을 언제 어디서 판단할지.

## 확인 범위와 한계

- Main이 직접 한 것: 설정·lockfile 읽기, `git log`, 로컬 Node·eas-cli 버전 확인, 웹 검색, Expo 버전 문서와 SDK 58 changelog 읽기.
- 빌드·설치·테스트는 하지 않았다. SDK 51의 Node 24 EAS 빌드, 서버의 Node 24 test·배포, 각 도구의 Node 24 동작은 모두 미확인이다.
- 이 기록은 기록 담당자가 대화 원문(3–212행)과 Main이 실행한 명령의 출력을 읽고 작성했다. 버전 값은 그 출력과 현재 `package.json`을 대조했다.
