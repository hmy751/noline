# 3단계 재검토 — 활성화 반환의 실제 소비자와 조회 보호의 표현

사용자가 3〜7단계를 한꺼번에 처리하지 말고 단계별로 다시 진행하도록 요청했다. 이번에는 **3단계의 보완 검토·수정·독립 검증을 완료**했으며, 결과를 설명한 뒤 멈춘다. 4〜7단계의 보완 재검토는 후속으로 남긴다. [앞선 완료 판단 정정](2026-11-13-07-review-depth-and-completion-correction.md)을 취소하거나 이번 결과를 다른 단계의 충분성으로 확대하지 않는다.

## 요청과 이번 판단의 출발점

현재 대화의 사용자 원문은 다음과 같다.

> 그럼 3\~7 단계들 다시 진행 해봐 단계별로 순차적으로 한번에 하지말고

Main은 이번 3단계 결과를 전달하고 4단계까지 한 번에 처리하지 않겠다고 답했다. [1단계 실행 합의](2026-11-12-12-workflow-application-agreement.md)와 승인된 2단계 판단을 실제 소비자·표현·검사에 대조했다. 늦은 응답이 현재 사본을 덮지 않게 하는 보호와 조회 중 commit한 변경을 다음 pull에서 놓치지 않는 결과를 유지하면서, 그 결과에 필요하지 않은 반환·재조회까지 검사 때문에 보존하고 있지는 않은지 살폈다.

## 활성화의 반환 책임을 실제 사용에 맞췄다

[useActivateTrip](../../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)은 서버 본문을 수락·저장한 뒤 일정과 경비를 다시 읽어 반환했다. 그러나 생산 소비자는 이 배열을 쓰지 않았다. [TripsSection](../../../../../apps/client/src/screens/HomeScreen/TripsSection.tsx)의 성공 callback은 반환 인자를 받지 않고 진행 상태를 바꾸며, hook 자체의 성공 처리는 `tripId`와 `alreadyActivated`로 조회를 갱신한다. [경로 준비](../../../../../apps/client/src/shared/services/directions/route-downloader.ts)도 반환 배열 대신 `tripId`로 현재 저장소를 읽는다.

반환 배열을 요구한 것은 일부 검사였다. 이 검사를 그대로 유지할 계약으로 삼으면 실제 사용자에게 필요한 저장·최신 조회 보호와, 소비자가 없는 반환을 혼동하게 된다. Main이 이 차이를 발견했고 읽기 전용 독립 reviewer도 소비자 대조와 제거에 동의했다. 두 재조회와 `readVisibleSchedules`를 제거하고 활성화 결과는 `{ tripId, alreadyActivated: false }`로 줄였다. transaction 안의 삭제 분기 `null`과 마지막 세션 검사는 남겼고, 바깥의 삭제 실패 처리·백그라운드 경로 준비 이후 그 활성화 결과를 반환한다.

검사는 반환 배열 대신 `getSchedulesLocal`·`getExpensesByTripIdLocal`로 실제 저장 후 읽히는 결과를 확인하도록 바꿨다. 날짜 계약은 DB에 저장된 date-only 값을 확인한다. 최신 응답·후속 입력·삭제·새 항목과 만료일을 보존하는 기대는 유지했다. 제품 요구를 줄여 검사를 통과시킨 것이 아니라 생산 소비자에게 없는 반환 기대와 필요한 저장·읽기 결과를 구별한 변경이다.

## 더 나누지 않은 이유와 이름·입력 계약 정리

pull의 세션 검사, 준비 ID Map, 현재 준비 조회와 checkpoint 조건을 전부 helper로 나누는 대안은 채택하지 않았다. 이들은 요청 때의 사본과 반영 때의 사본이 같은지를 한 transaction에서 연결한다. 전면 분리는 새로운 전달 계약과 호출 간 상태 재조립을 늘리므로, 관련 순서와 조건이 함께 보이는 현재 본문을 유지했다. DB 원자성 자체가 호출자의 세션이나 사본 준비 수명까지 보장하지는 않으므로 해당 재검사도 남겼다.

