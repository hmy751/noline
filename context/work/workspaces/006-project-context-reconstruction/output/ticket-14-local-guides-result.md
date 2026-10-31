# Ticket 14 — 로컬 프로젝트 가이드 정리 결과

루트와 client·server·schema·UI의 CLAUDE.md를 실제 작업 진입·구현 책임·제품 기준의 관계에 맞게 정리했다. development의 Main 수행, USAGE의 공통 읽기, Project의 제품 계약과 영역별 관리 책임은 기존 Owner에 유지했다. 지침을 줄이거나 별도 관리 계층을 만드는 대신 필요한 요약·경로·공통 규칙을 남기고 중복·충돌과 낡은 사실을 고쳤다.

대상은 [Ticket 14](../current/memory/tickets/14-local-project-guides-and-workflow-boundaries.md)의 로컬 가이드 5개와 실제 영향을 받은 연결·검사 3개다. 기준 판본은 `961de724a92fdf59af5f10f3f7d67e4a9b643552`이다. 전역 지침, development의 수행 계약, Work·Maintain의 관리 계약이나 제품 코드는 바꾸지 않았다. 이번 한정 문안 검증과 [Ticket 13](../current/memory/tickets/13-integrated-verification-and-acceptance.md)의 전체 검증·006 수락은 별개다.

## 로컬 가이드가 맡는 내용

[루트 가이드](../../../../../CLAUDE.md)는 Noline의 정체성·중요 제품 경계, 코드 영역의 관계, 요청별 스킬·Context 접근과 저장소 공통 규칙을 안내한다. 개발 재개·맥락 재선택·역할 배정·완료·기록의 수행 순서를 별도로 정의하지 않는다. 설명만 요청하면 explain, 지정된 Personal·Project 갱신만 요청하면 context-update의 호출 조건과 범위로 들어갈 수 있다.

하위 가이드는 그 코드 경로의 구현 책임과 다른 영역의 관계, 놓치기 쉬운 위험과 실행·검사 명령을 안내한다. 제품의 조건·예외·현재 미충족과 상세 검증 방법은 연결한 Project 본문이 계속 소유한다. 예를 들어 일정 저장 변경은 client 가이드에서 datasource·repository·data hook의 구현 위치를 찾고, 데이터 수명 본문에서 transaction·queue·실패 보존 조건을 확인한다. development는 이 구현·검토·검증을 조율한다.

제품 요약을 모두 링크로 바꾸는 대안은 첫 작업 범위를 정하기 전부터 여러 본문을 조립하게 만든다. 반대로 상세 알고리즘·결함 목록·검증 절차를 가이드에 누적하면 같은 기준을 여러 곳에서 고쳐야 한다. 현재안은 처음 경계를 잡는 데 필요한 설명을 남기고 해당 주제를 변경할 때 필요한 상세로 연결한다. 과거 용어와 자주 쓰는 모든 명령을 루트 한곳에서 보는 장점은 줄지만, 현재 이름·명령의 목적지를 남겨 이동 비용을 제한했다.

## 기존 내용의 처리와 실제 보완

