# Noline 규칙

이 디렉터리는 작업 중 바로 확인할 수 있는 짧은 규칙을 모은다. 비용이 큰 엔지니어링 결정을 빠르게 떠올리게 하는 것이 목적이다.

규칙 문서는 전체 참고서가 아니다. 각 규칙은 아래 질문에 답해야 한다.

- 이 영역을 수정할 때 반드시 지키거나 피해야 할 것은 무엇인가?
- 이 규칙만으로 부족하면 어떤 맥락 문서를 보면 되는가?
- 마무리 전에 어떤 guard를 다시 확인해야 하는가?

## 읽는 방식

- 루트 가이드와 작업 위치의 workspace `CLAUDE.md`를 먼저 확인한다.
- 작업 범위가 닿는 규칙만 연다.
- 수정 전후에는 [guards](../guards/README.md)에서 고비용 실패 가능성을 점검한다.
- 규칙만으로 부족할 때만 [context](../context/README.md)로 내려간다.

## 브릿지 메모

이 파일들은 Noline의 현재 repository-local harness 표면이 `.claude/`이기 때문에 여기에 둔다. 하지만 내용은 plain Markdown 프로젝트 지침이며, `.codex/`나 `.agents/`로 자동 복제하겠다는 뜻이 아니다.

구체적인 도구별 필요가 생기기 전에는 Codex, Claude agent, skill용 사본을 만들지 않는다. 나중에 도구 adapter가 생기더라도 전체 정책 본문을 복사하지 말고 이 owning rule로 링크한다.

## 현재 규칙

| 규칙 | 수정할 때 | 관련 guard |
| --- | --- | --- |
| [Activation Router](activation-router.md) | Client Data Layer hook, repository, Local/Remote routing | Activation Router, Data/Service 분리 |
| [Transaction + Sync Queue](transaction-sync-queue.md) | Local mutation, offline write, activation/deactivation sync | Transaction + sync_queue, Soft Delete |
| [Schema First](schema-first.md) | 공유 contract, request/response shape, inferred type | Schema-first |
| [Client-Side ID](client-side-id.md) | client, schema, server를 가로지르는 create flow | Client-Side ID |
| [ISO Time](iso-time.md) | 날짜/시간 필드, 저장, API payload, 표시 helper | ISO 8601 time |
| [Auth/User Scope](auth-user-scope.md) | server route, sync endpoint, user-owned data | Auth/user scope |
| [Policy UI](policy-ui.md) | offline/online 제한과 policy 기반 UI 상태 | Policy UI |

## 규칙 추가 기준

규칙을 추가하거나 바꾸는 기준:

- 실수 비용이 크다.
- 같은 선택이 여러 workspace에 걸쳐 반복된다.
- 이미 있는 정책이 긴 맥락 문서 안에 묻혀 놓치기 쉽다.

예시는 현재 Noline 경로와 맞아야 하며, 동작에 영향을 주는 표현은 코드와 대조한 뒤 바꾼다.
