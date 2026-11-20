# 2026-11-19–20 — 기록 커밋, 제어 서버 종료, Ticket 04 main 병합과 push

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이며, 사용자의 "012만 커밋"(7765행)부터 Main이 병합·push를 마치고 재배포 확인과 기록 반영을 맡겼다고 알린 메시지(8003행)까지다. 7780행 근처에는 대화 맥락 압축 요약이 끼어 있어 원문 순서와 시각이 어긋나 보이지만, 사건은 아래 순서로 일어났다.

## 기록 커밋과 제어 서버 종료 (2026-11-19)

이전 기록 반영 뒤 Main이 "Work 012 기록 변경만 커밋할까요?"라고 묻자 사용자가 "012만 커밋"을 골랐다(7765행). Main은 이 Work의 기록 파일 6개(Ticket 04, state, recover, README, records 색인, 새 record)만 stage해 `074ff167`로 커밋했고, 같은 트리의 personal experience 4개와 Work 006 2개는 넣지 않았다(7833–7834행). push는 하지 않았다.

이어 사용자가 "제어 서버 꺼줘 그다음 작업뭐 남은거지?"(7852행)라고 했다. Main은 iPad DeviceKit 제어 서버(이 세션의 백그라운드 작업 `xcodebuild test-without-building … build-ipad …`)를 멈췄다(7871–7872행). 다시 조작하려면 USB를 연결하고 서버를 다시 띄워야 한다.

## 남은 일 설명

Main은 남은 일을 지금 할 수 있는 것과 기다려야 하는 것으로 나눠 답했다(7894행). 이 답의 구분이 지금 [현재 상태](../current/state/index.md)의 다음 행동 구성의 바탕이다.
- **지금 할 수 있는 것:** `feat/012-newarch` 병합(병합 뒤 push는 Render 재배포지만 client만 바뀌어 서버 동작은 그대로일 것으로 봄, 병합 뒤 브랜치 2개와 worktree 2개 정리 가능), 실기기 미확인 중 할 수 있는 것(`OfflineMapView`, 첫 일정에 좌표가 없는 날, iPhone 덮어 설치, Android), Ticket 01의 남은 일(심사 결과, 운영 앱으로 할 점검표 6항목, 이번 iPad 확인을 점검표로 칠지 미정).
- **기다려야 하는 것:** 1.2.0 스토어 빌드·제출·OTA(멤버십 2026-12-18, 인증서 2026-12-30 갱신 뒤, Apple 로그인과 EAS 빌드 실기기 설치도 이때), Ticket 05(04 출시 뒤).
- **결정이 남은 작은 것:** 1.1.4 `offline_cities` 0행의 원인과 소관, ESLint 9 기본값.
- Main은 state의 "아직 하지 않은 것"에 남은 "SDK 업그레이드 구현·빌드·검증 전부"가 03·04로 이미 지났다고 짚고 병합 기록 때 정리하겠다고 했다. 이번 갱신에서 그 항목을 04의 남은 실기기 확인, 1.2.0 출시와 05, 브랜치·worktree 정리 후보로 나눠 바꿨다.

## 병합과 push (2026-11-20)

Main이 "`feat/012-newarch`를 지금 main에 병합할까요?"라고 묻고 "병합하고 push"와 "병합만 (push 보류)"를 제시했다(7891행). 사용자는 다음 날 "병합하고 push"를 골랐다(7903행, 2026-11-20 06:45Z).

**병합 전 대조(7916–7917행).** main..`feat/012-newarch`는 코드 커밋 네 개(`6c6b5524`, `beee6373`, `fb73bb25`, `c5fdbbdc`), 반대쪽은 Work 기록 커밋 세 개뿐이었다. origin보다 main이 앞선 커밋도 기록 문서 네 개(`307ae37b`, `6658ee45`, `faab0efc`, `074ff167`)였다. worktree `.claude/worktrees/012-newarch`에 미커밋 변경은 없었다.

**병합(7931–7932행).** main에서 `git merge --no-ff feat/012-newarch`로 머지 커밋 `6d34c44b`를 만들었다. 바뀐 파일은 client 설정·지도 코드·테스트, `packages/ui/package.json`, `pnpm-lock.yaml` 등 14개다.