| 내용 | 실제 처리와 이유 |
| --- | --- |
| Start Here·불변식·주제 표·코드 영역·기술 스택 | 요청·Context 진입, 제품 경계와 Owner, 코드 영역으로 합쳤다. 핵심 정책은 조건이 붙은 요약으로 남기고 독립 정본으로 만들지 않았다. 실제 SQLite·Drizzle ORM과 context 위치를 반영했다. |
| 제품 목적·현재 용어 | 목적과 현재 이름을 남기고 과거 명칭·선택 이유는 기존 Project 결정으로 연결했다. 역사 문구를 현재 정책으로 다시 쓰지 않았다. |
| 여행의 Local/Remote 요약 | 대상 여행 단건·변경, 계정 전체 목록, 새 여행 생성의 차이를 Project Router 계약과 실제 TripRepository에 대조해 명시했다. 온라인·인증 제한 시 Local 목록 조건도 남겼다. |
| 수행·관리 지침 | development, USAGE, Project·Work 관리 계약으로 직접 연결했다. 기존의 모든 agent report-only 일반화와 코드 충돌 시 guide만 고치라는 규칙을 제거했다. 새 권한·충돌 해결 규칙을 루트에 만들지 않았다. |
| 공통·경로별 명령 | 루트 공통 lint·harness 검사와 app/package별 실행·DB·빌드·검사를 구별했다. client Jest·타입 검사와 server 일반·PostgreSQL 통합 검사의 조건을 보완했다. 명령 존재를 실행 통과로 보고하지 않았다. |
| client·server 가이드 | 기존 Router·transaction·ID·시간·인증·소유권 위험을 보존했다. 서버 sync push는 현재 501이며 client의 실제 push는 Entity REST route라는 사실을 명시했다. 길이를 기준으로 Project나 archive에 보내던 server 갱신 문장은 내용 역할에 따른 안내로 바꿨다. |
| schema·UI 가이드 | schema의 datetime primitive·응답 envelope·공개 export와 빌드 연결, UI 변경 시 실제 client 소비자 확인을 보완했다. 공유 계약·저장 표현과 primitive·앱 조합의 기존 경계는 유지했다. |
| bridge·checker·현재 소비자 | 5개 AGENTS bridge와 공통 스킬 연결을 확인했다. checker의 가이드 책임 절 제목을 실제 문안에 맞췄다. Project architecture의 스킬 원본 방향을 정정하고 006 최초 조사 지도의 삭제된 README 링크를 원문 식별자와 현재 루트로 전환했다. |

development는 여전히 루트·경로별 지침에서 제품 불변식과 Project 기준을 선택할 수 있다. 스킬 색인과 Context 입구도 같은 책임으로 연결되므로 의미를 바꾸지 않는 형식상 동반 수정은 하지 않았다. 제품 주제의 정본 경로·권위 이동이나 새 공통 workflow는 없다.

## 독립 검토와 Main의 채택

첫 개선 검토는 별도 세션에서 기존 문안·요구·Project·실제 소스를 대조했다. 큰 구성을 유지하는 편이 적절하다는 판단과 server sync push 안내 보완 의견을 받았다. Main은 실제 501 응답과 Entity REST 전송을 확인해 그 사실을 반영했다.

사용자는 이어 “마지막 한번더 검토 시켜봐 잘 된건지 부족하면 더 어떻게 해야하는지 단 모델을 아스트라로 하고 추론은 엑스트라 하이로”라고 요청했다. Astra·Extra High의 새 독립 검토자는 기존·현재 가이드, development 상세·형성 맥락, Context·Project·대표 코드와 명령을 대조해 큰 재구성이나 필수 수정의 근거를 찾지 못했다. 루트의 “해당 스킬”을 explain/context-update로 명시하자는 국소 보완을 Main이 채택했고 검토자가 최신 문구와 판본 일치를 후속 확인했다.

사용자는 다시 “그것만 한 번더 물어봐봐 지역 CLAUDE.md에 대한 내용 구성이나 역할 책임”을 요청했다. 같은 Astra·Extra High 검토자가 기존 판단을 재사용하되 로컬 가이드의 책임 배치 자체를 별도로 검토했다. 루트·하위 가이드의 큰 역할과 제품 요약 유지가 타당하다는 판단에 더해 다음 두 개선을 추천했다.

- 하위 Ownership 표의 “다른 owner로 보낼 것”은 다른 코드 영역의 구현과 준수할 문서 계약을 혼용한다. Main은 네 표를 “코드 영역 / 이 경로의 구현 책임 / 관련 계약·다른 코드 영역”으로 바꾸고 client model·Local datasource·repository의 대표 행을 구체화했다. 구현을 Project 문서로 넘기는 것으로 읽히지 않게 했다.
- “정책을 복사하지 않는다”는 선언과 유효한 위험 요약의 관계가 불명확하다. Main은 요약의 지위를 밝히고 상세 계약·조건·예외·검증 방법은 연결한 Project 본문이 소유한다고 정리했다. UI도 구현은 client, 제품·조합 기준은 Project로 구별했다.

