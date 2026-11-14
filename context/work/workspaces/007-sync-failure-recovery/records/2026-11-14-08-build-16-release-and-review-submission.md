# 1.1.2(16) 배포와 Apple 심사 대기 접수

**2026-11-14 18:57 KST, Noline 1.1.2 빌드 16이 Apple `WAITING_FOR_REVIEW`로 접수됐다.** 접수 ID는 **62c23b7e-4cb5-47ad-8234-ad5e069ef37d**, Apple 반환 제출 시각은 **2026-11-14T09:57:03.024Z**다. 심사 통과 후 자동 공개(`AFTER_APPROVAL`) 설정이며, 승인·실제 공개는 아직 확인하지 않았다. [빌드 15 진행 기록](2026-11-14-06-production-release-in-progress.md)의 미제출·003-04 미수정 표시는 당시 이력이다.

## 배포판과 포함 범위

**319b4903**은 1.1.2의 빌드 번호를 16으로 올린 별도 커밋이다. 앞선 **c8004d6e**는 003-05의 공유 지도 수정·검사·문서 5파일이며, **f5cb9564**는 003-04의 정리 예약 취소·삭제 직전 확인 2파일이다. 철회한 4b743e0f를 다시 포함한 것이 아니다. 변경 이유·만료 정책 복원·native 지도 근거는 [003 수정 기록](../../003-bug-investigation-and-fixes/records/2026-11-14-01-reactivation-and-shared-city-map-fixes.md)이 소유한다.

사용자 승인에 따라 c8004d6e·319b4903을 main에 push하고 원래 작업 폴더도 맞췄다. **008의 Drawer·Pressable 등 미커밋 변경은 배포에서 제외하고 보존했다.** 깨끗한 배포 체크아웃의 client **78묶음 920/920**이 통과했다. 기록 담당자는 `/private/tmp/noline-release-16-client-tests.log`의 최종 결과를 직접 대조했다.

DB는 빌드 15 때 먼저 적용한 `field_edits`·`legacy_update_holds` 구조를 사용하며 이번 지도·예약 수정 때문에 새 DDL을 적용하지 않았다. Render 배포 **dep-dbs24ne8bjmc73e1r0sg**는 319b4903으로 live가 됐고 API 정상 응답을 확인했다. [Render 배포](https://dashboard.render.com/web/srv-d5v1siggjchc7390ietg/deploys/dep-dbs24ne8bjmc73e1r0sg). 이 health 확인을 앞선 운영 API 10개 전체 재실행으로 표현하지 않는다.

## 빌드·업로드·심사 제출 결과

| 단계 | 확인 결과 |
| --- | --- |
| EAS 빌드 | **6c702d7d-ccb9-438c-95fc-312a761ad3ef**, 1.1.2(16), 319b4903. 생성 성공 |
| Apple binary 업로드 | **5589addc-45a2-4fe3-b48c-4472f3e283c3**, 완료 |
| Apple 빌드 | **e67ef423-377b-4743-b35a-1b2aeacbc82e**, 처리 `VALID`·내부 `IN_BETA_TESTING` |
| App Store 초안 | 기존 빌드 15 대신 16을 선택·저장하고 한국어 안내에 공유 지도 수정을 추가 |
| 사용자 최종 승인 | 원문 4486행 “하라고 빨리 제출도 다” |
| Apple 심사 접수 | **WAITING_FOR_REVIEW**, 접수 ID 62c23b7e-4cb5-47ad-8234-ad5e069ef37d |
| 심사 승인·공개 | 미확인. 승인 후 자동 공개 설정 유지 |

[EAS 빌드 16](https://expo.dev/accounts/myeongyeon/projects/noline/builds/6c702d7d-ccb9-438c-95fc-312a761ad3ef), [TestFlight 빌드 16](https://appstoreconnect.apple.com/apps/6757186547/testflight/ios/e67ef423-377b-4743-b35a-1b2aeacbc82e), [App Store 상태](https://appstoreconnect.apple.com/apps/6757186547/distribution/ios/version/inflight)에서 이어 확인한다.

첫 제출 검사는 한국어 앱 설명·키워드·지원 URL 공란으로 거절됐다. Main은 현재 공개판의 같은 언어 값을 복원한 뒤 다시 제출해 접수를 확인했다. 이는 binary 실패나 Apple 심사 거절과 구별한다. 최종 상태는 API 응답과 Main의 후속 읽기 전용 재조회에서 일치했다.

## 저장한 한국어 업데이트 안내

> 일정과 경비를 더 안정적으로 저장하고 동기화해요.
>
> • 여러 기기에서 같은 기록을 수정할 때 항목별 변경을 반영하도록 개선했어요.
> • 이전 버전에서 보내지 못한 수정 내용을 확인하고 다시 저장할 수 있어요.
> • 연결이 불안정하거나 서버 응답이 늦어도 최신 입력과 미전송 기록을 더 안전하게 보존해요.
> • 일정 변경 시 필요한 구간의 이동 경로를 다시 준비하도록 개선했어요.
> • 같은 도시의 여행 중 하나를 오프라인에서 해제해도 다른 여행에서 저장한 지도를 계속 볼 수 있어요.

## 확인 범위와 남은 외부 결과

iOS 시뮬레이터의 실제 Mapbox·SQLite에서 B의 지도 보존, 마지막 반납 후 pack 삭제, 네트워크 차단 상태의 도로·마커 표시를 확인했다. 큐가 비는 시점은 시험 데이터로 만들었다. **빌드 16의 물리 iPhone, 실제 운영 재전송, 새 모바일 Sentry 수신은 이번 native 검증 범위 밖이다.** 빌드 15 사용자 영상의 수정값 서버 반영도 별도 근거로 유지한다.

이번 배포 요청은 운영 반영·빌드 16 업로드·Apple 접수 확인까지 완료했다. 남은 외부 결과는 심사 처리·승인과 실제 공개다. Work 007·003의 모든 Ticket 완료나 출시 완료로 확대하지 않는다.

근거는 Main chat `01a1d5a7-70e0-72d3-9e79-099d6b52174a`의 동일 rollout 원문이다. 배포 승인 4104행, 커밋·push·920개 검사 4191〜4225행, Render 4329행, 빌드·안내 저장 4471행, 최종 승인 4486행, 필수 정보 복원 4508〜4522행, Apple 접수 4531행과 기록 요청 4541행을 대조했다. Main의 후속 재조회 보고도 반영했다. 기록 담당자가 Apple API를 다시 조회한 것은 아니며 비밀값·사용자 행 원본은 기록하지 않았다.
