# Reference의 Personal·읽기·한정 갱신·설명 부분 반영

2026-10-30, 사용자가 최신 적용안에 따라 Noline 반영·확인을 요청했다. Maintain은 ai-workspace014의 Ticket02에 계속 남기고 기존 artifacts와 병렬 변경을 보존한다.

## 선택과 반영 범위

Source는 ai-workspace Reference `f5082bc30ab3470a3e3a4a895cfcb6cb50b3af81`의 clean 판본이다. Noline baseline은 `main @ 4fb309d2ba50afaca44019879d7161964b9b2328`이며 적용 전 tracked·staged 변경은 없었다. `.pnpm-store/`·`artifacts/`의 untracked976개는 그대로 보호한다.

- Personal의 네 개발 주제와 경험·형성 자료, USAGE·내용 관리·체계 지침·본문 형식을 추가했다. Reference 사례·경험은 그 출처와 관찰 한계를 유지하고 Noline의 제품 사건으로 바꾸지 않았다.
- context-update·explain, 공통 설명 기준과 스킬 관리 정책을 `.claude/skills/` 원본으로 두고 `.agents/skills/`에서 두 새 스킬로 상대 연결했다. 별도 `.codex/skills/`는 만들지 않는다.
- 기존 읽기·갱신·두 설명 스킬은 현재 수행 경로로 안내하는 호환 진입이 됐다. Workspace001의 verify evidence,09월14일 Decision과004 output이 옛 경로를 참조하므로 파일과 bridge를 유지하고 자동 선택을 비활성화했다. 당시 본문은 Git 이력이 소유한다.
- 공통 설명 기준은 skill shared가 소유한다. Project guidance의 옛 regular file은 실제 소비 경로 호환만 맡고, 현재 root·색인·work-discussion은 shared를 직접 연결한다. 기존 work-discussion의 수행 계약은 유지한다.
- Project 구성·읽기·관리는 Noline 본문에 정책·USAGE·context-update 연결을 좁게 병합했다. form/request/local/server 대조, API·날짜 사례, current의 독립 가치와 갱신 비용, Owner 이동의 의미 보존·기존 진입 검증을 유지한다.

제품 코드·가이드·app/package 지침은 변경하지 않는다. Personal 안내는 TypeScript의 type 기본값·import/명명/중괄호·console.log 금지, React Native Controller+Field와 hook/data 부작용 경계, UI primitive/app composition, API 오류 전달과 리팩터링 기준으로 연결한다. 일반 예제를 모든 catch·null 반환 의무로 해석하지 않으며 열린 서버 오류 정책을 확정하지 않는다.

## 적용에 필요한 적응

관리 정책의 예시에서 Reference sample의 request timeout 링크를 Noline 제품 의미·Selective Local-First 결정으로 바꿨다. 형성 자료의 외부 링크는 원래 source의 절대 경로와 판본으로 연결하고, Reference 자체 적용 기록은 Noline 결과로 복제하지 않았다. 과거 발췌의 fenced 원문과 `.txt` 판본은 보존했다.

검사기는 새 스킬 두 개와 shared·정책·background 항목만 추가한다. 신규 형성 자료의 fenced 원문 안에 있는 역사 Markdown 표기가 실제 링크로 잘못 검사되는 문제가 있어 code block만 제외하도록 보완했다. 실제 Markdown 링크와 기존 bridge·agent·Maintain 검사는 그대로 수행한다. 이는 과거 원문을 현재 경로로 변조하지 않기 위한 검사 범위 정정이다.

## 검증과 확인 상한

승인한153개 경로를 반영했다(신규 본문·지원 자료121, 기존 파일26, 새 bridge2, 적용 기록·관찰 사본4). 삭제·stage·commit은 없다. 실제 반영일의 fresh preflight로 예약 receipt 경로만 갱신했다.

- 변경 Markdown의 로컬 링크992개와 앵커226개를 확인해 누락 경로·앵커가 없었다. 새 frontmatter·호출 설정12개를 YAML로 읽고, 두 새 상대 bridge가 같은 원본에 도달함을 확인했다. 자동 발견·호출 효과의 검증은 아니다.
- 구조 검사는 적용 전후 같은8건의 실패를 반환했다. 모두 과거 Workspace002·003의 기존 끊어진 링크이며 새 실패는 없다. 기존 failure를 숨기거나 전체 통과로 기록하지 않는다. Fenced 원문 제외는 닫힘·긴 fence·tilde·미닫힘·실제 본문 링크의5조건으로 확인했다. 실제 missing link는 계속 검출한다.
- 기본001·명시001은 같은15개,002는20개 context를 읽었고 적용 전후 선택은 같았다.001의 기존 Verify receipt는 stale(125 snapshot 중57 changed, missing0),002는 not_applicable이다. 기존 machine 결과·receipt를 새 성공이나 fresh로 바꾸지 않았다.
- 기존 tracked980개 중 허용된26개 외954개와 untracked976개가 변경 전 해시·kind를 유지했다. 별도 확인한 artifacts·양쪽 Maintain runtime의2106개 파일/링크도 같았다. root 핵심 불변식과 Noline 제품 가이드, Work-discussion의 링크 밖 본문, Project 고유 판단은 보존했다.
- 네 개발 주제 INDEX와 두 legacy 원문 evidence는 Reference와 byte가 같다. 실제 읽기에서는 폼/UI 공통화, API 오류 전파, 코드 표현과 Project current 구성의 질문으로 새 진입과 기존 Owner를 대조했다. Noline의 제품·개발 계약과 열린 서버 오류 정책을 유지하며, 판단 효과나 제품 동작 시험으로 확대하지 않는다.

기본001·명시001·002 Recover는 적용 전후 모두 읽기 전용 실행이 성공했다. Metadata의 current generation에는002 binding이 남아 있으나 모두 session-end 파일이 있고, 이를 현재 실행 중인 세션으로 단정하지 않는다. 진행 가능성 추정 대신002도 확인 범위에 포함한다.

Maintain 코드·role·hook·설정·수집기·runtime, Work 기록/전환 계약, Recover/Verify 구현과 machine JSON·receipt·active index를 변경하지 않는다. 제품 검사·durable Verify·actual host discovery/호출·activation·통합 흐름·제품 acceptance·commit·push는 수행하지 않는다. 새 source receipt는 관찰 원본의 exact copy이며 기존 source 원문은 보존한다.
