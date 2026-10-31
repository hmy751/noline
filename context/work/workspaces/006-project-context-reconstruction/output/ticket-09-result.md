# Ticket 09 — 제품 기준과 위험 점검 통합 결과

제품 규칙과 위험 점검을 기존 Project 주제 본문에 통합하고 현재 읽기 경로를 전환했다. 제품 동작은 변경하지 않았다. 본문·소비자 담당의 자기 확인, 독립 개선 검토와 별도 요구 검증을 마쳤다. Main은 확인한 문서 통합·현재 소비 경로 범위에서 Ticket 09를 완료로 판단했다.

## 무엇이 달라졌는가

기존 7개 rule과 두 안내 문서의 유효한 조건은 여행 접근, 데이터 수명, schema, 날짜, API 본문에서 찾는다. 규칙·예외·실패 위험과 실제 구현 차이를 한 주제에서 이해하도록 구성했으며, 특히 생성 ID 전 구간 일치와 재전송 한계, 인증과 개별 소유권 검사의 차이, Router·Policy UI 책임을 보강했다. 기존 cleanup·접근 검증 공백은 계약 불충족으로 유지했다.

원문별 목적지·유지·보강·제외 이유와 코드 대조는 [내용 대응](ticket-09-content-map.md)에, guide·agent·checker·live Workspace 전환은 [소비자 결과](ticket-09-consumer-result.md)에 있다. 별도 compact 정책 사본을 남기지 않는 대신 주제 본문을 읽는 비용을 받아들였다. 생성 ID처럼 좁은 질문은 해당 절로 직접 연결한다.

원본 9개는 `.claude/_archive/2026-10-31-project-context-reconstruction/ticket-09/`의 manifest와 함께 보존했다. Main은 원문과 복사본의 바이트 일치 후 현재 원본을 제거했고 이후 SHA-256을 다시 대조했다. 현재 개발 읽기의 필수 경로로 archive를 사용하지 않는다. 책임 전환의 지속 이유는 [통합 결정](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-10-31-product-rules-owner-integration.md.txt)에 있다.

## 제품 라우팅과 개발 수행의 구분

이번 Activation Router는 여행 활성 상태에 따라 Local SQLite와 Server API를 고르는 제품 책임이다. 어떤 스킬·절차로 개발을 진행할지 정하는 수행 흐름과 구별한다.

사용자는 진행 중 “혹시 라우팅 정책이 개발 라우팅은 아니지? 맞다면 스킬도 면밀히 봐야할거야 워크플로를 담으니까 관련 지침이랑”이라고 확인했다. Main은 위 제품 의미를 설명하고, 개발 스킬의 워크플로와 관련 지침은 Ticket 10·11에서 함께 대조할 범위임을 확인했다. 이번 `development` 변경은 제품 입력 경로의 전환이다.

Observer의 ‘스킬은 dispatcher로만 남는다’는 기존 문구는 root·하네스의 기존 계약과 충돌했다. Claude/Codex 양쪽을 스킬이 호출 조건·판단·수행 방법·필요한 워크플로를 소유하고 제품 기준은 Project에서 읽는다는 뜻으로 정정했다. 독립 검토도 기존 계약과의 일치를 확인했다. 스킬 워크플로 자체를 이번에 재설계하거나 검증한 것은 아니다.

## 검토와 확인 범위

독립 개선 검토는 원문·최종 본문·내용 대응표와 대표 ID/auth 코드를 대조했다. 현재 구조 안내에 남은 rules/guards 경쟁 Owner 문장을 찾아 수정했고, 생성 ID 절 직접 연결을 채택했다. 최종 본문·agent에서 추가 필수 수정은 보고되지 않았다. 이는 전체 제품 실행이나 Work 수락의 근거가 아니다.

Main은 원본 9개 보존과 현재 경로 제거, checker 구문, diff whitespace를 확인했다. default001·bound002·006 explicit Recover는 성공했다. 001 Verify evidence와 002 canonical basis는 현재 Owner로 전환했고 기존 claim·실행 명령·과거 receipt는 유지했다. 006 Verify는 JSON parse만 검사하므로 이 통합의 충분성 증거로 사용하지 않는다. 선언 입력 존재 확인에서 001·006은 누락이 없었고, 002에는 이번 변경과 무관한 리팩터링 이전 제품 파일 6개의 누락이 남았다. 002 전체 Verify의 실행·통과를 주장하지 않는다.

전체 harness 검사 결과는 실패다. 변경 전의 역사 링크 47건에 비활성 003의 옛 rule/guard 링크 5건이 더해져 52건이다. 추가 5건은 `003/current/memory/project-context.md`의 Activation Router·Transaction·Schema·Auth·Guard Map 대상이다. 현재 소비자 누락과 역사 기록의 과거 경로를 구별하고 새 예외로 검사를 통과시키지 않았다. 이 결과는 전체 Harness 통과나 006 완료를 뜻하지 않는다.

별도 검증자는 원본 9개와 현재 Owner, 생성 ID·삭제/sync·인증·날짜의 대표 읽기와 코드를 대조해 핵심 요구에 충족 근거가 있고 현재 범위의 수정 필요 결함을 찾지 못했다고 반환했다. 원본 보존, AGENTS bridge 5개, Claude/Codex 세 agent의 의미 일치, 제품 코드 미변경, checker 52건 실패의 구분도 독립 확인했다. 실제 앱·JWT·PostgreSQL·native SQLite 실행은 이번 문서 통합의 확인 범위가 아니다.

10–13은 아직 완료하지 않았으며, 다음 실행은 10의 반복 개발·문서 관리 절차와 현재 스킬의 워크플로·관리 계약 대조다. Maintain이 Ticket 09 완료·Ticket 10의 다음 실행·제품 라우팅과 개발 수행의 구분을 Ticket·state·output 색인에 반영했고, Main이 커밋 준비 중 실제 파일을 확인했다. 이 결과 파일의 작성과 상태 문서 반영을 구별해 확인했다.
