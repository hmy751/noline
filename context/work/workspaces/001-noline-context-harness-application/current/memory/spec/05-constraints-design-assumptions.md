# 제약·현재 설계·가정

기존 사용자 파일과 상세 canonical, `noline-work`, `noline-*` report-only agents, Claude adapter·test·settings·wrappers를 보존한다. `.claude/skills/`가 원본이고 `.agents/skills/`가 상대 bridge인 Noline 모델을 유지한다. 여섯 Reference skill을 같은 모델에 적응하며 별도 `.codex/skills/`를 만들지 않는다.

승인 범위는 최신 이식이며 기존 문서 전체 정비·제품 리팩토링은 제외한다. 나머지 구성·구현·검증은 현재 Owner와 실제 근거를 보고 정한다. 이식으로 대체되는 Project 요약은 유효한 내용의 layer 귀속과 기존 파일 처리를 함께 끝낸다. 현재 역할이나 호환 필요가 없는 원래 경로는 제거하며, Git에 같은 본문이 보존되어 있으면 별도 source 복사본을 만들지 않는다. 계속 사용하는 상세 제품 정본은 원래 위치에 유지한다. 옛 goal·constraints는 source에 보존하고 Spec이 현재 정의를 맡는다.

Target branch·index·기존 runtime을 바꾸거나 host trust·session activation을 실행하지 않는다. `.codex/maintain-runtime/`·`.claude/maintain-runtime/`의 private payload를 기록에 복제하지 않는다. 새 session은 default-unbound다. 자동 연결이 없을 때 허용된 문서 반영은 Maintain 수동 fallback을 따르며 설치·접수와 실제 반영을 구별한다.

정적 bridge·설정 검사로 실제 host discovery를 알 수 있다는 가정은 하지 않는다. 후속 리팩토링으로 효과를 평가할 때 이식·맥락 정비 비용과 제품 코드 출발 상태를 함께 보존한다.
