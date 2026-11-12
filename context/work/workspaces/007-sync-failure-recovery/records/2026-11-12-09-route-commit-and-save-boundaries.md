# 경로 변경의 분리 커밋과 저장 계층의 준비 책임 정리

경로 두 파일의 Personal 재검토·이름/타입 정리와 경로 코드 설명 이후, 사용자는 관련 코드만 커밋하도록 요청했다. 미커밋 1단계 저장 코드와 연결되어 있음을 확인하고 “직전 경로 처리 변경만 분리”라는 사용자 선택에 맞춰 커밋했다. 이어 일정·경비 저장의 Local·Repository·API·Router 관심사 전반을 검토해 필요한 정리를 승인받았다. **경로 분리 커밋은 완료했고, 이번 저장 경계 정리도 구현·전체 client 검사·최종 독립 검증 완료**이다.

## 분리 커밋의 실제 범위

직전 후속 Personal 검토는 경로 두 파일에서 필요한 구간·재사용 DB 행·현재 일정·유지할 ID 집합을 이름으로 구별하고 readonly 입력·기존 Route[] 반환과 import/단계 배치를 정리했다. 조건·쿼리 시점·트랜잭션·세션·비동기 순서는 유지했고 관련 24개·lint/format·기존 타입 7오류를 확인한 범위였다.

사용자 요청대로 경로 엔진·지도·migration·호출부와 관련 검사 **15개 코드/테스트 파일만** `a527e977` (`fix(client): 변경된 일정 구간만 경로를 갱신한다`)로 커밋했다. 문서와 다른 1〜7단계 변경은 포함하지 않았다. 기존 커밋의 저장 구조에 경로 변경만 얹은 분리판을 임시 복사본에서 검증해 **66묶음 726개**가 통과했고 lint 오류 0·기존 타입 7오류였다는 Main 보고를 남긴다. 기록 담당자는 실제 commit의 15파일 stat를 대조했다. push는 하지 않았다.

이 726개는 분리 커밋 자체의 근거다. 아래 현재 작업 폴더의 저장 경계 변경과 전체 검사를 같은 판본으로 합치지 않는다. 앞선 기록의 “커밋 미실행”은 당시 범위이며 현재는 경로만 커밋했고 이번 저장 경계 변경은 미커밋이다.

## prepareEdit 하나가 아니라 전체 관심사를 대조

사용자는 `updateExpenseLocal`과 fetch 쪽 prepareEdit 중복을 질문한 뒤 “prepare 말고도 local repository 부분등 관련된데 좀 봐봐”라고 범위를 명확히 했다. Main과 high 독립 검토자는 전체 저장 경계를 비교했다. 검토 결과 뒤 “필요한 부분만 정리해줘. 수정해서 검증하고 다시 설명해줘”라는 승인으로 구현했다.

앞선 `prepareEdit`는 기존 표식이 있으면 재사용했으므로 중복 발급 버그는 아니었다. 다만 Repository·Local·API가 모두 표식 없는 입력의 새 발급을 책임지는 계약이었다. 실제 앱의 하위 Local/API UPDATE 호출자는 Repository뿐이고, 동기화 재전송은 저장된 큐 원문을 별도 전송하므로 하위 발급 기능을 계속 유지할 이유가 약했다.

새 내부 `PreparedEdit<T>`는 edit을 필수로 표현한다. Repository가 입력을 검증하고 표식을 준비한 Promise를 기존 Router에 넘기며, Local/API는 준비된 입력을 받는다. Local의 중복 준비 Promise·발급·대기는 제거했다. Repository의 제출 시점 준비와 여행 작업 등록 순서는 유지한다. API는 전송 직전 schema.parse·HTTP·응답 검증·표식 관찰을 유지한다. 내부 edit 필수 타입은 구버전 wire schema의 edit optional을 바꾼 것이 아니다.

하위 함수를 표식 없이 직접 호출해 발급까지 기대하던 과거 검사는 준비된 fixture를 전달하도록 바꿨다. 이 변경은 실제 앱 호출 경계 조사에 근거한 **내부 입력 계약의 축소**다. 검사 기대만 편의상 지운 것은 아니며 Repository의 Local/Remote 불완전 그룹 거절·시점·기존 표식 재사용과 API 전송 검증은 계속 검사한다. 하위 Local이 임의 외부 입력을 새로 준비하는 공개 경계라고 설명하지 않는다.

## 유지한 책임과 정리한 위치

Local의 소유/활성 행 접근·SQLite 표현 변환·행 변경과 큐 추가·반환 변환은 같은 트랜잭션에 유지했다. DB 행과 wire payload는 표현이 다르므로 한 객체로 무리하게 합치지 않았다. Router의 여행 작업 순서는 활성화/수정 실행을, Local 트랜잭션은 행/큐 원자성을 맡아 서로 대체하지 않는다.

