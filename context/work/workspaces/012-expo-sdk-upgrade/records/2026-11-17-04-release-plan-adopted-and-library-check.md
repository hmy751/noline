# 2026-11-17 — 2회 출시안 채택과 라이브러리 호환 점검

원문 줄 번호는 Main 대화 `cf346e87-7dfb-4441-ae53-cf37d3cefece`(JSONL 로그) 기준이다.

## 2회 출시·Ticket 4개 안을 채택했다

Main은 434행에서 출시를 줄인 안을 설명했다.
- 심사는 7번이 아니라 3번이었다. 현재 버전은 1.1.4(빌드 18)라 다음 출시는 1.2.0이 맞다.
- 원칙은 개발 단계와 출시 횟수를 나누는 것이다. "안정성을 지켜 주는 건 심사를 여러 번 받는 게 아니라, 개발할 때 한 번에 하나만 바꾸고 단계마다 검증하는 것"이라고 했다.
- 출시는 2번이다. 1.2.0은 SDK 54 + New Architecture, 1.3.0은 SDK 58 + iOS 27이다. 1.2.0 뒤 1주일 동안 Sentry에 새 크래시가 없으면 1.3.0을 낸다.
- Ticket 표는 01 준비(기준선·점검표·`release/1.1`·서버와 로컬 Node 24), 02 위험 라이브러리 조사·시험 업그레이드, 03 SDK 54 → New Architecture를 preview로 각각 검증한 뒤 1.2.0(EAS Node 24, `expo install --check`, `engines`), 04 SDK 58·iOS 27 출시 1.3.0과 Project 갱신이다.
- 1회 출시를 버린 이유: 기기 DB 변경, New Architecture, iOS 27 시작 구조가 한꺼번에 나간다. 스토어 빌드는 되돌릴 수 없고 OTA는 JS만 고친다. Main은 "실제 사용자가 거의 없다면 1.2.0을 내서 얻는 확인이 약"해 1회 출시도 합리적일 수 있다고 덧붙였다.

사용자는 "그래 좋아"라고 답했다(439행). 이어 같은 흐름에서 Main의 작업을 멈추고 아래 점검을 요청했다(443·446행).

**채택 범위의 판단.** 사용자가 승인한 것은 434행에 보인 안이다.
- 출시 2번과 버전 번호, Ticket 4개, 개발 단계 순서(51→54 Legacy→New Architecture→58), 1.2.0 뒤 1주일 Sentry 관찰은 434행 본문에 있었으므로 채택으로 본다.
- Node 24는 승인한 Ticket 표(01의 서버·로컬, 03의 EAS)에 들어 있었으므로 채택으로 본다. Node만 따로 확인한 발화는 없다.
- preview 앱(`com.noline.dev`)으로 기존 사용자 업데이트를 확인한다는 기본값은 374행에서 나왔고 434행 본문에는 없었다. 그래서 승인 범위에 포함됐다고 보지 않고 Main 기본값(사용자 미확인)으로 둔다.

## 라이브러리 호환 점검

> "잠깐 하나 더 점검하자 reanimated가 어느버전 이상에서 될거야 기록도 있고 이거 말고도 이런식으로 연관된 거 찾아서 요즘 지금 reanimated처럼 쓰이는것도 지금 버전들에서 찾아보자 예를 들어 또 React 19정도는 기본으로 쓰잖아? 이런것처럼"

Main은 저장소의 reanimated 이력과 사용처를 직접 찾았다. 조사는 두 서브에 나눠 맡겼다. 하나는 UI·애니메이션·스타일, 다른 하나는 데이터·네비게이션·테스트·도구다. 서브가 낸 핵심 버전은 Main이 Expo bundledNativeModules와 rnmapbox 릴리스 노트로 다시 대조했다. 버전 표·묶음·출처·미확인은 [라이브러리 호환 조사](../source/library-compatibility-2026-11-17.md)에 있다.

reanimated에 대해 사용자가 떠올린 "기록"은 2025-10-24 커밋 두 개였다. `packages/ui`(^3.14.0)와 client(~3.10.0)의 버전이 어긋나 reanimated를 지웠고 `TripSelector`를 임시로 껐다. 그런데 nativewind가 reanimated에 의존해 같은 날 ~3.10.0으로 다시 넣었다. 원인은 한 라이브러리를 두 패키지가 따로 고정한 구조였다.

## 계획에 미친 영향 (Main 판단)

**SDK 54의 Legacy 단계는 생각보다 좁다.** SDK 54가 정한 reanimated 4.1.1은 New Architecture 전용이다. 그래서 Legacy로 SDK 54를 검증하는 동안은 유지보수가 끝난 reanimated 3.19.x를 `expo.install.exclude`로 고정해야 한다. rnmapbox도 native Mapbox v10을 유지하는 10.1.4x에 둔다. 이 단계는 짧게 지나가야 한다.

**New Architecture 단계에 위험이 모인다.** 이 단계에서 reanimated 4.1 + worklets, rnmapbox 10.3.x(native Mapbox v11)가 함께 바뀐다. 2025-11에 Mapbox가 실패한 지점과 오프라인 pack 보존 위험이 같은 단계에 있다. 그래서 Ticket 02 조사에서 "1.1.4에서 받은 pack이 v11 빌드에서 남는가"를 실기기로 먼저 확인하자고 추천했다.

**SDK 58 단계에 테스트 도구 변경이 몰린다.** RNTL 14(비동기 API, 테스트 약 78개에 영향), jest 30, TS 6이 같은 단계다.

**지금 이미 어긋난 것.**
- tailwind-merge 3(Tailwind 4 전용)을 Tailwind 3과 함께 쓴다.
- `packages/ui`가 react·RN·reanimated를 `dependencies`로 고정한다. 2025-10에 어긋난 원인과 같은 구조다.
- 쓰지 않는 react-native-monorepo-tools·tailwindcss-animate가 있다.

Main은 이 정리를 1.2.0(Ticket 03)에 넣을지, 지금 따로 고칠지 사용자에게 물었다(597행). 아직 답이 없다.

## 확인 범위와 한계

- Main 직접 확인: git `4995f0d5`·`11f9c997`의 변경, 현재 사용처(`MyLocationButton`, babel plugin, `TripSelector`), 설치된 peer 의존성, bundledNativeModules sdk-54·sdk-58 대조, drizzle 0.30.10 `.d.ts`의 `expo-sqlite/next` import, rnmapbox v10.3.0 노트, `tailwind-merge` 사용처.
- 그 밖의 버전·호환 사실은 두 서브의 보고다. 서브가 미확인으로 표시한 것은 [조사 문서](../source/library-compatibility-2026-11-17.md#확인하지-못한-것)에 그대로 남겼다.
- 설치·빌드·실기기 확인은 하지 않았다.
