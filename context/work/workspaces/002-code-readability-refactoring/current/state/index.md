# 현재 상태와 다음 행동

## 현재 위치

제품 작업 브랜치는 `refactor/app-startup-lifecycle`이다. 일정 생성의 단일 초안 수명·기능별 정책 소비와 Places 서비스 경계 정리를 적용했고, 사용자는 코드와 대화 기록의 커밋을 승인했다. 전체 목표와 남은 범위는 [Ticket 06](../memory/tickets/06-app-startup-lifecycle.md), 선택 이유·평가 기준·실행 근거는 [후속 기록](../../records/2026-10-02-01-schedule-create-boundaries-and-verification.md)에서 이어간다.

## 현재 결과와 확인 범위

검색·직접 입력·장소 변경은 같은 초안을 사용한다. 생성은 검증된 상세 장소를 받고, 수정의 기존 실패 호환값은 별도 adapter에 있다. 검색 지도 후보와 초안의 채택 장소를 구분한다. 초안 소유를 폼 내부로 옮기지 않았으며 저장은 기존 Entity/Repository/Router 경계를 유지한다.

최신 worker의 전체 client 검사는 45 suites / 443 tests 통과다. schema build·형식 검사 통과, 기존 충돌 규칙을 제외한 lint 오류 0·지도 경고 1, 기존 타입 오류 3건 유지다. Main은 실제 앱 재실행 후 online 표시와 Louvre 검색 결과 5개·지도 마커를 확인했다. 실제 작성 중 연결 전환·picker·오프라인 저장까지 검증한 것은 아니다.

앞선 조회 조합 `b4db89d`, 다른 소비자 `eec00e1`, 2-A/2-B의 Query 복귀 기준과 2-C 복구 토스트를 추가하지 않는 선택은 유지한다. 자동 Maintain 실패 뒤 누락된 대화는 이번 명시적 요청으로 수동 기록하며 자동 lifecycle 복구를 뜻하지 않는다.

## 다음 행동

실제 앱에서 하나의 일정을 작성하며 키보드·날짜/시간 picker, 장소 변경 검색과 작성 복귀, 연결 전환 중 초안 유지·활성 여행 오프라인 저장·목록/상세 재진입을 확인한다. 앱은 활성 파리 여행의 Louvre 검색 결과 화면까지 준비했으며 사용자 검사 결과는 아직 받지 않았다.

여행 기간 밖 날짜의 접근과 저장 후 과거 목록+500ms 경로 준비·Remote/경로의 정상 0 좌표 문제는 별도 남는다. 생성 검색의 부분 성공 UX 및 수정 검색의 legacy fallback·전체 실패 안내는 후속 판단 대상이다. 현 구조의 품질은 상태 수명·책임·타입 보장과 실제 변경 부담으로 평가한다.

## 전체 완료와 남은 경계

Ticket 01~05의 수락은 각각의 기존 테스트 한계 안에서 유지하며, Project context 반영 후보도 01~05 범위다. 별도 Project context 브랜치·worktree의 결과를 이 작업 브랜치에 반영된 것으로 간주하지 않는다. Ticket 06과 Workspace 전체는 미완료이며 제품 Verify receipt는 아직 없다.

홈 안내 중복 등 종합 UX의 다른 후보, foreground 복귀 재확인, mutation 오류 처리와 최종 검증은 남아 있다. Trip PATCH/PUT 권위, 잘못된 scheduleId의 UX, 실제 기기의 server 주소도 기존 열린 판단이다. 후속 Ticket 14의 transaction·cache, 15의 sync 결과·재시도, 16의 cleanup, 17의 server entity, 18의 최종 Spec 대조 책임은 유지한다.
