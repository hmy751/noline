# 일정 화면의 Policy·Query 직접 조합

사용자는 앞선 작업물 설명 뒤 “useScheduleContent 이게 상태를 가지는데 정책과 뭐가 다른지 잘 모르겠어”라고 물었다. 이어 “너무 애매하게 뭔가 더 생긴느낌이야 … 아키텍쳐 전문가한테 리뷰 맡겨봐 개선 끌어올리려면 어떻게 해야하는지”라고 검토를 요청했다. 독립 리뷰를 설명한 뒤 사용자는 “그래 개선해보자”라고 실행을 승인했다.

## 검토가 바꾼 판단

리뷰어는 원자료와 실제 사용처를 읽기 전용으로 대조했고 테스트나 수정을 실행하지 않았다. `useScheduleContent`에 별도 저장 상태가 없다는 사실과, 그 안에서 Policy의 허용 여부를 네트워크·활성 상태로 다시 판단한다는 사실을 구별했다. Main도 실제 훅과 사용처를 확인했다.

표시 결과를 파생 타입으로 표현하는 방식 자체가 잘못된 것은 아니다. 하지만 현재 소비자는 ScheduleScreen 하나이며 목록·지도는 그 타입을 받지 않는다. 화면의 가공·메뉴·선택 보정은 대부분 표시 가능한 일정이 있는지를 공유한다. 그래서 별도 다섯 상태를 두는 이점보다 기존 Query 결과를 다시 해석해야 하는 부담이 컸다. 이는 테스트 통과 여부와 별개인 구조 개선 판단이다.

현재 훅 유지, 화면의 직접 조합, 공통 데이터 훅에 정책 통합, 공통 화면 상태 프레임워크를 비교했다. Main은 단일 화면의 조합을 가까이 두는 안을 선택했다. 일정 데이터 훅은 홈·일정 폼·경비 폼에서도 쓰므로 화면 표시 정책을 데이터 훅으로 옮기지 않는다. 실제로 여러 소비자가 같은 표시 계약을 공유하게 되면 추출을 재검토할 수 있다.

## 구현한 책임 배치

`useScheduleContent`, `ScheduleContent`와 `features/schedule/schedule-recovery`를 제거했다. 화면은 `useAppPolicy`와 `useGetSchedules`를 직접 사용한다. 표시가 허용된 Query 데이터만 `visibleSchedules`로 두고, 날짜별 가공·지도 선택 보정·메뉴 표시가 함께 사용한다. 원본 캐시는 지우지 않는다. 로딩·오류 안내 컴포넌트는 화면 옆의 [ScheduleQueryFeedback](../../../../../apps/client/src/screens/ScheduleQueryFeedback.tsx)으로 옮겼다. 사용자 선택과 Drawer의 mount 경계는 유지했다.

Policy의 인증·활성 여부·unknown 판단은 그대로 사용하며, `useAppPolicy(tripId, { network: 'real' })`로 계산에 사용할 관측 기준만 고를 수 있게 했다. 기본 `display`는 기존 호출의 화면 시뮬레이션 의미를 유지한다. 일정 화면은 표시용 읽기 정책으로 내용 노출을 결정하고, 표시용·실제 읽기 정책이 모두 허용할 때 Query를 enabled로 둔다. 수동 새로고침·재시도에도 같은 조회 조건을 적용한다. 화면에 활성 여부·네트워크 문자열 비교를 새로 복제하지 않는다.

리뷰어가 제시한 `allowOnlineOverride` 옵션은 그대로 채택하지 않았다. 그 옵션은 화면 표시와 실제 요청의 의미를 다시 섞을 수 있다. 대신 관측 기준을 명시해 같은 정책 계산을 재사용했다. 옵션 하나와 두 정책 호출의 비용은 남지만, 별도 권한 상태·복구 상태·정책표·화면 상태 모델을 만들지 않는다. Policy는 사전 판단이며 Router의 실제 실행 시점 검사와 쓰기 override 차단을 대체하지 않는다.

## Debug 동작 정정

앞선 구현은 강제 online이 실제 Remote 요청을 열지 않아야 한다는 계약을 캐시 표시 차단까지 넓혔다. 기존 Ticket 계약은 표시를 강제 상태로 시뮬레이션하고 실제 요청은 실제 관측으로 차단하는 것이었다. 이번 개선은 그 구분에 맞춘다.

- 강제 online·실제 offline/unknown에 기존 캐시가 있으면 내용을 표시한다. 오래된 캐시라도 실제 조회나 수동 재조회를 열지 않는다.
- 같은 조건에서 캐시가 없으면 무한 로딩이나 빈 일정 대신 실제 정책의 제한·확인 중·재확인 안내를 표시한다. 실제 unknown을 offline 문구로 바꾸지 않는다.
- 실제 online이라도 강제 offline/unknown의 화면 제한은 유지한다.
- 실제 연결이 돌아와 조회 조건이 충족되면 기존 Query의 stale·무효화 기준으로 조회한다.

일반 사용자 환경의 비활성 offline/unknown 제한, 캐시 우선 표시, 실패 안내·재시도는 유지했다. 앞선 sync의 부분 성공 후 갱신, 취소 후 무효화와 활성 전환 보완도 변경하지 않았다. Query 완료를 기다리는 sync 조율이나 요청 횟수 고정은 추가하지 않았다.

## 확인한 결과와 범위

Main은 화면·정책의 관련 4개 suite·66개 test, 이어 전체 client Jest **39개 suite·364개 test 통과**를 확인했다. 전체 명령은 client 디렉터리에서 `node ../../node_modules/jest/bin/jest.js --config jest.config.cjs --runInBand`다. 이번 추가 검사는 표시용·실제 정책, Debug 캐시와 요청 분리, 캐시 없는 실제 unknown 안내, 실제 연결 복귀와 여행 미선택을 다룬다. 기존 sync·활성 전환·지도 선택·입력 보존 검사도 전체 실행에 포함된다.

이번 수정 파일의 Prettier, `git diff --check`와 기존 Prettier plugin 충돌 규칙을 제외한 ESLint는 통과했다. ESLint 오류·경고는 없었다. client 타입 검사는 기존 Mapbox 좌표 tuple과 offline-map/download의 OfflinePack 필드 오류 3개로 실패했고 추가 오류는 없었다.

화면의 데이터 조회·native 지도·일부 활성 입력과 DB·HTTP는 mock이다. 실제 기기·서버·OAuth·SecureStore 전체를 검증한 결과가 아니다. 리뷰어는 구조를 조사했고 이번 실행 검증은 Main이 수행했다. 제품과 후속 기록은 미커밋이며 최종 UX 수락, 2-B·2-C와 Ticket 전체 완료는 남아 있다. 현재 실행 상태는 [Ticket 06](../current/memory/tickets/06-app-startup-lifecycle.md)이 소유한다.
