# 네트워크·조회·화면 복구 Context 보완

사용자가 “05도 보자”에 이어 “그래 그 방향으로 05도 진행해봐”라고 요청했다. 002의 채택 기록과 현재 구현을 대조해 기존 상세 Owner를 보완했다. 제품 리팩터링·새 UX·Personal·스킬 개선은 이번 실행에 포함하지 않았다.

## 반영한 관계와 구성

[Policy 본문](../../../../../.claude/context/policy-architecture.md)을 연결 관측, 조회와 표시, 복구의 흐름으로 구성했다. 실제 연결과 Debug 표시, unknown 확인 중·확인 불가, foreground와 수동 재확인의 공유 수명·늦은 응답·해제 조건을 설명한다. Query 데이터·접근·실행·표시의 책임과 우선순위를 표로 묶고 정상 빈 결과·부분 캐시·초기 실패·갱신 실패를 구별했다.

[오류 가이드](../../../../../.claude/context/error-handling.md)의 모든 isError에서 전체 화면을 교체하는 예시는 갱신 실패의 보존 조건을 놓쳤다. 기존 `view`와 실제 소비자를 연결하는 설명으로 보완하고 `PolicyErrorDisplay`의 실제 prop인 `policy`로 바로잡았다. 읽기 영역의 제한 예시를 작성 폼 전체 교체로 확장하지 않도록 기존 초안 보존 계약을 연결했다.

[여행 목록 본문](../../../../../.claude/context/selective-activation-architecture.md)의 사본·remote/mixed/local·취소 후 갱신·실패 fallback 계약은 이미 충분해 유지했다. 사라진 선택을 정리하는 실제 online·성공·갱신 완료 조건을 명확히 하고 일정·경비 내용 공개와 다른 보존 계약을 연결했다. 새 경쟁 본문이나 폴더는 만들지 않았다.

Project README·client guide·기존 Context 지도·API/Data·Policy UI가 같은 본문으로 이어진다. 04의 앱 준비·인증·실행 수명과 기존 작성·시간대·경비 연결 조건은 유지했다. 홈 표시 책임과 foreground 구독 위치의 선택 이유는 002 기록의 최소 사용자 발췌·링크로 남겼다. 원 대화 전체를 새로 검증한 것은 아니다.

## 대표 읽기와 직접 대조

Main이 Project·client·API/Data·Policy UI 진입에서 본문을 읽고 아래 질문의 답을 현재 구현과 대조했다. 별도 독자의 적용 결과나 후속 개발 효과를 확인한 것은 아니다.

| 질문 | 본문에서 확인한 답과 구현 |
| --- | --- |
| unknown의 10초가 끝나면 offline인가? 재확인 완료는 성공인가? | 관측 절에서 확인 불가 안내와 실제 상태를 구별했다. Network Store의 별도 타이머·Promise 종료·listener revision·cleanup을 대조했다. |
| 캐시가 남으면 제한 중에도 내용을 표시하는가? | 표시 우선순위에서 display 정책 제한이 ready보다 앞선다. 실제 정책만 제한하면 성공 캐시를 보일 수 있음을 useTripReadAccess·usePolicyReadQuery에 대조했다. |
| 홈 한쪽 요약이 없거나 갱신 실패하면 모두 비워야 하는가? | 성공한 빈 결과는 0, 실패는 오류, 부분 ready와 갱신 실패는 기존 수치를 보존한다. MainTripSection·TripSummary·화면 검사에 대조했다. |
| 연결 복귀마다 API를 다시 실행하는가? | 일정·경비의 fresh 캐시 재공개와 새 조회를 구별했다. 전역 Query 설정·Entity hook과, 별도 앱 연결인 useTripListRefresh의 취소/갱신을 대조했다. |
| local 목록이나 남은 캐시에 여행이 없으면 선택을 바꿔도 되는가? | 목록 계약의 출처·실제 online·조회 성공/진행 조건을 useTripSelection에 대조했다. 로컬 결과만으로 기존 선택의 삭제를 확정하지 않는다. |
| 현재 조회 feature 재사용은 일반 FSD 예외인가? | 현재 배치 설명과 Project-wide 규범 채택의 보류를 구별했다. 002 조회 소유권 기록의 사용자 선택을 보존했다. |

## 확인 근거

Project root에서 `node_modules/.bin/jest --config apps/client/jest.config.cjs --runInBand --silent --runTestsByPath`에 아래 기존 검사 경로를 전달했다. **13개 suite·199개 test가 통과**했다. 제품 코드·테스트 파일은 변경하지 않았다.

- `apps/client/tests/shared/store/network.test.ts`
- `apps/client/tests/shared/policy/useAppPolicy-network.test.ts`
- `apps/client/tests/shared/policy/useAppPolicy-activation.test.tsx`
- `apps/client/tests/shared/services/policy-query/read-query.test.tsx`
- `apps/client/tests/screens/read-query-consumers.test.tsx`
- `apps/client/tests/entities/trip/TripSummary.test.tsx`
- `apps/client/tests/application/trip-list-refresh.test.tsx`
- `apps/client/tests/entities/trip/data/useGetTrips.test.tsx`
- `apps/client/tests/entities/trip/data/useTripSelection.test.tsx`
- `apps/client/tests/shared/services/offline-prep/router-network.test.ts`
- `apps/client/tests/shared/services/sync/query-refresh.test.ts`
- `apps/client/tests/entities/trip/activation-query-refresh.test.ts`
- `apps/client/tests/shared/services/sync/provider-network.test.tsx`

이 결과는 제어된 NetInfo·repository 및 React Query·화면 연결의 범위다. 실제 인터넷 단절·백그라운드 Wi-Fi 전환을 새로 확인하지 않았다. 과거 Debug 표시 전환·온라인 foreground 관찰을 실제 연결 복구 검증으로 확대하지 않는다.

기록 반영 전 변경 문서 8개·상대 링크 133개와 참조 anchor·EOF·끝 공백, git diff --check, 명시적 005 Recover JSON 생성·파싱을 확인했다. `node scripts/check-harness.mjs`는 이전에 확인한 002·003의 역사 링크 8건으로 계속 실패했다. 해당 과거 파일을 이번 보완으로 수정하지 않았다. Work 반영은 explicit 005 Maintain guarded apply로 수행하고 최종 변경 문서·Recover를 다시 확인한다.

## 남은 범위와 다음 작업

경비 상세의 특정 재시도·삭제 실패 이유 처리, 복구 토스트 미추가, 조회 feature 재사용의 Project-wide 예외 채택 보류를 유지한다. 새 제품 정책·코드 개선을 문서 정리로 채택하지 않았다. 06은 04의 실행 수명과 05의 읽기 제한을 참조해 초안·선택창·저장값, 장소·날짜 입력의 관계를 보완한다. session binding·active index·Verify 상태는 변경하지 않는다.
