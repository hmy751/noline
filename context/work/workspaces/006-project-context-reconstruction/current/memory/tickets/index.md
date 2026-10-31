# 실행 Ticket

| Ticket | 맡은 결과 |
| --- | --- |
| [01 — 자료와 보완 후보 지도](01-source-map-and-improvement-candidates.md) | 분산 자료를 대조해 Project 보완 후보와 후속 실행 묶음을 제시 |
| [02 — 제품·활성화·네트워크 접근](02-product-activation-and-travel-access.md) | 제품·여행 접근·목록의 설명, 문서 구성과 해당 범위의 옛 문서 읽기 의존을 재구성 |
| [03 — 데이터 저장·동기화·정리](03-data-storage-sync-and-cleanup.md) | Local 변경·queue·sync·cleanup·계정 종료의 데이터 보존 관계를 재구성 |
| [04 — 오프라인 지도·경로](04-offline-maps-and-routes.md) | 지도 pack·저장 경로의 준비·재사용·표시·정리 의미와 현재 구현 차이를 재구성 |
| [05 — 구조·계층·UI·schema](05-structure-layers-ui-schema.md) | 현재 app·package 구조와 계층·UI·schema 기준, 한정 예외와 실제 보장 범위를 재구성 |
| [06 — 작성·입력·날짜](06-writing-input-and-dates.md) | 초안 수명·장소 선택·picker와 날짜·시간대·저장 표현을 실제 부모·소비 경로에 맞게 재구성 |
| [07 — 통화·API·오류](07-currency-api-and-errors.md) | 통화 표시·입력·저장과 API·인증·소유권·오류 전달의 실제 경계와 제품 차이를 재구성 |
| [08 — 개발 시작·전체 읽기](08-development-start-and-reading-paths.md) | 개발 시작 안내·세션 형성 이유·남은 제품 결정 격리·현재 읽기와 검증 선언의 정합성을 점검 |
| [09 — 제품 개발 기준·위험 점검 통합](09-claude-content-integration-and-cleanup.md) | rules·guards와 Project를 대조해 중복 권위를 해소하고 조건·위험·검증 기준을 보강 |
| [10 — 반복 개발·문서 관리 절차 통합](10-development-and-document-workflows.md) | runbooks·workflows·옛 commands·noline-work의 유효한 수행 방법을 현재 실행 경로에 통합 |
| [11 — 공통 실행 기준·도구 연결 정리](11-shared-execution-and-host-connections.md) | 공유 실행 의미와 Claude/Codex별 필수 연결을 구별하고 원본·bridge·host 경로를 정리 |
| [12 — 선택 이유 복원·역사 자료 분리](12-historical-reasons-and-reading-separation.md) | 현재 필요한 이유를 적절한 Owner에 복원하고 남은 역사 원문을 일반 읽기에서 분리 |
| [13 — 전체 검증·종료 판단](13-integrated-verification-and-acceptance.md) | 통합·보강·폐기·잔존 결과와 간접 읽기·도구 연결을 전체 목표에 대조하고 사용자 수락으로 연결 |

개별 진행과 실제 결과는 각 Ticket 본문에서 확인한다.

03 이후 모든 이관 Ticket의 실행·리뷰·완료 판단에는 [공통 내용 판단 기준](../spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)을 적용한다. 기존 설명 자체의 현재 적합성과 문서 역할에 맞는 구성·형식인지를 함께 확인한다. 기존 형식이 적합하면 유지할 수 있으며 새 모양으로 통일하는 것이 목표는 아니다. 새 Ticket을 만들 때도 이 기준을 연결하고 해당 주제에서 대조할 원자료·코드·소비 경로를 구체화한다.

08 뒤의 남은 범위는 09–13이 맡는다. 각 Ticket은 자신이 바꾸는 주제의 내용 판단, Owner 통합·보완, 참조와 필요한 도구 연결 전환, 옛 경로 정리와 검증까지 완료한다. 기본 순서는 09 → 10 → 11 → 12 → 13이며, 12와 13을 앞선 Ticket의 미완성을 수거하는 단계로 사용하지 않는다.
