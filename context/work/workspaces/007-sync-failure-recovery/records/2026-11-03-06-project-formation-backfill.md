# 2026-11-03 — Project 형성 자료와 남은 문서의 반영 보완

Ticket 01·02·03의 Project 반영(`7f8cb819`, `c8ab78b2`)에서 본문만 고치고 형성 자료를 빠뜨린 것을 사용자가 지적했다. 같은 날 이전 작업 전체의 문서 반영을 다시 대조해 보완한 기록이다.

## 무엇이 빠졌나

사용자의 질문은 다음과 같았다.

> "근데 문서 바꾸는데 _background는? /recall-document-guidance  이 스킬 제대로 쓴거 맞지?"

이어 "아까 작업들도 잘봐봐 문서 잘 반영 못했는지 보완하고 마저"라고 요청했다.

- [CONTENT-POLICY](../../../../CONTENT-POLICY.md)는 본문의 의미가 바뀌면 그 의도·선택 이유·근거를 같은 주제의 `_background`에 남기라고 한다. [context-update](../../../../../.agents/skills/context-update/SKILL.md)도 "의미·적용 조건이 달라지면 관련 형성 이유와 필요한 근거도 확인·보완"하라고 한다.
- 두 커밋은 데이터 수명 본문(재시도 한도 제거, IN_PROGRESS 되돌림, 간격 재시도)과 API 계약 본문(큐 작업 재전송 응답)의 의미를 바꿨지만, 각 형성 자료는 그대로였다.
- 특히 데이터 수명의 형성 맥락은 "중단 작업의 재개 정책은 이 편입으로 채택하지 않는다", "미전송 판정이 바뀌면 본문과 이 이유를 함께 재검토한다"고 스스로 재검토 조건을 걸어 두었는데, 그 조건이 충족된 변경에서 재검토하지 않았다.
- `recall-document-guidance`를 부른 뒤에도 Work 작성 기준만 읽었다. 대상에 Project 문서가 있었는데 [Project 관리 계약](../../../../project/MAINTENANCE.md)과 CONTENT-POLICY를 읽지 않았다. 스킬을 불렀다는 사실을 기준을 다 떠올린 것으로 취급한 것이 원인이다.

## 보완한 것 (Main)

**Project 형성 자료**
- [데이터 수명 형성 맥락](../../../../project/guidance/data-lifecycle/_background/context.md#실패-횟수-한도를-없애고-중단된-전송을-되돌렸다): 사고 경위, 서버·앱 세 변경을 한 묶음으로 바꾼 이유, 재시도 대안 비교표와 기각 이유, 받아들인 비용과 간격 재시도 보류 조건, IN_PROGRESS를 다음 sync에서 되돌리는 이유와 실행 잠금 전제, 폐기·여행별 FIFO를 미룬 이유. 앞 절의 "CREATE 재전송 멱등성은 따라오지 않는다"는 공백을 서버 응답이 메운다는 관계도 적었다.
- [데이터 수명 근거](../../../../project/guidance/data-lifecycle/_background/evidence.md#재시도-한도-제거와-중단-전송-회복의-근거): 2026-10-31 판본의 "재시도 한도"가 그 뒤 바뀐 근거로 관찰·설계 비교·커밋과 검사·실제 앱 확인을 연결하고, "두지 않음"에서 "보류"로 정정한 경위와 사용자 원문을 남겼다.
- [API 계약 형성 맥락](../../../../project/guidance/_background/api-contracts/context.md#같은-사용자의-재전송은-서버가-처음-결과로-응답한다): 서버가 판단하게 한 이유, 앱 쪽 간주·선행 조회와의 비교, 쓰기 조건 유지·409·body 비교 생략·처음 삭제 시각·Trip 삭제 차이·부모 먼저 확인의 세부 선택.
- [API 계약 근거](../../../../project/guidance/_background/api-contracts/evidence.md#큐-작업-재전송-응답의-근거-2026-11-03): 사고 관찰, 수정 전 증상 재현(Main만 수행), 현재 검사와 실제 앱 확인, 대안 비교·개선 검토 기록으로의 연결, 미배포 상태.
- 읽기 안내: 두 형성 자료의 README, [데이터 수명 README](../../../../project/guidance/data-lifecycle/README.md), [API 계약](../../../../project/guidance/api-contracts.md) 첫 단락에 새 선택 이유를 언제 읽는지 더했다. 본문의 계약 문장은 이미 맞아 바꾸지 않았다.

**Workspace 007의 낡은 문장**
- `recover.json`: 데이터 수명·API 계약의 선택 이유가 "Ticket 01·02가 고칠 대상", "정하고 문서에 남긴다"는 실행 전 문장이었고 행 번호도 어긋나 있었다. 현재 소유 내용과 형성 자료 위치로 고쳤다.
- [Project 선택](../current/memory/project-context.md): 같은 낡은 문장과 행 번호를 고쳤다. "작성 전에 읽을 것"에 CONTENT-POLICY와 형성 자료 반영을 넣고 이번 누락을 적었다.
- [Spec 05](../current/memory/spec/05-constraints-design-assumptions.md)의 재시도 행 "다시 볼 조건"을 간격 재시도 보류 조건과 맞췄다.
- Ticket 03의 "지금 verify.json은 JSON 파싱만 확인한다"를 Ticket 생성 당시의 사실로 고쳤다.
- Ticket 01·02의 상태에 형성 자료를 뒤늦게 보완했다는 사실을, [output](../output/index.md)에 형성 자료 행과 `c8ab78b2`를 더했다.

## 대조 범위와 남긴 것

- Project에서 retry·재전송·IN_PROGRESS를 언급하는 본문(데이터 수명, API 계약, 오류 처리, 앱 실행, 아키텍처, 제품 의미)을 검색해 대조했다. 본문의 계약 문장 중 실제 동작과 어긋난 곳은 찾지 못했다. 오류 처리의 "status를 조용히 바꾸지 않는다"는 API 계약 본문과 테스트로 고정한 것으로 충족한다.
- 앱 실행 본문의 행 번호(93–96행)를 쓰는 Work 문서는 그대로 두었다. 이번 변경으로 그 문서의 행이 바뀌지 않았다.
- 별도 Decision 문서는 만들지 않았다. [decisions 기준](../../../../project/decisions/README.md)이 이관한 제품 주제의 선택 이유는 해당 본문의 형성 자료가 맡을 수 있다고 하고, 이번 선택은 데이터 수명과 API 계약 각각에 속한다.
- 기존 날짜별 record(01~05)는 고치지 않았다. 이 보완은 이 새 record로 연결한다.
- 형성 자료의 충분성은 Main의 대조이며 별도 검토자를 두지 않았다.
- API 계약은 Verify의 기준 문서다. 첫 단락의 읽기 안내를 고치자 Recover가 receipt를 stale로 표시했다. claim·argv는 그대로 두고 13:02Z에 Verify를 다시 실행해 통과했다(새 receipt 추가, 이전 receipt 보존).
