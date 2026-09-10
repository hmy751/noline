# 분석 보존과 원래 경로 삭제 조건 검증

2026-09-10 Main이 실제 파일과 임시 Project 복사본을 확인했다.

- 분석 원문 7개 사본을 원본과 byte-for-byte 비교하고 SHA-256도 대조했다. 모두 일치했다.
- 읽기용 분석 7개 문서는 Markdown 링크 목적지를 제외한 본문이 원본과 같았다.
- 원래 `.claude/sessions/2026-09-06-codebase-analysis.md`와 같은 이름의 분석 디렉터리를 넣지 않은 임시 Project에서 이 Workspace의 Markdown 링크 191개를 검사했고 누락·복사본 밖으로 빠지는 링크가 없었다. 원문 `.txt` 안의 당시 상대 링크는 역사 원문이며 현재 탐색 대상에서 제외했다.
- 같은 임시 Project에서 명시적 `python3 -B -m context.work.harness recover 003-bug-investigation-and-fixes --json`이 성공했다. 반환된 현재 자료에는 원래 분석 경로에 대한 의존성이 없었다.

[보존본](../source/codebase-analysis/README.md)과 [사본별 출처·해시](../source/analysis-preservation.json)가 원래 경로 없이 필요한 내용을 제공한다. 두 Workspace는 같은 검사를 각각 통과했다.

실제 원본을 삭제하거나 임시로 이름을 바꾸지 않았다. 제품 코드·제품 Verify·활성화·커밋은 수행하지 않았다. 이 결과는 자료 보존과 경로 독립성을 확인한 것이며 분석의 제품 사실을 새로 검증한 결과가 아니다.
