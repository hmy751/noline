# Ticket 03: 출시·OTA 기준을 Project에 반영

2026-11-17 오후 5시 45분경부터 5시 55분경(KST)까지의 기록이다. 이 Work에서 확인한 출시 경로, runtime 조건, OTA 규칙, 발행 절차를 Project context에 반영했다. Project 쪽 편집은 Main이 context-update로 했고, 이 기록은 무엇을 어디에 반영했는지와 그 과정에서 바로잡은 내용을 남긴다. 방지 규칙은 이 반영으로 확정됐다. 앞선 기록에서 이전 버전 OTA에 대해 쓴 말이 틀렸다는 것도 여기서 정정한다.

원문은 [source 색인](../source/index.md)의 두 번째 세션 원문이다. 괄호 안 숫자는 그 파일의 행 번호이며, 이 기록의 범위는 6148–6425행이다. 독립 읽기 확인의 판정은 원문에 도착한 반환(6363)을 기준으로 적었다.

## 그 전에: 기록 커밋 push

1.1.4 제출 기록을 main에 커밋한 뒤, Main은 push하면 Render가 다시 배포할 수 있다며 push 여부를 물었다(6177). 사용자는 "push해"(6182)라고 답했다. main을 `d160c7b5..3fb997d0`으로 push했다(6197).

## 반영

> "Ticket 03 진행하자" (6202)

Main은 context-update를 적용했다. Project의 [관리 계약](../../../../project/MAINTENANCE.md)과 [구성 기준](../../../../project/REFERENCE/composition.md)을 읽었다. 출시를 소유하는 Project 본문은 없었다. 그래서 새 guidance 문서 [앱 변경을 사용자에게 내보낼 때의 기준](../../../../project/guidance/app-release-and-ota.md)을 만들었다. 이 문서가 먼저 답하는 질문은 "변경이 어떻게 사용자에게 가는가"라는 작업 계약이다. 그래서 current가 아니라 guidance에 두었다.

새 가이드의 절은 다음과 같다.
- **runtime이 같은 빌드에만 OTA가 간다:** 두 출시 경로와 runtime에 들어가는 요소다. 요소는 네이티브 의존성·plugin·`patches/`, 환경값으로 달라지는 설정, `apps/client/package.json` scripts, 앱 버전과 빌드 번호다. 여기서 나오는 운영 조건도 함께 적었다.
- **앱 시작은 업데이트 확인을 기다리지 않는다:** Selective Local-First의 오프라인 시작 약속과 연결했다.
- **OTA로 내도 되는 변경을 구별한다:** 규칙 표를 채택된 규칙으로 적었다. 규칙의 실제 값은 `rules.mjs`가 소유한다. 거부 쪽으로 틀리게 만든 이유와 다시 볼 신호도 넣었다. DB 규칙은 출시 경로의 규칙으로 둔다. 기기 migration 작성법을 소유하는 Project 본문은 아직 없다.
- **계약을 바꾸면 서버를 먼저 배포한다(새 절):** API 계약에 있던 "DB 구조 → 서버 → 새 앱" 순서를 일반 규칙으로 정리했다. 서버는 옛 형식과 새 형식을 모두 받아야 한다. 배포는 main push와 Render autoDeploy로 이뤄진다. Render에서 Live를 확인한 뒤 `--server-checked`를 붙인다.
- **OTA는 발행 스크립트로만 낸다:** 단계, Sentry 토큰, hook, 되돌리기를 적었다. 되돌리기는 두 가지다. 하나는 정상 커밋의 코드에서 `pnpm ota:publish`로 새로 발행하는 것이다(`eas update:republish`는 점검을 거치지 않아 쓰지 않는다). 다른 하나는 `roll-back-to-embedded`다.
- **스토어 빌드는 main에서 버전을 올려 낸다:** 명령을 포함한 단계와 preview 시험 앱을 적었다.
- **현재 범위와 다시 확인할 것:** production OTA, 이전 버전 대상 OTA, Codex hook, Expo 플랜, SDK 업그레이드.

읽기 경로도 연결했다.
- [Project README](../../../../project/README.md)의 읽기 목록과 [guidance 목록](../../../../project/guidance/README.md)
- [API 계약](../../../../project/guidance/api-contracts.md): 편집 표식의 배포 순서 뒤에 한 문장을 넣었다. 그 순서가 스토어와 OTA 모두에 적용된다는 내용이고, 가이드로 연결한다.
- [저장·동기화 기준](../../../../project/guidance/data-lifecycle/INDEX.md): 표에 "기기 DB 구조 변경은 스토어 빌드로만" 행을 넣었다.
- [구조 지도](../../../../project/current/architecture.md): 클라이언트가 1.1.4(18)부터 OTA를 받는다는 것, 제출했고 아직 production OTA는 없다는 것을 적었다.
- `apps/client/CLAUDE.md`의 Start Here 행
- `START_GUIDE.md`의 Sentry 절: OTA 소스맵 토큰이 `apps/client/.env.production`에 있다는 점

