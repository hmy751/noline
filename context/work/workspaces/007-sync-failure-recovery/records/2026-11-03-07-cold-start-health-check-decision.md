# 2026-11-03 — 서버 기동 지연을 측정 대신 주기 헬스체크로 막기로 함

Ticket 04는 잠든 운영 서버의 첫 응답 시간을 잰 뒤 대응을 고를 계획이었다. 측정 전에 사용자가 방향을 정했다.

## 사용자 결정

Main이 다음 작업으로 Ticket 04를 설명하자 사용자는 이렇게 답했다.

> "일단 이건 신경 써서 한다기보다 다른 걸로 해결해야될것 같아 주기적으로 헬스체크 하게 두긴 햇거든 지금은 확인 못하고"

이어 "Update the docs"로 문서 반영을 요청했다.

## Main이 확인한 것과 판단

- 저장소에는 헬스체크 설정이 없다. `.github/workflows`가 없고, 서버 코드에는 `/api/health` 경로만 있다. 외부 서비스에 둔 것으로 본다.
- 이 대응은 앱 변경이 없다. 그래서 build 13에 더할 앱 쪽 대응이 없고, 다음 작업은 Ticket 05의 서버 배포가 된다.
- 효과는 확인하지 않았다. 확인할 것은 주기가 잠드는 기준(추정 15분)보다 짧은지, 실제 HTTP 경로를 부르는지, Render 무료 사용 시간 한도를 넘지 않는지, 서버가 실제로 잠들지 않는지다. 사용 시간 한도는 Main이 알고 있는 내용이며 Render 문서로 확인하지 않았다.
- 헬스체크가 멈추면 아무 표시 없이 원래 문제로 돌아간다. 그때 다시 고를 대안은 Ticket 04의 표에 남겼다(timeout 연장, 유료 플랜).
- 확인 전에 build 13을 내고 나중에 앱 쪽 대응이 필요해지면, 그 대응은 다음 빌드로 간다.

## 고친 문서

[Ticket 04](../current/memory/tickets/04-server-cold-start-measurement.md), [Ticket 색인](../current/memory/tickets/index.md), [Ticket 05](../current/memory/tickets/05-release-server-and-build-13.md), Spec [01](../current/memory/spec/01-problem-goal-scope.md)·[02](../current/memory/spec/02-behavior-and-cases.md)·[04](../current/memory/spec/04-quality-and-completion.md)·[05](../current/memory/spec/05-constraints-design-assumptions.md), [state](../current/state/index.md).

Project는 고치지 않았다. Project 문서에는 서버 호스팅이나 잠든 서버에 관한 내용이 없고, 이 결정은 제품 계약을 바꾸지 않는다.
