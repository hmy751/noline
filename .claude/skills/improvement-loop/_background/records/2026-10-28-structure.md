# 전체 안내·실행 상세·Personal 근거의 역할을 정리한 기록

2026-10-28. 사용자가 파일 위치·references 형식의 개선 검토 뒤 “그래 반영해봐”라고 요청했다. 루트 안내 유지와 본문 역할 정리, 확인 이력 구별, Personal 근거 소유를 반영했다. 호출·검토 범위·선택 권한·종료의 기존 합의는 유지한다.

## 현재 선택과 바꾼 곳

[적용 사례의 현재 위치](../../references/application.md)는 여러 구성요소의 관계와 대표 선택을 설명하므로 같은 위치에 두었다. 제목을 구성과 적용 사례로 바꾸고, 실제 수행은 [SKILL](../../SKILL.md), 보존·갱신은 Personal이 맡는다는 관계를 먼저 설명했다. 작성 목록과 다음 작업 지시는 Workspace의 current·기록에 맡겼다. 사례는 보존 경험과 가정한 다음 선택을 구별하며 조건·선택·바뀌는 곳을 비교한다.

루트와 skills README에서 최근 추가 공지 대신 질문별 진입으로 연결했다. SKILL은 관련 경험·대상 탐색과 후보 제시의 읽기 구간만 나눴다. conversation은 공통 절차·환경별 방법·입력 공백을, effects는 상태별 판단과 필요한 비교·후속 반영을 계속 맡는다. 새 INDEX나 host별 폴더는 만들지 않았다.

Personal의 범위 확대와 Work 강제 등록 정정의 최소 원문은 기존 Personal 형성 context로 옮겼다. 루프 evidence가 그곳을 참조한다. 새 evidence 파일을 만들기보다 짧은 이유와 발췌를 함께 읽게 했으며, 추후 독립적으로 관리할 근거가 늘면 나눌 수 있다. 원래 인터뷰와 이전 검토 snapshot은 바꾸지 않았다.

앞선 리뷰가 제안한 한정 시도의 일반 작업 소비/종료 경로 구체화와 동일 목적의 수행 수단 비교 사례 교체는 이번 구조 편집과 별도이며 여전히 미반영이다. 사례의 표 편집을 그 두 실행 보완의 완료로 보지 않는다.

## 원문 접근 예의 확인판

2026-10-28 최초 prototype 작성 시 로컬 Codex의 `CODEX_THREAD_ID`와 `~/.codex/sessions/` 아래 해당 식별자를 포함한 `rollout-*.jsonl`을 대조했다. `session_meta`의 `payload.id` 또는 `session_id`와 `cwd`로 현재 세션 파일을 식별했다.

확인한 파일에서는 `response_item`의 `payload.type = message`, `role = user | assistant`, `content`의 `input_text | output_text`에 발화가 있었다. `event_msg`에 같은 발화가 중복될 수 있고 `compacted`의 replacement history는 원문 전체를 대신하지 않는다는 구별을 실행 상세에 남겼다.

당시 확인은 파일 식별과 메시지 구조 확인이다. 전체 대화를 추출·대조하거나 모든 host의 접근을 시험한 결과가 아니다. exporter·hook·자동 원문 수집기를 설치하지 않았다. 이번 구조 편집도 이 확인 범위를 확대하지 않는다. 현재 세션에서 실제로 원문을 확인하는 방법과 공백 처리는 [conversation](../../references/conversation.md)을 따른다.

## 확인과 한계

문서 역할과 들어오는 참조, Personal의 독립적인 근거 경로, 실행 의미 보존을 대조한다. 원본을 바탕으로 viewer를 재생성하고 링크·앵커·표시 사본 검사를 수행한다. 구체 결과는 Workspace의 반영 기록이 맡으며 실제 루프 수행·운영 설치·효과 확인과 구별한다.
