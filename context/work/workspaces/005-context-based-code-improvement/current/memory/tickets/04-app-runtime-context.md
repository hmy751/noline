# 04 — 앱 실행·세션·데이터 보존 Context

## 맡은 결과와 범위

앱 준비와 인증 복원, 로컬 접근, DB 작업, 세션 변경과 종료를 관련 개발자가 하나의 흐름으로 이해하고 바꿀 책임을 찾을 수 있게 한다. DB 준비 실패 재시도와 인증 복원 실패, 재인증 중 로컬 이용, 토큰 저장과 로그인 전체 절차, 진행 중 sync/cleanup/DB 작업 대기를 함께 설명한다.

새 인증 정책·DB migration·전체 sync/cleanup 개선을 구현하지 않는다. 그 부분의 미완료가 현재 설명의 한계에 영향을 주면 계약과 지원 범위를 구별해 본문에 남긴다.

## 실행 맥락과 접근

기존 current/architecture의 앱 책임 설명을 보완하고, 인증·앱 수명에 기존 상세 Owner가 충분한지 확인해 필요한 주제 본문을 구성한다. 원자성 compact rule은 유지하며 실제 DB 실행·중단의 관계와 상세 설명 경로를 연결한다. 최초 startup/auth 기록과 후속 재로그인·종료 결정을 현재 구현에 대조한다.

우선 AppInitialization, Root의 navigation/인증 후 effects, auth Store와 login/logout/session-lifecycle, DB index/utils, sync lifecycle과 cleanup pause를 따라간다. 현재 코드와 실제 소비자가 답해야 하는 관계를 먼저 잡고 최종 파일 분할을 정한다.

- [앱 준비·실패·책임 선택](../../../../002-code-readability-refactoring/records/2026-09-18-02-app-initialization-and-style.md)
- [후속 인증 책임과 보존](../../../../002-code-readability-refactoring/records/2026-09-21-04-auth-responsibilities-and-regression-fixes.md)
- [실제 앱 준비](../../../../../../../apps/client/src/application/AppInitialization.tsx)
- [세션 변경 조율](../../../../../../../apps/client/src/shared/services/auth/session-lifecycle.ts)
- [DB 준비·직렬 실행](../../../../../../../apps/client/src/shared/db/index.ts)
- [현재 구조 설명](../../../../../../project/current/architecture.md)

## 완료 조건과 확인 방법

- DB 실패, 복원 실패, 재인증 필요의 차이와 앱 진입·Local 이용을 본문에서 설명한다.
- 로그인 완료와 저장, 로그아웃·탈퇴의 데이터 정리 및 실패 차이, 작업 종료와 sync 성공의 범위를 구별한다.
- DB와 sync/cleanup의 순서·대기·새 작업 차단을 관련 구현·검사 본문에 대조하며 전체 엔진 보장으로 확대하지 않는다.
- Project 입구와 client의 실제 작업 진입에서 본문을 찾아 대표 변경의 담당 위치·보존 조건·남은 한계를 설명할 수 있다.

## 현재 상태와 실제 결과

실행 범위를 구성했다. 앞선 전체 대응 조사에서 관련 기록·Context·코드 일부를 확보했다. 본문 보완과 대표 읽기 확인은 아직 수행하지 않았다. 실제 편집 시 현재판과 후속 결정을 확인하고 결과를 이 본문에 갱신한다.
