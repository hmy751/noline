# Machine receipts

이 폴더는 이 Workspace가 보존하는 기계 생성 증거를 종류별로 격리한다.

- [`preflight/`](preflight/): 최초 적용 전 target 관찰 receipt
- `harness-tests/`: target에 설치한 Harness code·contract의 durable test receipt
- `verify/`: `verify.json`의 고정 argv와 canonical basis·evidence snapshot을 남기는 Verify receipt

receipt의 존재만으로 사람 acceptance, 실제 Codex host lifecycle 또는 Workspace 완료를 뜻하지 않는다.
