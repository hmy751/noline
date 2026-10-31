# Ticket 04 — 지도·경로 재구성 결과

2026-10-31, 기준 HEAD `788f553` 이후 문서 작업이다. [Project 지도·경로](../../../../project/guidance/offline-maps-and-routes/INDEX.md)는 데이터 입수, native 지도 pack, 저장 geometry와 화면 표시의 관계를 설명한다. 제품 코드는 바꾸지 않았다. 문서 이관 완료와 준비·정리 결함의 해결은 다른 범위다. 독립 개선 검토·수정·별도 검증을 마쳐 이 문서 범위는 완료로 판단한다. 006 전체 이관과 제품 보완은 남아 있다. 실제 문서 이관·참조 전환은 `d5867d7`으로 커밋했으며 Workspace 기록은 별도 커밋으로 분리한다.

## 실행 범위와 구성 판단

Ticket 03의 데이터 수명 설명에 이어 지도·경로의 준비·재사용·표시·정리를 맡았다. 기존 `.claude/context/offline-map.md`, `offline-routing.md`와 지도·경로 도입 결정 002·003을 현재 호출부·저장·renderer·SDK에 대조했다. 과거 002의 활성화 준비·경로 준비 Ticket과 003의 지도 readiness·지도 검색 경로 조사는 조사 질문으로 사용하고 현재 동작의 증거는 코드에서 다시 확인했다.

[공통 내용 판단 기준](../current/memory/spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)을 적용했다. 현재 형식에 맞췄는지만 확인하지 않고 기존 설명이 실제 작업에 적합한지도 판단했다. 시작 본문은 자원별 완료와 화면 관계를 묶고, 지도 pack과 route 상세는 변경 계기·저장소·실패가 달라 조건부로 나눴다. 활성화 구현·Policy·용량 집계는 기존 Owner로 연결해 복제하지 않았다.

유효한 비교표는 유지했고, 일반 구현 체크리스트와 긴 코드 복사 대신 해당 작업 조건·행동·예외를 가까이 썼다. 기존 문서의 이유를 얇게 줄이는 방식도 피했다. [형성 자료](../../../../project/guidance/offline-maps-and-routes/_background/context.md)에 공급자 선택의 목적, 도시별 공유와 두 저장소의 비용, 사전 계산·fallback·전체/증분 계산의 절충을 보존했다. 역사적 공급자 평가는 현재 시장·약관 판단으로 올리지 않았다.

완료 판단은 현재 Project에서 대표 질문에 답할 수 있고, 유효한 이유·조건·비용을 보존하며, 구현 공백을 완료로 포장하지 않고, 옛 제품 문서에 일반 읽기가 의존하지 않는지를 기준으로 한다. 새 제품 약속·코드 수정은 이 실행의 범위가 아니다.

## 원본 의미별 처리

| 원본의 의미 | 판단과 현재 배치 |
| --- | --- |
| 도시별 지도·native pack + SQLite metadata·공유 count | 목적과 비용은 유지. [지도 파일](../../../../project/guidance/offline-maps-and-routes/map-packs.md)에 두 저장소 불일치와 현재 count 의미 차이를 함께 설명했다. |
| 첫 일정 생성 자동 다운로드·준비 완료·만료 삭제 | 현재 호출은 활성화다. pack 등록과 tile 완료, metadata 삭제와 native 파일 회수를 구별하도록 정정했다. |
| 토큰·bounds·DB 초기화·중복 pack 문제 | 문제를 나누는 진단 조건은 유지. 낡은 변수명·zoom 인과·초기화 코드 전문은 실제 Owner와 현재 입력으로 바꿨다. |
| 오프라인 도로 경로·3 profiles·저장 결과와 직선 | [저장 경로](../../../../project/guidance/offline-maps-and-routes/routes.md)에 역할과 표시 차이를 유지. 저장 row의 신뢰·최신성 보장과 부분 합계 오해는 정정했다. |
| 생성/수정 후 준비·500ms·시간순 재계산 | 순서 변화가 인접 관계를 바꾼다는 이유 유지. 500ms 캐시 보장은 폐기하고 캡처 목록·수정 좌표 미반영을 현재 공백으로 남겼다. |
| polyline6·좌표 순서·client ID | precision 6과 좌표 변환은 직접 바꾸기 쉬운 경계라 짧게 유지. 압축률 우위·스냅 오차 단정과 ULID 디버깅 전문은 현재 기준에 복제하지 않았다. |
| 삭제 cascade·재시도·완료 체크·성능·가격 | soft/hard delete 구별, route expiry·실패 결과의 현재 한계로 정정. 미구현 retry와 측정하지 않은 성능·용량·가격은 현재 기능 목록에서 제외했다. |
| ADR의 대안·도시 공유·사전 계산의 비용 | Project 형성 자료에 선택의 이유와 대안·받아들인 비용을 남겼다. 당시 공급자 비교와 미채택 개선 예제를 현재 지시로 사용하지 않았다. |

