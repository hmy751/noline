# Source inventory

이 Workspace는 Noline target의 최초 적용 전 상태를 원자료로 보존한다. 현재 판단·분석·결정·실행 결과는 source에 두지 않는다.

- [`../records/receipts/preflight/preflight-20260904T035945230719Z-b9ccb26968c24cd8b20f1de6e5413785.json`](../records/receipts/preflight/preflight-20260904T035945230719Z-b9ccb26968c24cd8b20f1de6e5413785.json): 2026-09-04 UTC에 `capture_target_state.py`로 확보한 target Git·instruction 관찰 receipt. SHA-256은 `c1419d9a1c86acf6f432548f5014b0d6cef71ae293d59ec05d20195dcded81d7`이다.

Noline 제품·AI harness의 canonical은 root `README.md`, `CLAUDE.md`, `.claude/`와 실제 코드에 남아 있다. 이 Workspace는 그것들을 source에 복제하지 않는다.

## 2026-09-09 보완의 선택 원자료

옛 memory의 [goal](prior-memory/01-goal.md.txt), [constraints](prior-memory/02-constraints.md.txt), [Project 선택](prior-memory/03-project-context.md.txt)은 전환 전 바이트를 보존한다. 현재 Work 정의가 아니며 최초 이식의 범위·근거를 되짚을 때만 읽는다. 새 preflight 기계 증거는 [records/receipts/preflight/](../records/receipts/preflight/)에 둔다.

## 2026-10-30 재적용 직전 관찰

[preflight](receipts/preflight-20261030T055124157918Z-9d393dbdbce84514b7f11c7109b047f1.json)는 이번 target Git·instruction·untracked 관찰 원본의 exact copy다. SHA-256은 `7e036939facf9b425f155b6d7d111dd3403db3d002941c00b58769995c2a4972`다. Source Reference는 `f5082bc30ab3470a3e3a4a895cfcb6cb50b3af81`, target baseline은 `4fb309d2ba50afaca44019879d7161964b9b2328`이었다. 관찰 receipt는 ignored 전체·atomic snapshot·변경 저자를 증명하지 않는다. 적용 판단과 결과는 [기록](../records/2026-10-30-01-reference-context-refresh.md)이 소유한다.
