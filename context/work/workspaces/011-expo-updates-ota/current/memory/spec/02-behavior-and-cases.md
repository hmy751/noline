# 동작과 구별해야 할 사례

## 기기에서의 동작으로 정한 방향

```
[개발자]  eas update --channel <채널>
            → JS 번들을 만들어 Expo 서버에 올림 (runtime version 표시)

[사용자 앱 실행]
  ① 기기에 저장된 번들로 바로 시작 (내장 번들 또는 이미 받아 둔 업데이트)
  ② 뒤에서 같은 runtime·채널의 새 업데이트 확인
  ③ 있으면 내려받아 저장만 함
  ④ 다음 실행 때 새 번들로 시작
```

①에서 기다리지 않는 것(`fallbackToCacheTimeout: 0`)은 필수 조건이다. 앱을 열 때 업데이트 확인을 기다리면 네트워크가 나쁜 곳에서 시작이 늦어진다. 그 대가로 사용자가 수정을 보려면 보통 앱을 두 번 실행해야 한다. 급한 수정에 쓰는 앱 안 안내와 `Updates.reloadAsync()`는 이번 범위 밖의 후보다.

## OTA로 내도 되는지 구별해야 할 변경

| 변경 | OTA 가능 | 이유 |
| --- | --- | --- |
| 화면·스타일·문구·JS 로직 버그 수정 (예: 1.1.3의 Pressable·Drawer) | 가능 | JS 번들 안에서 끝나고 기존 네이티브·DB·서버 계약을 그대로 쓴다 |
| 네이티브 모듈 추가·업그레이드, 권한, 아이콘, `app.config.js`의 네이티브 설정, 최소 iOS 버전 | 불가 | 네이티브 층이 바뀐다. fingerprint runtime이면 자동으로 다른 runtime이 되어 기존 빌드는 받지 않는다 |
| 기기 SQLite 구조 변경 (`src/shared/db/migrations/*`, `src/shared/db/index.ts`의 실행 목록) | 불가(확정) | 앱 시작 때 바로 적용되며, 업데이트를 롤백해도 이미 바뀐 기기 DB는 되돌아가지 않는다 |
| 서버와 함께 바뀌어야 하는 동기화·API 계약 (`packages/schema` 변경 포함) | 서버 배포 확인 뒤에만(확정) | 앱만 먼저 바뀌면 옛 서버와 어긋난다. `field_edits`처럼 DB → 서버 → 앱 순서가 필요한 변경이 예다 |
| `EXPO_PUBLIC_*` 값 | production 값일 때만 | 번들을 만드는 순간 코드에 박힌다. `eas update`는 실행한 컴퓨터의 환경으로 번들을 만들기 때문에 로컬 `.env`의 개발값이 섞일 수 있다. 2026-11-17에 발행은 `--environment`로 EAS 환경값을 쓰게 정했다. preview 발행 번들에는 preview EAS 환경값이 들어가고 로컬 `.env.development`의 API 주소는 없었다. production 번들은 아직 보지 않았다([완료 판단](04-quality-and-completion.md)의 5) |
| 빌드와 다른 환경값으로 하는 발행 | 막아야 함 | fingerprint runtime이 환경값에 따라 달라진다. 업데이트가 아무 기기에도 가지 않고 오류도 나지 않는다([개념](03-concepts-and-contracts.md#runtime-version)) |

이 두 행은 처음에 "규칙 후보"였다. 2026-11-17 Main이 방지 장치를 구현하며 동작으로 옮겼다. 사용자는 규칙을 그대로 두되 다른 context와 연결해 정하자고 했다. 그래서 [Ticket 03](../tickets/03-project-context-reflection.md#규칙의-확정)에서 Project 계약과 연결해 확정했다. 서버 계약은 API 계약의 "DB 구조 → 서버 → 새 앱" 순서와 연결했고, DB 구조는 저장·동기화 기준과 연결했다. 지금 기준은 [앱 변경을 사용자에게 내보낼 때의 기준](../../../../../../project/guidance/app-release-and-ota.md#ota로-내도-되는-변경을-구별한다)이 소유하고, 실제 값은 `apps/client/scripts/ota/rules.mjs`가 소유한다. 사용자가 항목별로 따로 승인하지는 않았다.
