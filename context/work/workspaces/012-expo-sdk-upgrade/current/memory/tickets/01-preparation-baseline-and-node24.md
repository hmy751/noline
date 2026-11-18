# 01 — 준비: 검사 기준선, 실기기 점검표, `release/1.1`, Node 24

**상태:** 시작 전 (2026-11-17 확정). 바로 실행할 Ticket이다. 일정은 11월(02와 같은 달)이다.

## 맡은 결과와 범위

업그레이드를 시작하기 전에 "깨졌는지 알아챌 수 있고, 깨져도 1.1.x 사용자를 지킬 수 있는" 상태를 만든다. 그리고 SDK와 무관한 Node 전환을 먼저 끝낸다. 이 Ticket이 끝나면 다음이 달라진다.

1. **비교 기준이 생긴다.** 지금(SDK 51, 1.1.4) 검사 결과와 실기기 동작이 기록돼, 이후 단계에서 실패가 업그레이드 때문인지 원래 있던 것인지 가를 수 있다.
2. **매 단계 같은 실기기 확인을 할 수 있다.** 점검표가 정해지고 1.1.4에서 한 번 실행한 결과가 있다.
3. **핫픽스 경로가 분리된다.** `release/1.1`에서 1.1.x 핫픽스 빌드와 OTA를 낼 수 있음을 확인했으므로, main은 업그레이드에 쓸 수 있다. `release/1.1`은 1.2.0이 출시되기 전까지 쓰는 브랜치다.
4. **서버와 로컬이 지원 중인 Node 24로 돈다.** 운영 서버가 Node 24로 배포돼 앱의 API·동기화가 동작한다. 로컬에서 Node 24로 바꿔도 pnpm 9.6.0과 eas-cli를 그대로 쓸 수 있다.
5. **Expo가 고른 버전으로 패키지를 넣는 절차가 정해진다.** `npx expo install`이 이 저장소에서 동작하거나, 같은 버전을 넣는 대체 절차가 확정돼 03부터 공통 규칙 3을 지킬 수 있다.

Spec과의 연결: [완료 판단](../spec/04-quality-and-completion.md)의 8(기존 검사 기준선), 10(Node 정합 중 서버·로컬 부분)을 맡는다. 오프라인 약속(4)의 점검표를 만든다. EAS 빌드의 Node(`eas.json` `base.node`)는 SDK 51 핫픽스 빌드를 지키려고 **03에서** 바꾼다. 서버 라이브러리(Express 5, drizzle 최신, zod 4)와 PostgreSQL은 012 범위 밖이다([범위](../spec/01-problem-goal-scope.md)).

출시: 서버 배포만 한다. 앱 스토어 심사는 없다.

## 실행 맥락과 접근

**선행:** 없음. 1.1.4(빌드 18) 심사 결과는 01을 막지 않지만, `release/1.1`의 기준 커밋을 정할 때 확인한다.

**순서: `release/1.1`을 가장 먼저 만든다.** 1.1.4에 OTA를 보내거나 반려 뒤 다시 제출하려면 1.1.4와 같은 상태의 코드가 필요하다. 그래서 `release/1.1`을 만들기 전에는 012의 어떤 변경도 main에 병합하지 않는다. 이미 제출·승인된 스토어 빌드는 업로드한 바이너리라 브랜치나 worktree 분리의 영향을 받지 않는다. 버전과 빌드 번호는 `app.config.js`에서 브랜치마다 따로 올리며, `release/1.1`은 1.1.x, main은 1.2.0으로 구분한다(Main 판단, 2026-11-18).

**1. 검사 기준선.** 각 경로 가이드의 명령을 그대로 실행하고 통과·실패 수와 실패 이름을 남긴다. 실패가 있어도 지금 고치지 않고 기준선으로 기록한다.
- client: `pnpm client lint`, `pnpm client test --runInBand`, `pnpm client test:typecheck`
- server: `pnpm run server typecheck`, `pnpm run server build`, `pnpm run server test`, `pnpm run server test:integration`(docker의 postgres 필요)
- schema: `pnpm schema build`(test·typecheck script는 없다)
- ui: `pnpm --filter @repo/ui lint`(이 패키지에는 lint만 있다)
- 함께 남길 것: `npx expo install --check`의 현재 출력(SDK 51 기준 어긋남 목록). 03 이후의 `--check`와 비교한다.

**2. 실기기 점검표.** 매 단계 같은 항목을 같은 순서로 본다. 확정 구성의 공통 규칙에서 정한 항목이다.

