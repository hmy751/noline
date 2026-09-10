# 원래 분석 경로 삭제에 대비한 내용 보존

2026-09-10 사용자가 아래 두 경로를 지금 삭제하지는 않지만 나중에 삭제할 것을 전제로, 링크만 남기지 말고 옮기거나 구성하도록 요청했다.

```text
.claude/sessions/2026-09-06-codebase-analysis.md, .claude/sessions/2026-09-06-codebase-analysis

지금은 삭제하지 않았지만 나중에 삭제할걸 염두해두고 링크 말고 옮기거나 구성해놓아줘
```

## 반영

이 Workspace의 [분석 보존본](../source/codebase-analysis/README.md)에 원래 분석 7개 파일의 전체 내용을 담았다. 읽기용 Markdown은 문서·코드 링크만 새 위치에 맞췄으며, [원문 사본](../source/codebase-analysis/raw/)은 원본과 byte-for-byte 같다. [보존 경로·해시](../source/analysis-preservation.json)에 두 표현의 대응과 각각의 무결성을 남겼다.

후보 목록·source 색인·state·제약 문서를 이 보존본으로 연결했다. 이전 구성 기록의 '당시에는 원문을 복제하지 않았다'는 설명은 당시 이력으로 남기고 이번 변경을 별도 기록했다. 원래 경로는 provenance의 과거 출처일 뿐 현재 읽기에 필요한 경로가 아니다. 두 Work의 사본은 서로 자동 갱신하거나 다른 Workspace의 current를 읽도록 연결하지 않는다.

원본 분석 파일은 삭제·수정하지 않았다. 제품 코드·Workspace 활성화·Ticket·제품 Verify·커밋 상태도 이 자료 보존 작업으로 변경하지 않는다. 현재 내용과 링크의 실제 검증 결과는 확인 후 이어 남긴다.
