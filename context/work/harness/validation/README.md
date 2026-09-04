# Harness validation

이 경계는 Recover와 Verify가 함께 연결될 때도 checked-in 제품 Workspace의
기계 상태를 오염시키지 않는지 자체 검증한다.

## 소유 범위

- 임시 Project와 Workspace에서 `recover -> verify -> recover` 순환을 실행한다.
- 실행 전후 checked-in active Workspace의 `status.json`과 receipt 파일을
  byte 단위로 비교한다.
- 순환이 성공하고 제품 상태가 보존되는지를 회귀 테스트로 고정한다.

Recover와 Verify 각각의 계약·단위 검증은 각 책임 경계가 소유한다. 이 경계는
제품 claim의 충분성, 사람 acceptance, Maintain, 실제 제품 Workspace의 durable
검증을 소유하지 않는다.

## 내부 구성

- [`tests/test_ephemeral_workspace_state_preservation.py`](tests/test_ephemeral_workspace_state_preservation.py):
  임시 순환과 checked-in 기계 상태 보존을 검증한다.
- [`../testing.py`](../testing.py): Recover·Verify 단위 테스트도 함께 사용하는
  최소 Project/Workspace fixture 지원이다. 공유 기반일 뿐 validation의 판단
  계약을 소유하지 않는다.

## 실행

Noline Project root에서 다음 명령을 실행한다.

```bash
python3 -m unittest \
  context.work.harness.validation.tests.test_ephemeral_workspace_state_preservation \
  -v
```

이 검사가 통과하면 Recover·Verify 연결과 제품 상태 격리는 확인된다. 제품
claim의 의미적 충분성이나 실제 운영 환경의 성공까지 증명하지는 않는다.