| 항목 | 확인할 것 |
| --- | --- |
| 오프라인 시작 | 비행기 모드에서 앱이 바로 열린다 |
| 활성 여행 조회·변경 | 비행기 모드에서 활성 여행의 일정·경비를 보고, 하나를 추가·수정한다 |
| 동기화 | 네트워크를 켜면 위에서 바꾼 것이 서버에 반영된다 |
| 로그인 | Google·Apple 로그인과 로그인 유지 |
| 오프라인 지도 | 받아 둔 도시 지도가 비행기 모드에서 그려진다 |
| 경로 표시 | 저장된 경로가 지도에 표시된다 |

실행 기기는 iPhone 14 Pro 실기기 1대(iOS 27.2.1로 해석)다. 운영 앱(1.1.4)에서 실행할지 preview 앱에서 실행할지 정해 결과에 적는다. preview 앱의 Apple 로그인은 서버의 `APPLE_CLIENT_ID`가 운영 번들이라 실패할 수 있다(011에서 알려진 제한, 미확인). 이 점검은 1.1.4(SDK 51 빌드)가 iOS 27에서 동작하는지에 대한 실기기 근거도 된다([개념과 계약](../spec/03-concepts-and-contracts.md)의 가정).

**3. `release/1.1`.** 1.1.4로 출시한 코드에서 브랜치를 만든다. 기준 커밋은 1.1.4 버전 커밋 `d160c7b5`가 후보이며, 실제로 빌드에 쓴 커밋인지 확인하고 정한다. 그 브랜치에서 다음을 확인한다.
- **핫픽스 빌드:** production 프로필로 빌드가 만들어지는지. 스토어 제출까지 할 필요는 없다.
- **OTA:** `pnpm ota:publish`로 preview 채널에 발행해 기기가 받는지. 발행 스크립트는 채널의 **최신 빌드와 runtime이 같을 때만** 발행한다. 그래서 `release/1.1`의 OTA는 production 채널에 1.2.0 빌드가 생기기 전까지만 유효하다.
  - **1.2.0이 승인·출시된 뒤에는 1.1.x 스토어 빌드도 낼 수 없다.** App Store는 새로 제출하는 버전 번호가 이미 승인된 버전보다 높아야 한다(Main의 지식, 이번 대화에서 Apple 문서로 다시 확인하지 않음). 그래서 1.2.0 뒤 1.1.x 사용자를 고치는 길은 1.2.x로 업데이트하게 하는 것뿐이고, 1.2.0 사용자의 핫픽스는 `release/1.2`에서 낸다. `release/1.1`의 쓰임새는 1.2.0 출시 전까지의 1.1.4 심사 반려 시 재제출, 1.1.5 핫픽스, 1.1.4 runtime으로의 OTA다. 2026-11-17에 "1.2.0 뒤 1.1.x는 스토어 빌드로만"이라고 적었던 것은 틀렸다([정정 기록](../../../records/2026-11-18-01-release-branch-correction-and-worktree.md)).
  - 이것은 012가 새로 정할 판단이 아니다. Project [출시 기준](../../../../../../project/guidance/app-release-and-ota.md#runtime이-같은-빌드에만-ota가-간다)이 이미 "이전 버전 사용자에게만 OTA를 보내는 경로가 없고, 그 사용자에게는 스토어 업데이트로 고친다"는 운영 정책을 정해 두었고 012는 이를 따른다. 이전 버전 사용자에게 OTA를 보내야 할 필요가 생기면 발행 대상 빌드를 지정하도록 스크립트를 넓히는 일이며, 그 정책 변경은 Project 쪽 판단이다.

**4. Node 24.** 로컬은 이미 v24.16.0으로 돌고 있다. 바꿀 곳은 [전수 조사](../../../records/2026-11-17-01-version-inventory-and-server-scope.md)와 [버전 표](../spec/05-constraints-design-assumptions.md#node와-도구-앱서버-공통)에 있다.
- `.nvmrc` 20.18.1 → 24.x, `render.yaml` `NODE_VERSION` 20 → 24
- `@types/node` ^20 → ^24(root·server·ui)
- `nixpacks.toml`(Railway): 지금 쓰는지 확인하고, 안 쓰면 지우고 쓰면 `nodejs_24`로
- `START_GUIDE.md`의 "Node.js 20" 안내. 아래 pnpm·eas-cli 준비 방법도 함께 적는다.
- `engines`는 03에서 넣는다(확정 구성의 배치).
- **pnpm·eas-cli 준비.** 2026-11-17 Main 확인으로, pnpm 9.6.0은 nvm의 Node v20.18.1 폴더에만 설치돼 있다(`which -a pnpm` → `~/.nvm/versions/node/v20.18.1/bin/pnpm` 하나). 지금 셸은 Node v24.16.0인데 PATH 덕에 v20 폴더의 pnpm과 eas-cli 16.28.0을 쓰고 있다. `.nvmrc`를 24로 바꾸고 `nvm use`를 하면 둘이 PATH에서 빠질 수 있다. 그래서 Node 24 쪽에 pnpm 9.6.0(corepack 또는 전역 설치)과 eas-cli를 준비하고, 그 방법을 `START_GUIDE.md`에 적는다. 어느 방식으로 할지는 실행하며 정한다.

Render는 루트에서 `pnpm install`을 실행해 client 의존성까지 Node 24로 설치한다. 지금은 SDK 51 의존성이라 문제를 예상하지 않지만 배포 로그로 확인한다. drizzle-kit 0.20 등 오래된 서버 도구의 Node 24 동작은 미확인이다.

**운영 서버 배포 주의.** Node 24 서버 배포는 1.1.4 사용자가 지금 쓰는 운영 서버에 바로 적용된다. worktree와 상관없이 실제 사용자에게 닿는 유일한 변경이다. Render는 main에 push하면 자동 배포되므로(`render.yaml`의 `autoDeploy: true`) 병합·push는 사용자 확인 뒤에 한다. 배포 전에 Render에서 이전 배포로 되돌리는 방법을 확인하고, 배포 뒤 운영 앱으로 확인한다(Main 판단).

**5. `npx expo install` 실패의 원인 찾기 또는 대체 절차.** 011에서 `apps/client`의 `npx expo install`이 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패해 루트의 `pnpm --filter @apps/client add`로 설치했다([011 Ticket 01](../../../../011-expo-updates-ota/current/memory/tickets/01-expo-updates-and-ios15-build.md)). 2026-11-17 Main이 읽기 전용으로 본 바로는 루트와 `apps/client` 모두 `pnpm config get public-hoist-pattern`이 `*`, node-linker가 `hoisted`로 같고, `node_modules/.modules.yaml`의 hoist 설정도 `*`다. 설정 차이로는 설명되지 않아 원인은 미확인이다.
- 버리는 브랜치에서 재현해 원인을 찾고 고친다.
- 못 고치면 대체 절차를 확정한다. Main 제안(확인 전): `npx expo install --check`로 Expo가 고른 버전을 얻고, 저장소 루트에서 `pnpm --filter @apps/client add <패키지>@<그 버전>`으로 설치한 뒤, 단계 끝에 `npx expo install --check` 통과를 확인한다. 공통 규칙 3의 의도인 "Expo가 고른 버전만 넣는다"는 이 절차로도 지켜진다.

**실행하며 정할 것:** 점검표를 운영 앱에서 돌릴지 preview에서 돌릴지, `release/1.1`의 정확한 기준 커밋, nixpacks 삭제 여부, pnpm·eas-cli 준비 방식, `expo install` 원인 수정 또는 대체 절차.

## 완료 조건과 확인 방법

- 4개 패키지의 검사 결과(명령, 통과·실패 수, 실패 이름)와 `expo install --check` 출력이 이 Ticket 또는 record에 남아 있다.
- 점검표 6항목을 1.1.4에서 실행한 결과(기기, iOS 버전, 앱 종류, 항목별 결과)가 남아 있다.
- `release/1.1`이 원격에 있고, 그 브랜치에서 만든 빌드 ID와 preview 채널 OTA 수신 결과가 남아 있다. `release/1.1`은 1.2.0 출시 전까지만 쓰며, 그 뒤 1.1.x 사용자는 1.2.x로 업데이트해야 고칠 수 있다는 운영 조건이 적혀 있다.
- 서버 검사 네 가지와 schema build가 Node 24에서 기준선과 같거나 더 낫다.
- Render 배포 로그에 Node 24가 쓰였고, 배포 뒤 운영 앱에서 로그인·여행 조회·동기화가 된다. 이전 배포로 되돌리는 방법을 확인해 적었다.
- `.nvmrc`·`render.yaml`이 같은 24를 가리키고 nixpacks가 정리돼 있다. EAS `base.node`는 아직 20.18.1이다(의도).
- `nvm use`로 Node 24를 쓴 새 셸에서 `pnpm -v`가 9.6.0, `eas --version`이 동작하고, 그 준비 방법이 `START_GUIDE.md`에 있다.
- `npx expo install`이 `apps/client`에서 동작하거나, 대체 절차가 확정돼 tickets/index의 공통 규칙 3과 [제약](../spec/05-constraints-design-assumptions.md)에 반영돼 있다.

## 현재 상태와 실제 결과

시작 전. 실제 결과는 진행하며 채운다.