대신 실제 의미가 드러나게 한정 정리했다. engine 조회 결과의 일반 `id`는 `preparationId`로, storage의 시각 인자 `date`는 `serverTime`으로, 서버의 `changedSinceCursor`는 구버전 timestamp 경로도 포함하는 `changedSincePreviousPull`로 바꿨다. storage의 여행 ID 입력은 변경하지 않는 계약에 맞춰 `readonly`로 받는다. 서버 SQL·snapshot·조회 조건은 바꾸지 않았다. 이름·배치 정리는 줄 수 감소나 helper 수 자체를 목표로 삼은 것이 아니다.

Main은 설치본 client Drizzle 0.30.10·expo-sqlite 14.0.6과 서버 Drizzle 0.29.5를 직접 확인하고 PostgreSQL 14 snapshot·repeatable-read와 Drizzle transaction 공식 설명을 대조했다고 보고했다. client 설치본은 저장소 루트에 있어 reviewer의 app 하위 경로 확인 제한을 Main이 보완했다. 이 한계가 미확인으로 남은 것으로 기록하지 않는다. [선행 3단계 근거](2026-11-13-05-stage-three-pull-review.md)의 DB 원자성과 caller 세션·사본 수명 구별을 이번에도 유지했다.

## 이번 변경과 확인 범위

추가 delta는 제품 4파일(`useActivateTrip.ts`, `engine.ts`, `storage.ts`, 서버 `sync.ts`)과 검사 2파일(`response-freshness.test.ts`, `temporal-local-contracts.test.ts`)이다. 시작 시 기존 dirty 90파일과 선행 단계 변경을 이번 추가 6파일로 오인하지 않는다. Main은 시작 hash와 대조해 이 6파일 외 기존 내용 변경이 없음을 확인했다. 비교 patch는 `/tmp/noline-stage3-rereview.patch`, 시작 사본은 `/tmp/noline-stage3-rereview-before`에 있다.

Main 자기 확인은 변경 전후 각각 client 4묶음 115개 통과다(`/tmp/noline-stage3-rereview-before-tests.log`, `/tmp/noline-stage3-rereview-after-tests.log`). 이는 같은 보존 계약의 전후 결과이며 합산하지 않는다. lint는 오류 0·기존 async assertion 경고 3개(`/tmp/noline-stage3-rereview-lint.log`), client 타입 검사는 전후 파일 diff 없이 기존 오류 7개가 같다(`-before-types.log`, `-after-types.log`). 서버 타입 검사(`-server-types.log`)와 6파일 포맷 검사는 통과했다고 Main이 보고했다. 위 축약 로그명은 모두 `/tmp/noline-stage3-rereview` 접두사를 사용한다. 독립 verifier는 최신 delta·실제 소비자·검사 assertion과 위 실행 로그를 직접 대조해 이번 범위의 요구 충족 근거가 충분하다고 판단했다. 세션 정상·삭제 rollback, 준비 ID·지연 pull·checkpoint 원자성, 조회 갱신과 Local 읽기 결과를 확인했고 기존 115개 전후 실행 근거를 재사용했다. 별도 재실행이나 새 probe는 없으므로 독립 검사 수를 추가하지 않는다. client 타입 전후 동일 7개·lint 결과도 직접 확인했다는 반환을 받았다. Main이 이 결과를 채택해 이번 3단계 보완 범위를 완료 판정했다.

이번에는 제품 코드의 기존 115개 보존 검사와 관련 독립 검증을 다루며 문서 인수 실험을 추가하지 않는다. native·실기기·배포나 사용자 수락을 확인한 결과는 아니다. 3단계 결과만 설명하고 멈추며 4〜7단계 보완 재검토는 아직 하지 않았다.

## 원문과 기록 확인

기록 담당자는 현재 Main rollout `/Users/hammyeong-yeon/.codex/sessions/2026/11/13/rollout-2026-11-13T02-05-41-01a1d0b8-e751-78a3-8a4a-7bac4bd0bb96.jsonl`의 사용자 요청 1929행부터 검증 근거·4〜7단계 미착수 안내 2182행까지의 user/assistant 원문, 위 patch·자기검사 로그와 실제 소비자를 읽었다. 검토·채택 이유와 설치본 확인은 Main 보고와 연결했으며 제품 검사를 기록 담당자가 재실행하지 않았다.

직전 정정 기록·안내 9파일은 `945922fe`로 커밋됐음을 확인했다. 최신 제품 커밋은 `44d2a5ef`이며 이후 제품 변경은 workingtree에 남아 있다. 이번 기록·제품은 미커밋이고 스킬·Personal·Project·다른 Work·과거 날짜별 기록은 수정하지 않았다.
