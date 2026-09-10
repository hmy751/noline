# 제약·현재 접근·가정

현재 접근은 기존 관찰과 추가 실험을 한 후보 목록에 보존하고, 실제 구현을 선택할 때 재현 조건·기대 결과·최소 수정 범위를 구체화하는 것이다. 전면 동기화 재설계나 모든 실패 UX를 새로 만드는 방식을 미리 채택하지 않았다.

사용자는 코드 가독성 리팩토링부터 하기로 했다. 그 Work 전체를 이 Work의 완료에 의존시키지 않으며 직접 겹치는 결함만 선행 관계를 판단한다. 두 Work는 목표·Spec·상태를 별도로 소유하고 자동 동기화하거나 상호 current 복구를 요구하지 않는다.

설치된 Drizzle 0.30.10을 사용한 분리 실험은 helper의 async callback과 commit 시점을 확인한 근거다. 드라이버 버전·transaction 방식이 바뀌면 다시 검증한다. Queue 조회 누락은 실험으로 확인했지만 실제 cleanup으로 사용자 데이터가 유실되는 전체 시나리오는 실행하지 않았다. 재시도·pull cutoff·초기화·폼의 일부는 기대 계약과 실행 조건이 열려 있다.

구성 기준은 `refactor/codebase`, HEAD `aa2314cd9c1400420ea8d22f5ea39f9d76ceca21`이며 원본 분석 기준은 `b4ed41f6e4bbae26fd45827b3b9063097a2c1ea4`다. 실행할 때 현재 코드와 설치 상태를 다시 확인한다. 선언된 eslint-plugin-prettier와 설치본의 차이를 보고 package 선언이 잘못됐다고 단정하지 않는다.

분석 내용은 이 Workspace의 보존본으로 유지한다. 원래 분석 경로의 향후 삭제는 예정됐지만 이번에는 삭제하지 않는다. 기존 미커밋 변경은 보존한다. 사용자 요청 없이 stage·commit·push·실제 DB 변경·서비스 호출·제품 배포를 하지 않는다. 이 Work를 이유로 `noline-work`를 다시 호출하거나 기존 하네스 변경을 제품 개선에 포함하지 않는다.

이번 생성은 active 기본값이나 session binding을 바꾸지 않는다. 후속 실행의 연결은 [Work 지침](../../../../../AGENTS.md)과 [session binding 계약](../../../../../harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)을 따른다.

원래 분석 경로는 과거 출처이며 영구 파일 보존 제약이나 실행 의존성이 아니다. [Workspace 안의 분석 보존본](../../../source/codebase-analysis/README.md)과 [출처·무결성 설명](../../../source/index.md)을 기준으로 읽는다. 원문 사본을 유지하며, 읽기용 문서는 링크 위치와 사용자가 요청한 배경 표현만 다듬었다. 편집 내역은 출처 정보에 남기고 기술 관찰·확인 수준은 유지한다.