Repository는 같은 일정·경비 수정을 Local/Remote로 제공하며 직접 수정 실패 처리를 조합한다. API로 SQLite 보류·삭제 책임을 옮기거나 화면마다 처리하지 않는다. 대신 `edit-stamp/legacy-conflict.ts`의 `retainDirectConflict`를 `sync/direct-update-failure.ts`의 `handleDirectUpdateFailure`로 옮겨 실제 책임인 구버전 충돌 입력 보관·삭제 증거 확인·Local 반영이 이름과 위치에서 보이게 했다. 동작 내용은 유지했다.

생성·삭제 data 훅 네 곳도 수정 훅과 같은 기존 `cancelAndInvalidateQueries`를 사용한다. 캐시 없는 첫 조회가 대기 중일 때 invalidate만으로 옛 요청을 공유하던 회귀를 실제 QueryClient와 실제 CRUD 훅에 연결했다. 변경 전 새 회귀 8개가 실패했고 적용 뒤 총 13개가 통과했다는 담당 결과다. 새 공통 CRUD 계층은 만들지 않으며 갱신 실패가 저장 성공을 실패로 바꾸지 않는 기존 유틸 계약을 유지한다.

## 최종 검사와 완료 범위

Main의 관련 6묶음 116개 뒤 추가 4개까지 전체 client **77묶음 892/892**에 포함되어 통과했다. 관련 수와 전체 수를 합산하지 않는다. 기존 타입 오류 7개는 유지하며, 타입 확인용 파일의 새 lint 경고는 export 함수로 정리해 제거했다. 최종 Main lint와 독립 15파일 lint는 모두 오류/경고 0이었다. 독립 검증자는 제품 수정 없이 코드·기존 검사 근거를 대조하고 저장 제출/조회 갱신 2묶음 **36/36**을 직접 재실행해 통과했다. 전체 892개를 재사용하는 범위가 적절하고 타입 오류도 기존 7개와 동일하다고 반환했다. high 첫·후속 검토의 필수 문제 없음과 이 독립 재실행을 구별한다. 36개는 전체에 포함되는 관련 사례로 합산하지 않는다. Main은 **이번 저장 경계 한정 수정·검증 완료**를 판정했다.

이번 변경은 행+큐 원자성·FIFO·저장 시각·표식 재전송·그룹·구버전 wire 정책을 바꾸지 않았다. 네이티브·서버를 이번에 재실행하지 않았고 기존 native Mapbox/live Directions·수정창 실행 확인 한계도 유지한다. Project의 내부 입력·CRUD 조회 갱신 계약·오류 처리 경로와 이름·형성 이유 3파일은 Main이 반영 완료했고 기록 담당자는 제품·Project를 수정하지 않았다. 이번 저장 경계 변경의 커밋·push·배포는 미실행이다.

## 원문과 확인 근거

같은 Main 대화 `01a1c4a4-3065-7b32-8404-2c5066fcbaf9` 원문 `/Users/hammyeong-yeon/.codex/sessions/2026/11/10/rollout-2026-11-10T17-47-37-01a1c4a4-3065-7b32-8404-2c5066fcbaf9.jsonl`에서 **8453〜9107행과 후속 9108〜9179행**을 읽었다. 8605행 커밋 요청과 8662행 경로만 분리 선택, 8828·8857행 관심사 범위, 8963행 수정 승인을 구별한다. 9104행은 검사 통과와 독립 검증 진행을 구별한다.

실제 변경 입력은 `/tmp/noline-save-boundary-files.txt`, 이전판 접근점은 `/tmp/noline-save-boundary-before`다. 기록 담당자는 현재 Repository·Local/API·PreparedEdit·direct-update-failure·CRUD 네 훅·수정 검사 실물과 `/tmp/noline-save-boundary-full.log`·`/tmp/noline-save-boundary-types-final.log`를 읽었다. 제품 검사를 재실행한 것은 아니다. 분리판 726·CRUD 수정 전 8실패/후 13통과·관련116은 Main/담당 보고로 출처를 구별한다. 최종 추가 근거 `/tmp/noline-save-boundary-independent-verification.log`의 36개와 `/tmp/noline-save-boundary-independent-lint.log`·`/tmp/noline-save-boundary-lint-final.log`의 오류/경고 없는 결과를 직접 대조했다. 9172행의 Main 최종 보고 및 이후 연결된 Project 완료/동작 없는 주석 정정도 구별해 반영했다. 생성 일정 훅의 경로 조회 주석은 실제 저장 경로 재조회와 별도 경로 준비 흐름에 맞게 정정했으며 동작 변경은 아니다.

파일 이동으로 끊긴 -02 기록의 직접 충돌 코드 링크는 당시 판단 본문을 보존하고 현재 direct-update-failure 경로로만 수선했다. 원래 경로와 수정 이유를 그 표 아래 주석에 남겼다. 과거 분석을 최신 결론으로 덮지 않고 코드 재접근을 복구한 정정이다.

기록 반영과 이동 링크 수선 뒤 harness를 직접 실행해 기존 과거 링크 문제 64개만 남는 것을 확인했다(`/tmp/noline-save-boundary-record-harness.log`). 이번 이동의 새 끊긴 링크 1개는 해소됐으며 문서 차이 검사도 통과했다.
