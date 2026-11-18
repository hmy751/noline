# 2026-11-17 — Ticket 검토에서 드러난 것의 처리

원문 줄 번호는 Main 대화 `cf346e87-7dfb-4441-ae53-cf37d3cefece`(JSONL 로그) 기준이다.

Main은 작성된 Ticket 01–05를 읽고 두 가지를 보고했다(850행). 1.2.0을 내면 1.1.x 사용자에게 OTA를 보낼 수 없다는 것, 그리고 `npx expo install`이 이 저장소에서 실패한 적이 있다는 것이다. Main은 앞의 것은 제한을 그대로 받아들이자고, 뒤의 것은 Ticket 01로 옮기자고 추천했다. 사용자는 "그럼 검토하면서 드러난건 어떻게 처리할거야?"라고 물었다(855행).

## 1.2.0 뒤 1.1.x OTA: 기존 Project 정책으로 해소

발행 스크립트는 채널의 최신 빌드와 runtime이 같을 때만 발행한다. 그래서 production 채널에 1.2.0 빌드가 생기면 `release/1.1`에서 발행해도 거부된다. Main이 Project [출시 기준](../../../../project/guidance/app-release-and-ota.md#runtime이-같은-빌드에만-ota가-간다)을 다시 읽어 보니(861–862행), 이 경우의 운영 정책이 이미 정해져 있었다.

> "지금은 이전 버전 사용자에게만 OTA를 보내는 경로가 없고, 그 사용자에게는 스토어 업데이트로 고친다."

012는 이 정책을 따른다. `release/1.1`의 OTA는 1.2.0 빌드가 생기기 전까지만 유효하다. 그 뒤 1.1.x 핫픽스는 스토어 빌드로만 내고, 1.2.0 사용자의 핫픽스는 `release/1.2`의 OTA로 낸다. 이전 버전에 OTA를 보내는 경로가 필요해지면 발행 대상 빌드를 지정하도록 스크립트를 넓히는 일이고, 그 정책 변경은 Project 쪽 판단이다. 앞선 Ticket 01은 이것을 "04 출시 전까지 정할 미배정 판단"으로 적었는데, 새로 정할 일이 아니었으므로 고쳤다.

## `npx expo install` 실패: Ticket 01로 옮김

011에서 `apps/client`의 `npx expo install`이 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패했다. Main은 읽기 전용으로 원인을 찾아봤다(861–875행). 루트와 `apps/client` 모두 `pnpm config get public-hoist-pattern`이 `*`, node-linker가 `hoisted`였고, `node_modules/.modules.yaml`의 hoist 설정도 `*`였다. 설정 차이로는 설명되지 않아 원인은 아직 모른다.

설치 절차를 준비하는 일이라 03이 아니라 01에서 다룬다. 버리는 브랜치에서 재현해 고치거나, 못 고치면 대체 절차를 확정한다. Main이 제안한 대체 절차(사용자 확인 전)는 다음과 같다. `npx expo install --check`로 Expo가 고른 버전을 얻고, 루트에서 `pnpm --filter @apps/client add <패키지>@<그 버전>`으로 넣은 뒤, 단계 끝에 `--check` 통과를 확인한다. 공통 규칙 3의 의도인 "Expo가 고른 버전만 넣는다"는 이 절차로도 지켜진다.

## 함께 발견한 것: 로컬 도구가 Node 20 폴더에 있음

같은 조사에서 Main은 `which -a pnpm`이 `~/.nvm/versions/node/v20.18.1/bin/pnpm` 하나(9.6.0)만 낸다는 것을 확인했다(875행). 셸은 Node v24.16.0인데 PATH 덕에 v20 폴더의 pnpm과 eas-cli를 쓰고 있다. `.nvmrc`를 24로 바꾸고 `nvm use`를 하면 둘이 빠질 수 있다. 그래서 Ticket 01의 Node 24 전환에 pnpm 9.6.0(corepack 또는 전역 설치)과 eas-cli 준비, `START_GUIDE.md` 안내를 넣었다.
