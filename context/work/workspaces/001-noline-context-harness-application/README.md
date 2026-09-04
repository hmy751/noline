# Noline Context Harness application Workspace

이 Workspace는 Noline의 기존 `.claude` Owner와 Claude/Codex bridge를 보존하면서 Project/Work context와 Workspace Harness를 최초 적용하는 작업을 소유한다. 제품 기능 변경이나 release acceptance는 범위 밖이다.

## 읽는 순서

1. [`current/memory/index.md`](current/memory/index.md): 목표·제약·선택한 Project context
2. [`current/state/index.md`](current/state/index.md): 현재 상태와 다음 판단
3. [`output/index.md`](output/index.md): 선택한 이식 산출물의 canonical 위치
4. [`records/README.md`](records/README.md): 적용 결정과 기계 receipt
5. [`source/index.md`](source/index.md): 이식 직전 target baseline receipt와 provenance

Project root에서 명시 id로 다음 Workspace를 복구한다.

```sh
python3 -m context.work.harness recover 001-noline-context-harness-application
```

Machine 계약은 [`workspace.json`](workspace.json), [`recover.json`](recover.json), [`verify.json`](verify.json)에 분리한다. Verify pass는 Noline 제품 acceptance·Workspace 완료·Codex host lifecycle acceptance를 뜻하지 않는다.