**검사를 다시 돌리지 않은 이유.** Main은 병합 직후 `git diff --stat c5fdbbdc HEAD -- apps packages pnpm-lock.yaml package.json pnpm-workspace.yaml`이 비어 있음을 확인했다. 병합 뒤 main의 코드·의존성이 Jest·typecheck·lint와 iPad 실기기를 거친 `c5fdbbdc`와 같으므로, 병합 뒤 검사 재실행을 이 대조로 대신했다. 기록 담당자도 같은 diff가 비어 있음을 다시 확인했다. 원래 계획한 단계("main에 병합하고 검사 실행", 7914행)에서 검사 부분을 이 대조로 바꾼 것이다.

**서버에 닿는지(7944–7975행).** main push는 Render 자동 배포를 일으키므로 Main은 lockfile 변경이 서버에 닿는지 봤다. 바뀐 hunk의 위치를 lockfile의 importer 구역(`apps/client` 21행, `apps/server` 226행, `packages/ui` 354행 등)과 대조해, 바뀐 것은 `apps/client`·`packages/ui` importer와 그 패키지 항목뿐이고 `apps/server` importer는 그대로라고 판단했다. Main은 "lockfile에서 바뀐 부분은 `apps/client`와 `packages/ui`뿐이고 `apps/server`는 그대로입니다"라고 알린 뒤 push했다.

**push와 health(7978–7989행).** `git push origin main`으로 `195b62ee..6d34c44b`가 올라갔다. push 직후 `https://noline-d6hy.onrender.com/api/health`가 200이었는데, 이는 재배포가 반영되기 전의 기존 배포 응답이다. Main은 재배포 동안 20초 간격으로 8분간 health를 확인하는 작업을 백그라운드로 띄웠다. 결과는 원문 끝 이후 Main이 기록 담당자에게 메시지로 전달했다. 15:46:37–15:54:26 KST에 24번 모두 200(0.23–0.61초)이었고 끊긴 구간은 없었으며, 15:54:51에 본문 `{"status":"ok","message":"Server is running"}`를 받았다. health 응답에는 커밋·버전 정보가 없고 Render 대시보드와 GitHub deployment 상태(gh 미인증)는 보지 못해, 이 근거로는 `6d34c44b` 배포가 실제로 Live가 됐는지 확정할 수 없다. 서버 코드와 lockfile의 `apps/server` importer가 바뀌지 않았으므로 Main은 배포 여부와 무관하게 서버 동작은 같다고 봤다.

## main push와 OTA의 관계

main push는 Render 서버 재배포일 뿐 OTA 발행이 아니다. OTA는 `pnpm ota:publish`로만 나가며 이번에 실행하지 않았다. 운영 앱 1.1.4에는 아무것도 가지 않았다.

다만 바이너리 runtime이 바뀌는 변경이 main에 들어갔으므로, 다음 OTA 발행에 미치는 영향을 기록 담당자가 Project [출시 기준](../../../../project/guidance/app-release-and-ota.md#runtime이-같은-빌드에만-ota가-간다)과 기존 기록에 비춰 읽었다. runtime은 `fingerprint`(네이티브 의존성·config plugin·`app.config.js`·scripts·앱 버전과 빌드 번호)로 정해지고, 발행 스크립트는 채널의 최신 빌드와 runtime이 같을 때만 발행한다. main은 앱 버전·빌드 번호가 여전히 1.1.4/18이지만 `newArchEnabled`, reanimated 4, rnmapbox 10.3이 들어가 네이티브 층이 다르다.
- **production:** 최신 빌드는 SDK 51 1.1.4(`7033c2ba`)라 main에서의 발행은 runtime 대조에서 거부된다. 잘못된 번들이 사용자에게 갈 위험은 스크립트가 막지만, 1.1.4 사용자에게 OTA·핫픽스를 낼 때 main을 쓸 수 없다는 뜻이다. 그 경로는 `release/1.1`이며, 03의 SDK 54 병합(`ae97809e`) 때부터 이미 그랬다.
- **preview:** 최신 빌드는 03의 SDK 54 Legacy `f8e97f99`(runtime `20567121…`)다. New Architecture가 들어간 main과는 runtime이 달라, main에서 preview OTA를 시험하려면 main에서 EAS preview 빌드를 새로 만들어야 한다. 04의 iPad용 preview는 `eas build --local`이라 EAS 채널 최신 빌드로 잡히는지 확인하지 않았다.
- 이 판단은 문서 기준에서 읽은 것이며 `pnpm ota:publish --dry-run`으로 확인하지 않았다.

Project 출시 기준의 "지금은 SDK 51이라 `eas fingerprint:compare`를 쓸 수 없다"는 03 병합 뒤로 사실과 다르다. 이 Work에서 고치지 않고 반영 필요로 Main에게 넘겼다.