## 직접 대조한 주요 차이

- 지도 helper는 metadata가 있으면 native pack을 확인하지 않고 flag를 기록한다. 새 pack도 createPack 반환·등록 확인 뒤 flag를 기록한다. 설치 `@rnmapbox/maps` 10.1.33의 `ios/RNMBX/Offline/RNMBXOfflineModule.swift` createPack은 startLoading 뒤 반환하고 loadTileRegion completion은 나중에 전달한다. JS OfflinePack은 `status()`를 제공하며 현재 helper의 `pack.size/tileCount`와 다르다. 실기기 다운로드 실패를 새로 재현한 결과는 아니다.
- 만료 reconcile은 count가 0일 때 metadata만 지우고 native pack을 남긴다. 여행별 cleanup은 count 감소 후 native/DB 삭제를 시도하지만 flag를 초기화하지 않는다. 디버그 지도 삭제도 flag를 남긴다. 공유 count는 반복 획득과 만료 여행 재계산이 같은 집합을 세지 않는다.
- 생성/수정 hook과 활성화 downloader는 서로 다른 구현이다. 전자는 기존 row 교체 없이 추가하고 후자는 ID 쌍/profile만 같으면 재사용한다. 최신 좌표·deletedAt·중복을 함께 확인하지 않으므로 저장 row만으로 최신 경로라고 할 수 없다.
- 두 downloader는 전체 API 실패도 downloaded:0으로 반환할 수 있다. Mapbox renderer는 첫 matching row를 쓰고, 일부 저장 구간의 거리·시간도 총합처럼 표시한다. 0 좌표를 제외하는 truthy 필터, 삭제 뒤 새 이웃 준비 누락과 route 자체 expiry 부재도 확인했다.
- Drawer의 완료는 전 항목 success이므로 error가 섞이면 하단 기다림 안내가 남는다. 별도 닫기 경로까지 막힌다는 주장은 하지 않았다.

이 차이는 문서에서 드러낸 제품 보완 과제다. 구현이 이렇다는 이유로 준비 완료·최신성·기록 보존의 뜻을 약화하지 않았다.

## 옛 문서와 소비 경로

| 원본 | 역사 보존판 |
| --- | --- |
| `.claude/context/offline-map.md` | [지도 가이드 원문](../../../../../.claude/_archive/offline-map-pre-project-2026-10-31.md) |
| `.claude/context/offline-routing.md` | [경로 가이드 원문](../../../../../.claude/_archive/offline-routing-pre-project-2026-10-31.md) |
| `.claude/decisions/002-offline-map-integration.md` | [지도 결정 원문](../../../../../.claude/_archive/offline-map-decision-pre-project-2026-10-31.md) |
| `.claude/decisions/003-offline-routing-integration.md` | [경로 결정 원문](../../../../../.claude/_archive/offline-routing-decision-pre-project-2026-10-31.md) |

역사 안내만 앞에 추가하고 원문은 유지했다. 옛 위치에는 호환 파일을 남기지 않았다. Project 진입·guidance·제품·여행 접근·데이터 수명·용량, client guide·기존 context 색인·check-docs command 예시를 현재 Owner로 연결했다. 조사 source-map은 당시 내용을 유지하며 원문 재접근 링크만 보존판으로 바꿨다.

위 archive 링크는 조사 근거 재접근용이다. 현재 Project 본문·형성 자료는 옛 제품 문서와 archive로 돌아가게 하지 않는다. 역사 session·audit·종료된 Work의 원문 링크는 현재 안내처럼 고치지 않았다. 다른 미이관 주제와 전체 읽기 분리는 05–08에서 계속한다.

## 검토와 확인

경로 조사자는 원문·결정·현재 코드와 실제 생성/수정/삭제/활성화/렌더 소비자를 읽었다. Main은 지도 원문·결정과 map download/cleanup·metadata·표시·SDK iOS 구현을 대조했다. 독립 개선 리뷰는 기존 원문과 현재 호출부·renderer·cleanup을 직접 대조했다. 공통 준비 본문과 조건부 상세의 구성은 유지할 이득이 있다고 판단했고, 좌표 없는 중간 일정을 제거한 뒤 앞뒤를 연결하는 의미와 Directions 공급자 선택 이유의 누락을 찾았다. Main은 두 의견을 채택해 현재 동작과 배경에 각각 반영했다. 새 제품 규칙을 만들지 않고 누락된 설명을 복원했다. 리뷰어는 설치 SDK 소스를 자신의 실행 경로에서 찾지 못해 iOS 반환 경계를 독립 확인하지 못했으며 Main의 직접 소스 관찰과 구별한다. 최종 독립 검증에서 첫 조사·초안의 “최초 활성화 서버 응답은 시각순” 주장이 다른 일정 조회 API의 orderBy를 잘못 적용한 것임을 발견했다. Main도 실제 POST activate와 client 전달부를 대조했고, 신규·기존 활성화 모두 명시적 정렬이 없어 시간순 준비를 보장하지 않는다는 설명으로 수정했다. 이 정정은 코드 동작 변경이 아니라 조사 결론의 오류 수정이다. 수정 뒤 검증자는 해당 POST 응답·client 전달·downloader를 국소 재확인했고 잔여 결함을 찾지 못했다.

