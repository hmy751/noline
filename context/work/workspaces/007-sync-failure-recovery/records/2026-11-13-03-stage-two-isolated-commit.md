# 2단계 코드의 분리 커밋 준비

사용자는 “그래 2단계 코드 커밋 하자”라고 승인했다. Main이 `git add`를 시도했지만 `.git/index.lock` 생성이 `Operation not permitted`로 실패했고, “git 써”라는 후속 지시로 재시도해도 같은 제한이 남았다. 커밋은 만들어지지 않았다.

사용자가 “그럼 명령어 줘봐 내가할게”, “noline 저장소에서 바로 실행할걸로”라고 요청하자 Main은 `git add -N`·`git add -p`로 사용자가 변경 조각을 선택하는 명령을 제시했다. 사용자는 다음과 같이 정정했다.

> 내가 선택하라고?

변경 범위를 판단해 준비할 책임을 사용자에게 넘긴 것이 문제였다. Main은 이를 인정하고 **선택이 끝난 patch와 사용자 실행 스크립트**를 준비하기로 했다. 사용자는 저장소에서 준비된 명령을 실행하며, 변경 조각을 직접 선별하지 않는다. 이 방식은 실행 환경의 Git 쓰기 권한을 우회하는 작업이 아니다.

## 분리 기준과 포함 범위

분리판은 현재 HEAD `2a624553039a33459a3c1554996eb4fa4908f388`의 archive를 `/tmp/noline-stage2-commit-tree`에 펼친 뒤 2단계에 필요한 변경만 적용한다. root 작업부의 후속·다른 작업 변경은 그대로 둔다. 사용자 실행 단계에서도 patch는 index에만 적용하도록 준비하며 작업 파일 전체를 분리판으로 덮지 않는다.

| 포함하는 책임 | 분리 경계 |
| --- | --- |
| 서버 수신·판본·표시·삭제 | reconcile·server-state·confirmed-deletion·sync-tables와 필요한 serverRecords migration/schema |
| 수신 원자성과 삭제 정리 기반 | DB 실행 경계, 삭제 처리에서 필요한 legacy 저장 기반과 clear/notify 부분, 공유 storage-input과 export |
| 실제 수신 호출 | engine의 2xx 응답 ACK와 pull의 reconcile 연결, 활성화·여행 목록의 수신 연결 |
| 기존 진입 정리와 검사 | 미사용 함수 제거, 실제 수신 진입을 사용하는 검사와 분리판 mock의 필요한 계약 |

engine은 분리 기준의 `lastSyncedAt` 조회를 유지한다. 409/410 후속 처리, 서버 구현, cursor, 직접 수정 실패, UI와 cleanup 후속은 이번 커밋에 넣지 않는다. 같은 파일에 섞인 후속 변경도 전체 파일을 그대로 stage하는 대신 분리판에서 필요한 부분만 선택한다. 최종 제품·검사 목록은 30파일이며 `/tmp/noline-stage2-commit-files.txt`에 있다.

기록은 이번 수신 검토와 직접 이어지는 기존 미커밋 네 기록(11월 12일 13·14, 11월 13일 01·02), 기록 색인과 이 새 기록의 6파일을 포함한다. 제품·검사와 합쳐 36파일의 분리 커밋을 준비했다. current 등 다른 문서를 일괄 포함하지 않는다. 기존 기록의 본문은 이 준비에서 다시 쓰지 않는다.

## 분리판 확인

첫 전체 client 실행은 76묶음 831개 중 828개 통과·3개 실패였다(`/tmp/noline-stage2-isolated-all-tests.log`). 실패는 HEAD의 화면 검사 mock에 새 수신 경계가 사용하는 `runDatabaseTransaction`이 없어서 발생했다. 해당 mock 계약을 한 줄 보완한 뒤 영향받은 세 묶음 82개가 통과했다(`/tmp/noline-stage2-isolated-followup-tests.log`). 보완 뒤 최종 전체 재실행은 **76묶음 831/831 통과**다(`/tmp/noline-stage2-isolated-all-tests-final.log`).

공유 schema 빌드는 성공했다(`/tmp/noline-stage2-isolated-schema.log`). 타입 검사는 경로 차이를 정규화해 비교했을 때 기존 오류 7개와 같다고 Main이 확인했다. 독립 검증은 관련 3묶음 **41/41 통과**다(`/tmp/noline-stage2-independent-commit-tests.log`). 이 41개는 전체와 겹치는 검사이므로 합산하지 않는다. lint는 오류 0·기존 trip-local shadow 경고 1이며 native 실행은 하지 않았다. 이전 root 작업부의 145개·독립 3개 등과 분리판의 검증도 구별한다.

## 적용과 완료 상태

사용자는 준비 도중 “아빨리해 적당히”라고 요청했다. Main은 추가 검사·범위 확대를 멈추고 확인된 분리판과 실행 도구를 마감했다. **분리판 준비·검증 완료, 실제 커밋은 사용자 실행 대기**다.

Noline 저장소에서 실행할 명령은 다음과 같다. 변경 조각을 사용자가 선택하는 단계는 없다.

```bash
python3 /tmp/noline-stage2-commit/commit.py
```

같은 폴더의 `stage-two.patch`와 `manifest.json`이 적용할 내용과 파일 범위를 제공한다. 스크립트는 준비한 patch를 index에 적용해 커밋하며 root 작업 파일을 분리판으로 덮지 않는다. 실제 실행 성공 뒤 Git commit hash와 포함 범위를 확인해야 커밋 완료로 판단할 수 있다. 이 기록 작성 시점에는 commit hash가 없고 push·배포도 하지 않았다.

## 근거 범위

사용자 원문 순서와 Git 쓰기 실패, Main의 수동 선택 명령과 정정은 Main이 이번 기록 과업에 전달했다. 기록 담당은 분리 manifest·engine의 lastSyncedAt/수신 호출·최종 831개·독립 41개 실행 로그와 기존 기록 색인을 직접 확인했다. 후속 대화 전체를 별도 rollout에서 복원하거나 기록 담당이 제품 검사·Git 커밋을 실행한 것으로 기록하지 않는다.
