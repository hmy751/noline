# Harness test evidence

- [관련 63 tests](2026-09-09-related-tests.log): sandbox 직접 실행에서 전부 통과했다.
- [첫 전체 122 tests](2026-09-09-first-full-run.log): sandbox 직접 실행에서 descendant timeout timing failure 한 건이 재현됐다. PID 파일 생성 전 exit 124였으며 원본 테스트를 바꾸지 않았다.
- [Source snapshot을 동반한 전체 재실행](harness-test-20260909T143128349049Z-ca581a4a12244cabba828fe6315ad037.json): 승인된 target receipt 쓰기 권한으로 실행해 같은 source의 122 tests가 통과했다. Helper가 Python source 27개를 snapshot했다. 첫 실패를 지우거나 timing 문제가 해결됐다고 해석하지 않는다.

임시 Workspace validation도 전체 실행에 포함되어 pass했다. Product Verify의 구조 검사, 실제 host acceptance와 구별한다.
