# Noline Project common decisions

이 디렉터리는 여러 Workspace에 계속 적용되는 결정을 Project common context 수준으로 재서술한다. 기존 [`.claude/decisions/`](../../../.claude/decisions/)의 상세 근거와 history를 이동·복제하지 않는다.

- [`0001-selective-local-first.md`](0001-selective-local-first.md): 활성화 상태에 따른 Data Owner, Activation Router, Policy Layer, client-generated ID와 schema-first 경계

새 Workspace의 일회성 선택, 검증 결과, 이식 과정은 이 폴더가 아니라 해당 Workspace의 `current/`·`records/`에 둔다.