최종 판정은 Ticket 04 문서 이관 요구에 충족 근거가 있다는 것이다. Project README·client guide에서 준비 배지, 장소/좌표 없는 일정과 선·합계, 만료 파일 회수라는 대표 질문을 현재 본문만으로 설명할 수 있음을 확인했다. 원문 4개는 안내문을 제외하면 기준 HEAD와 byte 동일했고 현재 본문·형성 자료의 옛 문서/아카이브 읽기 의존은 없었다. 검증자는 설치 SDK iOS 반환·비동기 완료와 OfflinePack.status()도 직접 확인했다. 상대 링크 297개와 diff 검사는 통과했다.

직접 실행한 검사:

- Main: `node node_modules/jest/bin/jest.js --config apps/client/jest.config.cjs --runInBand --runTestsByPath apps/client/tests/entities/trip/trip-lifecycle.test.ts apps/client/tests/features/profile/hooks/useStorageStats.test.ts` — 2 suites·32 tests 통과.
- 경로 조사자: 같은 로컬 Jest 명령의 대상 `apps/client/tests/screens/create-schedule-flow.test.tsx`, `apps/client/tests/screens/update-place-search.test.tsx` — 2 suites·26 tests 통과 보고.

합계 4 suites·58 tests다. 생성·수정 테스트는 route hook을 mock하므로 geometry 최신성이나 downloader 성공을 입증하지 않는다. lifecycle·용량 테스트도 native Mapbox 다운로드 완료·오프라인 재실행·실제 파일 회수를 입증하지 않는다. 이 범위를 넘는 실기기 검증은 수행하지 않았다. 문서만 바꾸었으며 제품 버그 수정 완료를 주장하지 않는다.

Main 테스트 출력은 `/tmp/noline-006-ticket04-tests.log`에 있으며 임시 로그의 지속 보존을 전제하지 않는다. 변경 문서의 코드 예시 밖 상대 파일·앵커 검사와 `git diff --check`를 수행했다. 명시적 006·session-bound 002·default 001의 Recover도 성공했다. 이 live consumer가 선택한 문서 경로는 유지되며 수정한 Project 진입에서 새 Owner를 찾는다. Recover 성공은 제품 준비 검증이 아니다.

전체 `node scripts/check-harness.mjs`는 역사 링크 22건으로 실패했다. 직전 24건 중 지도·경로 결정이 archive로 이동하며 그 내부 2건이 검사 대상에서 빠졌으며, 남은 오류를 고치려고 옛 정본을 되살리거나 역사 문서를 현재화하지 않았다.

## 권장 후속 작업과 다음 문서 범위

문서 이관의 다음 범위는 예정 Ticket 05의 구조·계층·UI·schema다. 이번의 내용 판단 기준과 독립 검토를 이어 적용한다.

제품 보완은 기존 작업과 연결해 다음 묶음을 권한다. 새 Ticket을 자동 생성하거나 해당 코드 수정을 시작하지 않았다.

1. **준비 결과와 복구:** 002의 활성화 readiness와 003의 지도 readiness 조사를 연결해 데이터·pack·route별 실제 완료, 부분/전체 실패, 활성 여행 지도 재시도와 안내를 다룬다. iOS 실제 다운로드 완료·연결 차단·재실행이 수락 근거에 필요하다.
2. **경로 최신성과 표시:** 002의 경로 준비와 003의 지도·경로 조사를 연결해 저장 결과 기반 입력, 같은 ID의 장소 변경, 인접 관계·날짜 경계·0 좌표, 중복/삭제와 일부 구간 합계를 함께 검증한다. 단순 500ms 제거로 닫지 않는다.
3. **공유 지도 수명과 공간 회수:** 도시별 획득·해제 의미, metadata/native 불일치, 만료 삭제·flag 정합성·동시/반복 호출을 함께 다룬다. Ticket 03에서 우선 제안한 미전송·재활성화 cleanup 보호와 조율하며 그 보호를 우회하지 않는다.

준비 배지가 사용자에게 현재 사용할 수 없는 기능을 약속하는 문제와 오래된 경로 표시를 먼저 다루고, 공유 수명은 같은 cleanup 보호 아래 별도 검증하는 순서가 적합하다. 이번 이관은 세 묶음의 정책 선택이나 구현 완료가 아니다.
