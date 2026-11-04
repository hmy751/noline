# 008 — 앱의 예외 안내를 상황별 규칙으로 정리하기

앱이 예외 상황을 사용자에게 알리는 방식을 상황별로 정하고 화면에 맞추는 Workspace다. 지금은 같은 사실을 한 화면에서 여러 겹으로 말하고, 같은 상태가 화면마다 다르게 보이며, 정작 미전송 변경은 로그아웃 전까지 보이지 않는다.

[007 동기화 실패 복구](../007-sync-failure-recovery/README.md)에서 멈춤 표시를 정하다가 시작했다. 사용자가 "예와처리가 너무 많아서 막 제공한다고 좋을것 같진 않아"라고 해서, 표시를 하나 더하기 전에 규칙부터 정하기로 했다.

## 이 작업을 이어받을 때

Project root에서 008 id를 명시해 재진입한다.

```bash
python3 -B -m context.work.harness recover 008-exception-notice-rules
```

Recover는 읽기 전용 재진입이다. 자동 Maintain을 쓰려면 [session binding 계약](../../harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)에 따라 세션을 명시적으로 연결한다. 생성할 때 active 기본값과 세션 연결은 바꾸지 않았다.

1. [현재 상태](current/state/index.md)에서 지금 단계와 사용자 결정을 기다리는 항목을 읽는다.
2. [Spec](current/memory/index.md)에서 목표·현재 안내·계약·완료 기준을 확인한다.
3. [Ticket 색인](current/memory/tickets/index.md)에서 실행할 Ticket을 고른다.
4. 사용자 발화 원문은 [source](source/index.md), 생성 때의 판단은 [생성 기록](records/2026-11-04-01-workspace-creation.md)에 있다.

## 다음 작업에도 보존할 판단

- 규칙을 사용자와 정하기 전에 화면을 고치지 않는다.
- 표시를 늘리는 것을 답으로 삼지 않는다. 안내를 빼거나 합치는 것도 결과다.
- Project 반영을 이 Work의 결과로 두지 않는다. 사용자가 "project는 확실한게 아닌데 왜 넣으려고 하지?"라고 정정했다.

## 007과의 관계

- **이어받은 것:** 안내 현황과 사용자 판단. 현재 의미는 이 Workspace의 Spec에 직접 적었고, 상세 근거만 007 기록을 가리킨다.
- **이어받지 않은 것:** 복원 실패의 원인인 원본 없는 큐 작업(007 Ticket 08), 운영 서버 기록과 횟수(007 Ticket 06), 충돌 규칙(007 Ticket 07), 동기화 큐 자체. 여기서는 그 결과를 사용자에게 어떻게 보여 줄지만 맡는다.
- **동기화하지 않음:** 007이 바뀌어도 자동으로 따라가지 않는다. 영향이 생기면 그때 원래 기록과 코드를 대조해 여기 current를 고친다.
