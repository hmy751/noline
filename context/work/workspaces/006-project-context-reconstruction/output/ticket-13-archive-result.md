# Archive를 프로젝트 루트로 이동한 결과

2026-10-31. 사용자 요청에 따라 두 README 정리·검증·Work 기록을 먼저 commit `db1a4bb`에 보존한 뒤 `.claude/_archive`를 `_archive`로 옮겼다. 보존 책임은 특정 AI host와 무관하며, 현재 정책·Context·스킬·Work의 역할을 바꾸지 않는다.

## 실제 이동과 현재 참조

[이동 manifest](ticket-13-archive-move-manifest.json)에 124개 파일의 이전·현재 경로, 크기, SHA-256과 기준 commit을 남겼다. 124개 전부 이동 직전 파일 및 commit `db1a4bb`의 바이트와 일치한다. 기존 manifest와 보존 README를 포함해 archive 안의 내용은 수정하지 않았다. `.claude/_archive`의 사본이나 symlink는 남기지 않았다.

공통 스킬 색인과 PR 상세의 형성 기록은 원문 인용·선택 이유를 유지하고 보존본 URL만 바꿨다. 006 output의 현재 Markdown 재접근 링크 17개 파일, 기계용 역사 target 지도의 resolved archive 위치, 002의 변경 가능한 기록 색인도 새 위치에 맞췄다. target 지도의 과거 source 발췌·원래 target·원문 해시·당시 판정은 보존했다. 기존 archive manifest의 original path를 새 경로로 덮어쓰지 않았다.

001 Verify의 archive 입력 5개와 검사기의 해시 고정 snapshot 조회를 root 경로로 전환했다. 옛 root 재등장은 금지하지만 기존 역사 링크 검사 예외를 늘리지는 않았다. 루트 구조 안내도 실제 host 설정·hook·스킬 연결과 별도 archive를 표시한다.

## 원문을 고치지 않은 범위와 재접근

기존 날짜별 Work records와 machine receipt는 당시 경로를 그대로 유지한다. 특히 001의 `2026-10-30-02-development-skill-transition.md`는 `.claude/_archive/skill-transition-2026-10-30/README.md`를 가리켰으며, 현재 보존판은 `_archive/skill-transition-2026-10-30/README.md`다. 이동 manifest에서 old_path를 검색해 같은 바이트의 new_path를 찾는다.

archive 안 Markdown의 상대 링크·명령·완료 표시는 당시 자료다. 독립 개선 검토와 별도 검증은 이동 전 존재하는 대상을 가리키던 여러 내부 Markdown 링크가 폴더 깊이 변경으로 새 위치에서는 끊기는 것을 확인했다. 따라서 내부 링크가 모두 이동 전부터 깨져 있었다고 간주하지 않으며, root 위치에서 클릭 이동을 보장하지 않는다. 원바이트 보존과 클릭 편의 사이에서 전자를 유지한 비용이다.

내부 상대 링크는 이동 manifest의 old_path가 있던 폴더를 기준으로 해석한다. 예를 들어 `_archive/activation-system-pre-project-2026-10-31.md`의 `../../context/project/common/product.md`는 옛 `.claude/_archive/`를 기준으로 `context/project/common/product.md`를 뜻한다. 해석한 target이 옛 archive 안이면 이동 경로표의 new_path로 찾고, 바깥 경로이면 원래 repository 경로와 Git 기준 판본을 대조한다. 상대 링크 문자열을 새 파일 위치에서 그대로 적용하지 않는다.

예를 들어 skill-transition 보존 README의 제거된 decisions 링크는 이동 전부터 있던 역사 연결이다. 보존판을 현재 정책의 안내로 삼지 않고 현재 root·Project·스킬·Work의 Owner에서 시작한다. Context·스킬의 현재 형성 자료와 Work 기록은 archive에 모으지 않았다.

## 확인과 한계

strict 검사는 65건으로 실패한다. README 정리 이후의 역사 실패 64건과 위 frozen 001 record의 옛 archive 링크 1건이다. [검사 원문](ticket-13-archive-check.txt)과 [검증 결과](ticket-13-archive-verification.json)에 기록한다. 현재 소비자 연결의 새 실패로 통과를 가장하거나 원문을 고쳐 green으로 만들지 않았다.

001은 전환된 regular 입력으로 실제 Verify를 실행해 실패 receipt를 새로 남겼다. 001·002·006 Recover는 모두 exit 0이었다. 독립 개선 검토는 필수 구조 변경을 찾지 못했고, 내부 상대 링크 비용을 위와 같이 보완하도록 권고했다. 별도 요구 검증도 124개 파일의 바이트·크기·SHA 일치, 기존 provenance 보존, 현재 경로 전환, 실제 65건 실패, 001 receipt와 regular 입력 해시 일치, 세 Recover packet 해시 일치를 확인했다. 내부 링크의 정확한 횟수는 추출 방식에 따라 달라 결과에서 단정하지 않으며, 새 위치에서 클릭이 끊기는 한계와 옛 경로 기준 재접근 방법을 설명한다. 이 이동은 제품 타입 오류·미커밋 원판 2개 부재·전체 역사 링크 문제를 해소하지 않는다.

다음은 프로젝트 root·앱·패키지 CLAUDE 지침의 책임·중복·구성을 판단하는 단계다. archive 이동은 아직 커밋하지 않았으며 006 전체 수락도 남아 있다.
