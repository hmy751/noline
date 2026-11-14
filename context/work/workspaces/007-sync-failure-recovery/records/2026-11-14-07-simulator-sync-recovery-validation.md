# 시뮬레이터에서 동기화·보류 복구를 직접 확인했다

2026-11-14. 사용자가 현재 작업을 시뮬레이터에서 직접 시험하도록 요청해, Main이 기존 개발 앱과 실제 로컬 API·SQLite·전용 PostgreSQL DB를 연결하고 저장·재전송·충돌·복구 UI·삭제 종결을 확인했다. 아래 실행 결과가 통과했으며 제품 코드 수정이나 커밋은 하지 않았다. 별도 세션의 [운영 반영·iOS 빌드 진행](2026-11-14-06-production-release-in-progress.md)과 다른 검증이다.

> 사용자: “너는 지금 우리 작업 한번 시뮬레이터로 테스트할수 있는거 직접 해봐”

## 실행한 판본과 환경

기록 시점 저장소 HEAD는 **ef6838f2fd491c238660f16d6155b329fd2ca197**였다. Noline-T07-T12의 iOS26 시뮬레이터에서 기존 `com.noline.dev` native 설치본에 현재 작업 트리의 JS를 Metro8081로 공급했다. native binary를 새로 빌드하지 않았고 미커밋008 Drawer·Pressable도 함께 사용했다. 따라서 이 결과를 깨끗한 출시 빌드의 확인으로 올리지 않는다.

기존 개발 DB에는 복구용 테이블이 없어 같은 로컬5432 개발 컨테이너 안에 전용 `noline_sim_20261114` DB를 만들고 localhost3000 API를 연결했다. 다른 세션의 운영 반영과 기존 개발 데이터를 시험 대상으로 쓰지 않았다. 아래 네트워크 차단은 앱의 offline 감지 상태 주입 또는 실제 로컬 API 중단이며, 실제 OS 망 단절은 시험하지 않았다.

## 실제 동작과 결과

| 시험 | 방법과 확인 결과 |
| --- | --- |
| 오프라인 저장·재시작 | offline 감지 상태를 주입한 뒤 실제 repository로 금액10 경비를 Local에 저장해 CREATE PENDING1개를 확인했다. API를 실제 중단하고 앱을 stop/launch한 뒤에도 금액10과 FAILED1개·retryCount1이 남았다. |
| 재연결·응답 유실 | 서버를 다시 연결한 sync는 completed·queue0이었다. 금액20 저장 뒤 서버가 처리한 PUT 응답을 interceptor에서 한 번 유실시켜 FAILED1개를 확인했고, 재전송·pull 뒤20.00·queue0으로 수렴했다. |
| 다른 필드의 동시 변경 | Local 금액30 pending과 API로 넣은 다른 요청의 transportation 분류를 pull한 결과, 금액30·transportation·queue1이 함께 남았다. |
| 미전송 사본 정리 보호 | cleanupPending fixture를 설정해 실제 정리 작업을 실행했지만 pending 경비는 삭제되지 않았다. 시험 뒤 해당 fixture를 해제했다. |
| 응답 처리 중 후속 저장 | 앞선 PUT 응답 처리 중 금액35를 저장했다. 늦은 응답 뒤35·queue1이 보존되고, 다음 push/pull 뒤35.00·transportation·queue0이 됐다. |
| 구버전 입력 보류 | 편집 표식 없는 실제 PUT에409가 반환됐다. 같은 payload를 반복해도 보류1개였고 현재35.00을 덮지 않았다. 보류 원문은 amount99·USD·shopping이었다. |
| 선택 복구 UI | 앱에서 수정 확인을 열고 닫고 다시 열어 보류 입력 보존을 확인했다. 분류만 선택해 저장하니 금액35.00을 유지하고 shopping으로 바뀌었다. 실제 큐 payload에는 category·edit만 있었고 미선택 amount는 없었다. 동기화 뒤 보류0·queue0이었다. |
| 현재 값 유지 UI | 두 번째 amount88·food 보류에서 현재 값 유지를 누르고 native 확인 alert를 탭했다.35.00·shopping을 유지했고 보류0·queue0이었다. ACK행2개는 acknowledged:true로 남는 것이 정상이며 미완료 ACK는0이었다. |
| 삭제 종결과 뒤 요청 | 서버에서 실제 DELETE한 항목의 pending UPDATE를410으로 종결한 뒤 다음 CREATE가 진행했다. 삭제 표식이 반영되고 뒤 경비1.00은 살아 있으며 queue0이었다. |

