# 선택한 Project 맥락

기본 Recover는 Noline의 상세 문서를 전부 읽지 않는다.

- [`../../../../../project/overview.md`](../../../../../project/overview.md): 제품 장면, 반복되는 불변식, Owner와 검증 경계
- [`../../../../../project/architecture.md`](../../../../../project/architecture.md): monorepo 구조, 실행 흐름과 검증 경로
- [`../../../../../project/decisions/0001-selective-local-first.md`](../../../../../project/decisions/0001-selective-local-first.md): Data Owner, Router, Policy Layer와 schema-first의 지속 결정

제품의 더 깊은 기능·edge case는 필요해질 때 [`.claude/context/README.md`](../../../../../../.claude/context/README.md), rules, guards, runbooks와 해당 코드 Owner를 직접 연다. 이 선택 목록과 이유의 machine canonical은 [`../../recover.json`](../../recover.json)이다.
