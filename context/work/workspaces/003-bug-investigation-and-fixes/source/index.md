# 선택한 원자료

- [주요 기능 카테고리 실험](2026-09-13-category-probes.cjs), [관찰 결과·소스 해시](2026-09-13-category-probes-output.json): 현재 함수를 메모리 DB·서버/native 대체물과 연결한 39개 관찰 항목이다. 정상 대조군 16개와 결함 조건 23개이며 독립 신규 버그 수가 아니다. 카테고리별 조사 깊이와 한계는 [추가 조사 기록](../records/2026-09-13-02-major-feature-category-investigation.md)이 설명한다. 실제 SQL 원자성·기기 E2E의 증거로 사용하지 않는다.

- [2026-09-13 첫 사용 시나리오 실험](2026-09-13-first-use-probes.cjs), [실행 출력·소스 해시](2026-09-13-first-use-probes-output.json): 현재 소스의 인증 복구·화면 이동·Repository·로그아웃·비동기 통화·동기화 결과를 분리 실행했다. 조건·실제 기기 검증과의 경계는 [조사 기록](../records/2026-09-13-01-first-use-scenario-investigation.md)에 있다. 현재 결함을 기대하는 조사용 assertion이며 수정 후 완료 검증이 아니다.

- [사용자 원문](user-direction.md): 코드 집중, 두 범주의 누락 방지, 리팩토링 우선·바텀 요소부터, Workspace 두 개 생성과 원본 문서 미커밋 요청을 보존했다. 범위·우선순위를 바꾸기 전에 읽는다.
- [보존한 코드베이스 분석](codebase-analysis/README.md): 분석의 목적·범위·확인 수준과 보존할 기반을 이해하는 보존본 진입점이다.
- [코드 표현](codebase-analysis/code-style.md), [컴포넌트 내부 흐름](codebase-analysis/components.md), [엔진과 데이터 흐름](codebase-analysis/engine-data.md), [서버와 공유 계약](codebase-analysis/server-contracts.md), [검증 결과와 남은 확인](codebase-analysis/verification.md), [구조와 보존할 기반](codebase-analysis/architecture.md): Ticket을 정할 때 해당 후보의 원래 근거와 반대 조건을 직접 읽는다.
- [출처·해시](provenance.json): 원본 7개 파일의 SHA-256, 분석 기준 commit, Workspace 구성 시 HEAD와 원문 발췌 위치를 담는다.

기존 분석 문서는 2026-09-06 관찰을 2026-09-08에 분리한 기록이며 281개 소스 목록 조사와 대표 경로 분석이다. 전 파일 정독·전체 앱 실행 결과로 확대하지 않는다. 사용자가 원래 경로의 향후 삭제를 예고하여 분석 7개 파일의 내용을 이 Workspace 안에 보존했다. 이제 분석을 읽는 진입점은 아래 보존본이며 원래 `.claude/sessions` 경로가 없어도 읽을 수 있다. 원본 파일은 이번에 삭제하거나 수정하지 않았고 커밋도 하지 않았다.

## 보존본과 무결성

- [읽기용 분석 목차](codebase-analysis/README.md): 기존 분석 본문을 옮겨 문서 사이와 제품 코드로 향하는 링크를 새 위치에 맞췄다. 이후 사용자 요청으로 분석 목차의 배경 설명 2곳에서 특정 활용 목적을 직접 언급한 표현을 삭제했다. 분석일·기준 commit·기술 관찰·미확인 범위는 바꾸지 않았다.
- [원문 사본](codebase-analysis/raw/): 원래 7개 파일과 byte-for-byte 같은 `.txt` 사본이다. 링크 이동 전의 정확한 원문을 대조할 때 사용하며 옛 상대 링크를 현재 탐색 경로로 취급하지 않는다.
- [보존 경로·해시](analysis-preservation.json): 원래 출처, 원문 사본과 읽기용 문서의 대응 및 각각의 SHA-256을 담는다. `provenance.json`의 옛 경로는 출처 이력이며 재진입 의존성이 아니다.

두 Workspace는 각각 원자료를 소유하고 다른 Workspace의 분석 사본을 읽어야만 이해되는 관계를 만들지 않는다. raw 사본은 당시 원문이며 읽기용 문서의 편집 내역은 보존 경로·해시에 명시한다. 이후 제품 코드 변경에 맞춰 기술 관찰을 소급 수정하지 않는다. 새 분석·현재 판단은 current와 새 records에 남긴다.

분석을 받아 새로 내린 판단은 [현재 후보](../current/memory/analysis-items.md)와 [구성 기록](../records/2026-09-10-01-workspace-setup.md)에 있다. Project common/current 본문은 원래 Owner를 Recover로 선택하며 source snapshot으로 복제하지 않는다.


## 추가 분리 실험의 원자료

- [당시 실험 스크립트](2026-09-10-isolation-probes.cjs.txt)

- [실행 출력 원문](2026-09-10-isolation-probes-output.txt): 이전 session 301행 tool output 중 실험 결과만 내용 변경 없이 보존했다.

스크립트는 당시 /tmp 파일의 byte-for-byte snapshot이며 제품 테스트가 아니다. Node 메모리 SQLite로 Expo native bridge만 대체하고 설치된 Expo Drizzle driver와 현재 소스에서 추출한 함수를 사용했다. 사용자 로컬 경로가 원문 안에 있으므로 그대로 실행 가능한 범용 도구로 취급하지 않는다. 실험은 기존 결함을 기대하는 assertion을 포함한다. 재현·회귀 조건을 정하기 전에 [추가 조사 해석](../records/2026-09-10-02-additional-findings.md)과 함께 읽는다.
