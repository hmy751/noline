# 문제·목표·범위

## 왜 시작했나

2026-11-16, Work 011(expo-updates)을 재개하던 중 사용자가 물었다.

> "하는김에 앱 버전이랑 이런것도 이번 작업에서 맡을까? 기존에 앱 버전 업그레이드 하려고 했는데 안한게 꽤 있거든"

Main이 과거 기록·현재 의존성·외부 요건을 대조한 결과는 다음과 같다. 상세는 [분석 기록](../../../records/2026-11-16-01-separation-from-011-and-version-analysis.md)에 있다.

- **버전 문제를 그때그때 버텨 왔다.** 2025-10부터 SDK 54용 패키지가 섞여 빌드 실패·크래시가 나면 SDK 51용으로 내렸다(expo-sqlite, expo-asset, Mapbox, react). Xcode가 오를 때는 EAS 이미지를 Xcode 26.2로 고정하고(2026-11-02) Sentry를 SDK 51 기대보다 올렸다(2026-11-09).
- **미룬 결정이 사라졌다.** 2026-11-02 "근본 해법은 Expo SDK를 올리는 것, 이번 배포 뒤 별도 작업으로"라는 추천에 사용자가 동의했지만 어느 Work·Ticket에도 남지 않았다. 이 Work는 그 결정을 이어받는다.
- **마감이 생겼다.** Apple은 2027년 4월부터 iOS 27 SDK로 빌드한 앱만 받는다. iOS 27 SDK로 빌드하면 UIScene 실행 구조가 없는 앱은 켜지지 않는데, SDK 51 / RN 0.74에는 이 구조가 없다.

사용자는 011과 분리하기로 했다.

> "그래 분리해서 진행하자 더 버전에 대해 자세한건 012에서 더 논의한다고 기록해주고"

2026-11-17 012를 다시 열며 사용자가 Node까지 올리고 저장소 전체의 버전 설정을 점검하자고 했고, 서버도 함께 하자고 물었다.

> "노드버전도 올리고 싶어 그리고 전반적 버전 셋팅을 확인하면 좋겠어 그래서 좀 정리해줘 봐 리스트업"

> "서버도 하는게 낫지 않나? 좀 잘 정리해봐 필요한 요소들이랑 현재 이후 랑해서"

조사해 보니 Node는 지원이 끝난 20으로 네 곳에 따로 적혀 있었고, 서버 배포가 client 의존성까지 설치해 앱만 올리면 서버 배포가 깨질 수 있었다. Main이 서버를 Node와 도구까지 넣자고 추천했고 사용자가 "반영하고"라고 답해 범위가 넓어졌다. 이유와 비교는 [전수 조사 기록](../../../records/2026-11-17-01-version-inventory-and-server-scope.md)에 있다.

## 목표

1. 2027년 4월 Apple 요건(iOS 27 SDK 빌드) 아래에서도 새 스토어 빌드를 낼 수 있다.
2. 업그레이드 뒤에도 Noline의 핵심 약속, 즉 네트워크가 없어도 앱이 열리고 기기에 준비한 여행 데이터를 쓸 수 있다는 점이 유지된다.
3. 의존성이 대상 SDK의 기대 버전과 맞는다. 기대에서 벗어나는 버전은 이유를 남긴 것만 둔다.
4. 같은 버전 혼선이 다시 쌓이지 않게 설치·확인 방법을 정한다.
5. 앱 개발·앱 빌드·운영 서버의 Node가 지원 중인 같은 버전으로 맞춰진다.

목표 1의 마감은 Apple이 "2027년 4월"까지만 밝혔다. 정확한 날짜는 미정이다.

## 범위

포함한다.
- Expo SDK와 React Native, React 버전 상향
- 그에 따라 필요한 New Architecture 전환(SDK 55부터 필수)
- 함께 올려야 하는 라이브러리: expo-router, @rnmapbox/maps, react-native-maps, expo-sqlite·drizzle-orm, reanimated·nativewind, Sentry, safe-area-context 등
- 도구: Node(`.nvmrc`, EAS `base.node`), eas-cli, EAS 빌드 이미지
- 서버의 Node와 그에 따른 도구: `render.yaml`의 Node, `nixpacks.toml` 정리, `@types/node`, 서버의 tsx·tsup·vitest·drizzle-kit이 새 Node에서 동작하는지 확인
- 필수 변경을 따라 바뀌는 저장소 설정: root의 react 선언, `packages/ui`·`packages/eslint-config`의 react·RN 선언, TypeScript 선언 통일, `START_GUIDE.md`의 Node 안내
- 최소 iOS를 16.4로 올리는 변경과 그 영향 확인(16.4 수용은 2026-11-17 결정)
- 업그레이드한 스토어 빌드와 심사 제출 2번: 1.2.0 = SDK 54 + New Architecture, 1.3.0 = SDK 58·iOS 27(2026-11-17 채택)
- 업그레이드 중 1.1.x 핫픽스를 낼 `release/1.1` 브랜치 운용
- 버전 혼선 재발 방지

포함하지 않는다.
- expo-updates 도입·OTA 방지 장치: Work 011이 소유한다. 업그레이드 뒤 OTA가 계속 동작하는지 다시 확인하는 일은 이 Work의 완료 판단에 들어간다.
- Android 배포
- 서버 라이브러리(Express 5, drizzle 최신, zod 4)와 PostgreSQL 업그레이드: Apple 마감과 무관하고 각각 깨질 위험이 따로 있어, 함께 묶으면 원인을 가르기 어렵다. 012 밖에서 따로 판단한다. zod는 `@repo/schema`로 client와 공유하므로 올린다면 함께 판단한다.
- 새 기능 추가

ESLint 9 전환과 `engines` 추가처럼 미룰 수 있는 정리를 012에 넣을지는 아직 정하지 않았다.

대상 SDK 58, 최소 iOS 16.4, `release/1.1`은 2026-11-17 사용자가 정했다. SDK 58은 "중간 단계 각각 출시" 선택지가 명시해 함께 정해진 것으로 본다(기록 담당자의 해석). 그 뒤 사용자가 출시 횟수를 줄이라고 했고, 개발 단계(Node 24 → SDK 54 → New Architecture → SDK 58)를 유지한 채 출시만 2번으로 줄인 안에 "그래 좋아"라고 답했다. 목표 Node 24는 승인한 Ticket 표에 들어 있어 채택으로 본다([제약·현재 설계·가정](05-constraints-design-assumptions.md#진행-순서)). 경위는 [Ticket 구성·결정 기록](../../../records/2026-11-17-02-ticket-composition-and-release-decisions.md), [출시 축소 기록](../../../records/2026-11-17-03-release-count-reduction.md), [채택·점검 기록](../../../records/2026-11-17-04-release-plan-adopted-and-library-check.md)에 있다.

그 뒤 라이브러리 점검을 반영해 Ticket을 5개로 다시 짜고 사용자가 "확정·작성 진행"으로 확정했다. SDK는 Expo 권장에 따라 한 버전씩(51→52→53→54, 55→56→57→58) 올린다. 이미 어긋나 있는 tailwind-merge 3, `packages/ui`의 `dependencies` 고정, 쓰지 않는 패키지 정리는 SDK 54 단계(Ticket 03)에 넣었다. Mapbox v11에서 옛 오프라인 지도가 남지 않으면 업데이트 뒤 지도를 다시 받게 하는 대응도 1.2.0 범위에 들어간다(02의 판정에 따라). 경위는 [재구성·지도 대응 기록](../../../records/2026-11-17-05-ticket-restructure-and-map-data-plan.md)에 있다.