두 의견은 제품 계약 위반이라는 필수 수정 판정은 아니었다. Main은 이번 Ticket의 역할 명료화 목표에 직접 맞고 새 계층·관리 부담 없이 개선할 수 있어 채택했다. 기존 위험 항목과 규칙 강도는 보존했다. 전체 재구성이나 같은 reviewer의 재승인을 새 절차로 추가하지 않고 영향받은 문구를 별도 검증자가 재검증했다.

## 확인한 근거와 남는 범위

구현·개선 검토에 참여하지 않은 별도 검증자가 최신 8파일을 기준으로 요구별 충족 근거가 있다고 반환했다. 개발 재개, sync 변경, 설명만 요청, 지정 Project 갱신, 한정 구현 위임의 다섯 경로를 독립적으로 읽었으며 전체 Workspace 인수·생성·session activation이 공통 선행 조건으로 생기지 않았음을 확인했다. Router·sync·schema·UI·명령의 대표 사실도 실제 코드·설정과 대조했다.

하위 네 가이드의 마지막 보완 뒤에는 이전 판본의 무효가 된 해시·문구 판단을 구별해 국소 재검증했다. 변경 문구만 역치환하면 앞선 네 파일의 SHA와 정확히 일치하고, 나머지 네 파일은 이전 SHA 그대로임을 확인했다. 구현 책임·계약 Owner·규칙 강도는 유지됐으며 새 결함은 발견하지 못했다.

- Main 정적 확인: 로컬 링크 85개, 문서 내 anchor 9개, AGENTS bridge 5개, 안내한 명령 20개의 package script 정의에 새 오류가 없다.
- 별도 검증 직접 실행: 로컬 링크 85개·bridge 5개 정상, 최신 8파일의 입력 SHA 일치, `git diff --check` 성공. anchor·명령 probe는 실제 assertion과 최신 SHA를 대조해 재사용하고 명령 별칭·검사 설정은 추가 확인했다.
- `pnpm harness:check`는 로컬 wrapper가 패키지 도구를 준비하며 registry fetch에 실패해 checker까지 도달하지 못했다. 등록된 동일 프로그램 `node scripts/check-harness.mjs`를 Main과 검증자가 직접 실행했다. 최신 결과는 exit 1·64건이다.
- 변경 전 원본 65건과 비교해 신규 실패는 없고 006 활성 output의 깨진 README 연결 1건을 복구했다. 남은 역사 참조를 숨기거나 검사 예외를 늘리지 않았다. 검증자는 변경 전 기준선을 제공 로그에서 재사용했고 최신 64건은 직접 재실행했다.

[Main 정적 확인](ticket-14-guide-static-checks.json), [기존·최신 검사 원문](ticket-14-guide-check.txt), [독립 검증과 국소 재검증](ticket-14-guide-verification.json), [검증자의 checker 원문](ticket-14-guide-verifier-check.txt)에 대상·해시·확인 범위를 보존한다. checker의 연결·형식 검사, 문서의 독립 의미 검토, 실제 제품·host 수행은 다른 근거다.

앱·실기기·외부 서비스·실제 host 스킬 발견/호출은 이번 변경에서 실행 검증하지 않았다. 제품 테스트 통과나 전체 harness pass를 주장하지 않는다. 기존 제품 타입 오류와 미커밋 초기 원판 부재는 이번 지침 변경으로 해소되지 않았다. 다음 전체 대조·현재 Verify 근거·사용자 수락 판단은 Ticket 13에서 이 결과와 기존 한계를 함께 본다.
