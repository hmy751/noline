# Ticket 02 후속 수정과 확인 결과

## 반영한 범위

[착수 기록](2026-10-31-01-ticket-02-followup-scope.md)의 사용자 요청에 따라 직전 02의 제품·여행 접근 결과를 수정했다. 제품 기준과 여행 접근·형성 자료에서 옛 제품 문서·결정·아카이브로 돌아가는 읽기 연결을 없애고, 필요한 이유·기각 대안·발췌를 Project에 직접 담았다. Router·여행 목록의 반영·출처·fallback·선택을 현재 코드에 대조해 새 Owner에서 설명하며 기존 상세의 중복 책임은 정리했다.

이전 Policy 호환 파일은 제거했다. 이전 전체 본문과 잘못된 호환 유지 판단을 담은 중간 이관 결정은 역사 아카이브에 보존하며 대응 경로는 [02 결과](../output/ticket-02-result.md#옛-자료-처리와-역사-조사-경로)에 있다. 현재 제품 읽기는 이 보존본으로 향하지 않는다. 다른 주제도 사용하는 원결정·혼합 문서 전체를 이번에 격리했다고 주장하지 않는다.

## 별도 검증과 수정

독립 검증자는 제품 기준·여행 접근·형성 자료·Decision의 의미와 기존 결정·002 기록의 원문을 대조했다. Router, TripRepository, Local 목록 반영, useGetTrips, useTripSelection, useTripListRefresh와 공통 조회 조합을 읽고 새 설명의 범위를 확인했다. 비활성 여행의 카드/내용/초안, 표시 online·실제 offline, Data/Service 선택 이유, 목록 fallback·선택 조건을 현재 Project 경로만으로 설명할 수 있다고 반환했다.

검증 중 발견한 Policy UI의 옛 오류 가이드 경유, 활성화의 옛 목록 anchor, 문서 관리 reference의 옛 Data/Service 결정 경로를 수정했다. 관련 옛 결정의 현재 안내 링크와 app-runtime의 Router·Policy Owner도 맞췄다. 같은 검증자가 좁게 재확인하여 추가 필수 수정이 없음을 반환했다. 검증 당시 아직 재작성 전이던 006 결과·Ticket·state는 Main이 최신 결과로 맞췄다.

## 실행 확인과 입증 한계

- `git diff --check`: 통과.
- 제품 기준·여행 접근과 형성 자료·Decision 0001에서 옛 `.claude/context`·`.claude/decisions`·아카이브 및 과거 Work로 향하는 읽기 링크가 없는지 확인했다. 해당 문서의 로컬 파일 링크도 유효하다.
- `recover 006-project-context-reconstruction`으로 명시 재진입했다. active/default 001과 이전에 확인한 live consumer 002도 explicit Recover로 확인했다. 선택 파일을 유지하며 active index·binding·machine status·Verify receipt를 변경하지 않았다. 경로 복구 성공은 현재 Project의 모든 미이관 주제가 정리됐다는 뜻이 아니다.
- `node scripts/check-harness.mjs`는 16건으로 실패한다. 기존 002·003 역사 자료의 코드 링크 오류 8건에 더해, Policy 호환 파일 제거로 002의 날짜별 기록 1건과 종료된 005의 과거 본문·기록 7건이 옛 경로를 찾지 못한다. 현재 006 결과의 옛 이관 결정 링크는 새 보존 위치로 고쳐 이 집계에 남기지 않았다.

추가 역사 링크 오류 8건은 이번 제거로 생긴 영향이다. 기존 오류로 숨기거나 전체 검사를 통과로 표시하지 않는다. 원래 기록의 당시 상태를 덮어쓰거나 호환 진입을 복원하는 대신 006 조사 결과에 옛 경로·현재 Owner·보존본 대응을 남겼다. 전체 문서군 정리의 역사 링크 처리 문제로 유지하며 이번에 Harness 검사기를 변경하지 않았다.

제품 코드 변경이 없어 이전 client 4 suites·65 tests를 재실행하지 않았다. 당시 통과는 제어된 Network Store·Query·화면·목록 연결에 대한 것이며 현재 실기기 단절·native 지도 준비·실서버 sync 성공을 입증하지 않는다. 이번 완료는 02의 한정 문서 이관과 읽기 경로 수정이고 03–08 또는 006 전체 완료가 아니다.