## 규칙의 확정

사용자는 앞서 규칙을 "그대로 두자 다른 context와 같이 연결해서 뭔가 정하는게 좋을 것 같아"라고 했다([규칙 유지 기록](2026-11-17-09-keep-rules-and-link-project.md)). Main은 이번 반영에서 서버 계약 규칙을 API 계약의 배포 순서와, DB 규칙을 저장·동기화 기준과 연결했다. 그리고 가이드에 규칙을 채택된 규칙으로 적었다. 그래서 Spec 02의 "(규칙 후보)" 표시를 확정으로 바꾸고 가이드에 연결했다. 사용자가 규칙을 항목별로 따로 승인한 것은 아니다. "다른 context와 연결해 정한다"는 지시를 Main이 수행한 결과다.

## 독립 읽기 확인과 정정

Main은 이 주제를 처음 보는 별도 담당에게 Project README부터 읽고 대표 작업 6개에 답해 보게 했다(6346–6363). 대부분은 문서만으로 답할 수 있었다. 3번은 부분 충족이었다. 서버 배포 방법과 일반 규칙을 다른 파일에서 짜 맞춰야 했다. 4번은 틀렸다. 문서대로 하면 발행 스크립트가 실제로 거부한다.

### 이전 버전 OTA에 대한 정정

Main은 앞서 이렇게 말했다. "1.1.5가 나온 뒤에도 1.1.4(18) 상태 코드에서 발행하면 1.1.4 사용자에게 OTA를 보낼 수 있고, runtime 대조가 실수를 잡는다." 이 말은 [1.1.4 제출 기록](2026-11-17-10-release-1-1-4-submission.md), Ticket 01·03, state에 적혔고 사용자에게도 전달됐다. 지금 스크립트에서는 틀린 말이다(6373).
- `checks.mjs`는 그 채널의 최신 빌드와 runtime이 같은 빌드만 대상으로 삼는다. 로컬 runtime이 예전 빌드와만 같으면 거부한다. 그래서 1.1.5 빌드가 생기면 1.1.4 대상 발행은 막힌다.
- 지금은 이전 버전 사용자에게만 OTA를 보내는 길이 없다. 그 사용자는 스토어 업데이트로 고친다.
- 그 길이 필요해지면 발행 대상 빌드를 지정하도록 스크립트를 넓히는 것이 후보다.

가이드는 이 내용을 적었고 현재 범위에도 넣었다. 10번 기록은 당시 문장 그대로 두고, Work의 current는 이번에 고쳤다.

### 그 밖의 수정

- 1.1.4/18과 같은 preview 빌드가 있어야 preview 시험을 할 수 있다고 적었다.
- 스토어 단계에 runtime 계산 명령과 깨끗한 설치 명령을 넣었다.
- Render 자동 배포에 대한 표현을 누그러뜨렸다. 실제 브랜치는 Render 대시보드 설정에 따른다. 인증서 만료일은 EAS가 보고한 값이라고 출처를 밝혔다.
- dry-run이 스토어 공개가 아니라 EAS의 완료된 빌드에 기대고 있다는 점을 적었다.
- 구조 지도와 DDL의 표현을 다듬었다.
- 토큰 위치의 조건과 START_GUIDE 앵커를 고쳤다.

## 확인

- `pnpm harness:check`: 새 실패가 없다. Work 001–005의 옛 링크만 남았다.
- 읽기 확인 담당: 링크와 앵커가 모두 풀린다. Project 문서에 비밀값이 없다.
- **production dry-run 통과(6401–6408):**
  - 최신 빌드는 `7033c2ba…`(1.1.4/18)다.
  - 변경 검사는 `d160c7b5` 기준으로 통과했다.
  - env는 `APP_VARIANT=production`으로 통과했다.
  - 로컬 runtime `0367b72f…`가 빌드와 같다.
  - `--skip-install --allow-dirty`로 실행했다. `apps/client` 아래에 커밋하지 않은 문서(`CLAUDE.md`)가 있었기 때문이다. 발행은 하지 않았다.

## 반영하지 않은 것

- 서버의 Google iOS client 목록 설정은 [서버 README](../../../../../apps/server/README.md)에 두고, 가이드의 preview 시험 앱 항목에서만 언급했다. 별도 API·인증 본문은 만들지 않았다.
- 이 반영을 위한 decisions 문서는 만들지 않았다. 형성 이유는 이 Work의 records가 맡는다.
- 기기 migration 작성법을 소유할 Project 본문은 만들지 않았다. 가이드에 그 공백을 밝혀 두었다.

## 이 기록으로 고친 current

Ticket 03(완료), Ticket 02(production dry-run), Ticket 01과 state의 이전 버전 OTA 문장, Spec 02의 규칙 표시, Spec 03·04의 되돌리기 문구와 04의 항목 8, state, recover, README, 색인, workspaces 목록의 011 줄
