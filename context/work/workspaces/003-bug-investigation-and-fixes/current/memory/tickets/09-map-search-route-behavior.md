# 09. 장소 검색·지도 이동·경로 최신성

## 맡은 결과와 범위

장소를 선택하고 일정 지도와 경로를 확인할 때 실제 좌표·일정 순서·이동수단에 맞는 결과를 제공한다. 노출된 ‘지도에서 보기’ 버튼을 동작하게 하고, 검색 실패를 허위 좌표나 결과 없음으로 바꾸지 않게 한다.

장소 검색/상세·좌표 0/null/누락의 입력부터 저장·응답·경로 경계, 두 경로 downloader와 cache 소비자, 일정 수정·삭제 후 갱신, 위치 권한·지도/목록 전환을 포함한다. native 오프라인 타일 준비는 05이다.

## 실행 맥락과 접근

[카테고리 조사](../../../records/2026-09-13-02-major-feature-category-investigation.md)에서 상세 지도 버튼의 navigation 0회, 장소 상세 실패의 0,0 반환, 실제 좌표 0 제외, 좌표 변경 뒤 ID pair 경로 재사용, directions 전체 실패의 정상 반환을 확인했다. 공통 downloader와 수정 후 자동 downloader는 다른 구현이므로 하나로 뭉뚱그리지 않는다.

[검색 hook](../../../../../../../apps/client/src/features/schedule/create-schedule/useLocationSearch.ts), [공통 downloader](../../../../../../../apps/client/src/shared/services/directions/route-downloader.ts), [자동 downloader](../../../../../../../apps/client/src/entities/route/data/useAutoDownloadRoutes.ts), [일정 수정](../../../../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx), [상세](../../../../../../../apps/client/src/screens/ScheduleDetailScreen.tsx)가 시작점이다. fixture 기반 독립 착수가 가능하고 실제 수정 왕복은 07과 연결한다. 05에 경로 없음·성공·부분 실패 계약을 제공한다.

공통 기준은 [기대 동작](../spec/02-behavior-and-cases.md)과 [품질·완료 판단](../spec/04-quality-and-completion.md)을 따른다.

## 완료 조건과 확인 방법

- 검색 성공/상세 실패·최초 검색 실패·결과 0개·빠른 연속 입력을 구별하고 잘못된 장소나 0,0을 선택 가능한 정상 결과로 만들지 않는다.
- 실제 위도/경도 0은 입력·schema·저장·응답·지도·경로에서 유효하게 남고 누락/null과 구분된다. 정상 search envelope와 상세 응답의 현재 차이는 그 자체로 수정하지 않는다.
- 좌표 보강·시간/순서 변경·일정 삭제·반복 다운로드 후 최신 인접 일정과 좌표에 맞는 경로를 표시한다. 오래된 cache와 중복 row가 먼저 선택되지 않는다.
- 이동수단별 성공·부분 실패·전체 실패·경로 불필요를 구분해 05이 정확히 표시할 결과를 넘긴다.
- 실제 iOS에서 상세 지도 이동, 선택 marker/card, 목록·지도 전환과 이동수단 변경을 확인한다. 위치 권한 거절 대조군을 유지하고 재허용·공급자 지연/실패의 복구도 검증한다.

## 현재 상태와 실제 결과

구성됨, 실행 전. 위 확인 계획을 수행하거나 제품 코드를 수정한 상태가 아니다. 기존 조사 근거는 위에 연결했으며, 실행할 때 현재 코드·환경과 수정 전 조건을 다시 대조한다.