핵심 실행은 앱 내부 실제 repository·sync 함수를 호출하는 스크립트와 복구 화면 직접 조작을 조합했다. 모든 흐름을 화면 입력만으로 실행한 것은 아니다. 다른 기기의 변경은 두 번째 물리 기기 대신 API 요청으로 재현했다.

## 근거와 확인 한계

실행 작업 파일은 `/tmp/noline-sim-20261114/`에 두었고, 보존할 근거는 [실행 산출물](../../../../../artifacts/007-simulator-20261114/)에 복사했다. 대응 JS와 `offline-create.json`, `restart-check.json`, `retry-loss.json`, `conflict.json`, `legacy.json`, `recovery-check.json`, `keep-current-result.json`, `deletion.json`이다. 기록 담당자는 이8개 JSON의 done:true·관찰값과 대응 JS의 저장 보존·FAILED 유지·pending merge·늦은 ACK·선택 필드·삭제 후 큐 진행 assertion을 직접 대조했다. 이 문서의 표에 재접근 경로가 사라져도 확인 내용을 재검토할 최소 결과를 남겼다. 인증 파일은 산출물에 복사하지 않았다. [선택 전 복구 화면](../../../../../artifacts/007-simulator-20261114/recovery-before-selection.jpg)도 보존했다.

최종 서버 직접 대조인 [server-final.json](../../../../../artifacts/007-simulator-20261114/server-final.json)은 시험 경비35.00·shopping, 삭제 시험의 deleted_at, 뒤 요청1.00, serverHoldCount0을 확인한다. 다시 앱을 stop/launch한 [restart-final.json](../../../../../artifacts/007-simulator-20261114/restart-final.json)에서도 sync completed·queue0·Local 보류0·acknowledged:true2개·미완료ACK0과35.00·shopping이 유지됐다. 삭제 행의 Local 금액2와 서버 금액1은 미전송 수정이 삭제 확정으로 종결된 결과다. 해당 행은 삭제 표식으로 숨겨지므로 활성 행의 값 일치 확인과 구별한다.

Main이 직접 확인한 [최종 경비 화면](../../../../../artifacts/007-simulator-20261114/final-expenses.jpg)에는 복구 시험 USD35.00·shopping과 뒤 요청1.00이 보이고, 수정 확인 버튼과 삭제 시험 행은 보이지 않았다. 시험을 끝낸 뒤 전용 앱을 멈추고 Main이 시작한 API3000·Metro8081을 종료해 해당 listener가 없음을 확인했다. 전용 DB·시뮬레이터 시험 데이터는 보존했고 원래 개발 DB는 수정하지 않았다. 별도 기본 iPhone15 Pro의 로그인 상태도 signed-in임을 확인했다.

초기 실행의 fixture boolean mapping, Hermes async eval, 이미 객체인 payload에 JSON.parse를 적용한 실패는 시험 준비 코드를 고쳐 해결했다. 이를 제품 결함이나 제품 수정으로 세지 않는다. ACK행의 물리 삭제를 요구하지 않고 acknowledged:true와 미완료0을 구별했다.

이번 실행은 실제 구버전 binary에서 새 앱으로 업데이트, 물리 기기, 실제 OS 네트워크 단절, 운영 환경, Sentry 실전송을 확인하지 않았다. 별도 배포 세션이 확인한 운영·Sentry 결과와 섞지 않으며, 003-04의 재활성화 후 옛 정리 예약 문제까지 해결됐다고 보지 않는다.

기록 근거는 Main chat `01a1d562-81a1-7e43-8a27-06a4e130be9d`에서 직접 읽은 이번 요청·진행 발화와 앞선 배포 주의사항 발화, 위 실제 파일, Main이 전달한 UI 조작·환경 설명이다. 현재 대화 전체를 직접 읽거나 기록 담당자가 시뮬레이터를 실행한 것으로 주장하지 않는다. 별도 배포 담당자의 현재 상태·기록은 보존했다.
