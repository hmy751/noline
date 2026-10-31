# 티켓 01 — 자료 대응과 Project 보완 후보

2026-10-30 첫 조사. 기준 HEAD는 `c9eb33c`이며 조사 시작 시 기존 미추적 `.pnpm-store/` 외 변경은 없었다. `recover 006-project-context-reconstruction`으로 재진입했고 현재 Main session의 Maintain 연결도 006으로 성공했다. Active index는 바꾸지 않았다.

이 결과는 후속 주제를 고르기 위한 첫 지도다. 실제 읽은 본문과 아래 한정한 코드 대조에 근거한다. 모든 역사 자료의 완독·제품 실행 검증·Project 이관 완료를 뜻하지 않는다. 후속 구성 중 02·03은 실행 Ticket으로 구체화됐고 04–08은 권장 범위다. 최신 진행은 Ticket 색인과 state를 따른다.

## 이후 확정된 완료 조건

첫 지도 이후 사용자 확인에서 아카이빙의 목적을 명확히 했다. 현재 작업이 `.claude/context`·`.claude/decisions` 등 옛 제품 문서군을 더 이상 읽지 않도록 필요한 의미·이유·근거를 새 체계에 구성하고 현재 참조를 전환한다. 옛 문서는 아카이브로 격리하거나 제거할 수 있다. 현재 권고는 호환 안내까지 일반 읽기에서 제외하는 것으로 교정했으며, 아카이브 위치·물리 삭제 자체를 일괄 요구하지 않는다. 최종 상태와 현재 진행은 [산출물 색인](index.md)을 따른다.

## 첫 조사 당시의 대응·이관 관계

Project에는 날짜·통화·API·앱 실행의 실질적인 본문이 있다. 반면 제품을 이해하는 중심인 활성화·네트워크·입력·지도·동기화의 상세는 여전히 `.claude`에 분산되어 있다. `common/product`와 `current/architecture`는 이를 짧게 연결하므로, 여러 과거 문서를 읽어야 데이터 보존과 기능 제한이 함께 작동하는 이유를 이해할 수 있다. 기존 Project 본문 자체의 구성과 설명을 고치는 일이 필요하다.

| 기존 자료와 역할 | 현재 Project 대응 | 권장 처리와 남길 것 |
| --- | --- | --- |
| 루트 `README.md`: 제품 장면·선택 이유·기능 소개 | `common/product.md`, `decisions/0001-selective-local-first.md` | 사용자 소개·실행 입구는 루트에 유지. 활성화 선택 이유와 지원 조건을 Project에 충분히 설명하고, 소개의 강한 보장 표현을 확인 범위와 대조한다. README 전체 복제는 피한다. |
| 루트 `CLAUDE.md`, client/server/schema/UI guide | Project README·architecture·API guidance와 부분 연결 | 경로별 책임·명령·위험 점검은 각 guide에 유지. 상세 의미는 Project로 연결하고, 낡은 사실과 날짜 일반화·중복 Owner 안내를 주제별로 함께 바로잡는다. 다섯 `AGENTS.md`는 원본 CLAUDE를 가리키는 symlink여서 별도 본문이 아니다. |
| `.claude/context/selective-activation-architecture.md`, `activation-system.md` | 제품·구조 본문의 짧은 요약 | 여행 목록과 단건의 차이, Local/Remote 선택, 준비·정리의 의미를 Project로 통합한다. 두 문서의 Router 중복 설명을 줄이고 구현 위치·형성 근거의 역할을 구별한다. |
| `policy-architecture.md`, `error-handling.md`의 화면 복구 부분 | Project에서 기존 Owner를 연결 | 005에서 보완한 설명을 재사용하되 Project 안에서 네트워크 관측·조회 허용·캐시 표시·복구를 함께 읽도록 재구성한다. 서버 오류 계약은 별도 후보로 분리한다. |
| `form.md`, `manual-input.md`, `components.md`의 입력 부분 | 날짜·통화·API는 편입됐으나 초안 수명은 외부 Owner | 초안·검색 후보·채택 장소·picker·저장값의 수명을 하나의 설명으로 옮긴다. 공용 컴포넌트의 경계는 구조 guidance와 연결한다. |
| `offline-map.md`, `offline-routing.md` | storage-statistics의 용량 설명과 제품 요약뿐 | 데이터 활성화, 지도 pack, 저장된 경로의 준비·실패·재시도를 분리해 설명한다. 긴 구현 예제는 그대로 이관하지 않고 코드 대조 후 유효한 의미와 역사 근거를 선별한다. |
| `architecture.md`, `components.md`, `typescript.md` | `current/architecture.md`, 리팩터링 guidance | 현재 배치와 개발 계약을 나눠 설명한다. FSD 설명·schema 규약·UI 책임의 중복을 조정한다. TypeScript의 일반 교육 예제는 프로젝트에 실제 필요한 기준인지 추가 선별한다. |
| `time.md`, `currency.md`, `api-data.md` | 날짜·통화·API 정본 | 이미 이동된 Owner를 유지한다. 호환 문서의 남은 구현 안내도 대조해 새 Owner에 반영한다. 현재 참조를 전환하고 옛 호환 문서는 격리하거나 제거한다. 이미 옮긴 본문을 중복 이관하지 않는다. |
| `START_GUIDE.md`, `apps/server/README.md`, `apps/server/scripts/README.md` | architecture의 짧은 검증 안내 | 개발 시작 안내는 사용 위치에 유지·정비하고, 인증·DB·환경 전제와 검증 경계는 Project와 연결한다. 과거 테스트 계정·SQL 안내의 현재성을 먼저 판별한다. |
| `.claude/decisions`, sessions, archive, 002 기록 | Project decision 및 일부 근거 링크 | 필요한 대안·실패·선택 이유를 Project에 직접 담고 옛 문서로 향하는 현재 연결을 없앤다. 원본은 역사 조사용으로 격리하거나 제거한다. 과거의 예시나 완료 표기를 현재 약속으로 복사하지 않는다. |

Rules·guards·runbooks는 제품 의미와 실행 지침이 섞여 있다. 제품 설명의 Owner는 주제별로 옮기되 compact rule·시작 순서는 필요한 위치에 남기고 새 본문으로 연결하는 안을 권한다. 실행층 전체의 폐기·이동이나 스킬 개편은 이 제안에 포함하지 않는다. 실제 아카이브 위치는 각 주제의 소비 경로를 확인한 뒤 정한다.

## 주요 보완 후보와 필요한 판단

아래 후보의 문제 설명은 첫 조사 당시를 기준으로 한다. 이후 반영과 새 발견은 해당 후보의 후속 문단과 [산출물 색인](index.md)에서 구분한다.

### 1. 활성 여행으로 무엇을 보존하고 무엇을 사용할 수 있는가

현재 product 본문은 활성 여행의 SQLite, 비활성 여행의 API, Service Layer와 Policy를 설명하지만 실제 장면과 선택 이유의 연결은 짧다. 여행 목록의 보존, 일정·경비 내용 공개 제한, 작성 초안 보존이 서로 다른 계약이라는 설명이 `.claude`의 여러 본문에 흩어져 있다.

재구성하면 사용자는 “연결이 끊겼는데 왜 여행 카드는 보이고 일정 목록은 제한되며 이미 열린 폼은 남는가”를 Project에서 이해할 수 있다. `common/product.md`의 사용자 장면과 데이터 관계를 적극적으로 다시 쓰고, 구현 설명은 네트워크·조회 본문으로 연결하는 안을 권한다. 기존 결정 0001도 결정의 결론을 반복하는 데서 더 나아가, 확인된 선택 이유와 다시 볼 조건을 연결할 필요가 있다.

근거는 활성화 두 본문, Policy의 화면별 보존·작성/읽기 구별, 005 산출물, 002-06 관련 결과다. 후속 검증은 Router·여행 목록 반영·선택·policy-query·화면 소비자를 따라 수행한다. 현재 캐시가 존재한다는 이유로 오프라인 접근 허용을 새 약속으로 올리지 않는다.

### 2. 데이터 활성화·지도·경로의 준비 완료는 무엇이 다른가

`offline-map.md`는 첫 일정 생성과 `useCreateScheduleForm`을 자동 지도 다운로드의 중심 경로로 설명한다. 현재 조사한 생성 훅에서는 그 호출을 찾지 못했고, 활성화 훅에는 `downloadOfflineMapInBackground` 호출이 있다. `metadata.ts`의 `ready`는 `mapDownloaded`를 보고 정한다. 따라서 이 상태를 데이터·지도·경로 전체 준비 완료로 설명하면 범위가 달라진다.

`offline-routing.md`는 500ms 타이머를 체크리스트로 권장한다. 실제 `useSubmitSchedule.ts`에도 저장 성공 뒤 500ms 후 경로 다운로드를 예약하고 그 전에 `onSuccess`를 호출하는 구조가 남아 있다. 타이머가 최신 조회 완료를 보장한다는 근거는 이번에 확인하지 않았다. 저장 완료·화면 종료·경로 준비의 책임을 분리해 설명할 가치가 크다.

권장 결과는 오프라인 준비와 지도·경로 수명을 설명하는 Project 본문이다. 002-09·13의 정의와 원래 engine/components 분석, 003의 관련 재현 접근점을 연결한다. Native pack 존재·재시도·참조 카운트·취소·경로 최신성은 추가 대조가 필요하며 실제 Mapbox 동작은 미실행이다. 이번에 제품 결함을 확정하거나 타이머 제거를 결정하지 않았다.

### 3. 저장·동기화·정리에서 미전송 데이터를 언제 보존하는가

Project의 app-runtime은 로그아웃의 대기·미전송 확인을 이미 자세히 설명하지만, 여행별 비활성화와 cleanup을 이해하려면 별도 문서·코드가 필요하다. 같은 “pending”이라는 말도 보존 범위가 같다고 가정할 수 없다.

현재 `queue.ts`의 `getPendingTasksForTrip`은 PENDING만 조회하고, 자식 귀속은 payload의 tripId를 읽는다. `hasPendingTasksForTrip`을 비활성화 훅과 cleanup job이 호출한다. 반면 여행 목록 보존 문서는 PENDING·IN_PROGRESS·FAILED를 모두 보존 대상으로 설명한다. 이는 경로마다 확인 범위가 다르다는 직접 근거다. 실제 데이터 손실을 재현했다는 뜻은 아니다.

원자적 Local 변경·큐 기록, push/pull 결과, 계정 변경, 여행 정리를 이어 설명하는 본문을 권한다. app-runtime을 다시 복제하지 않고 공통 보존 의미와 여행별 현재 한계를 연결한다. 002의 원래 sync 관찰을 현재 엔진에 일괄 적용하지 않는다. 후속에서는 FAILED·IN_PROGRESS·귀속 불명·삭제된 자식·동시 정리를 대조하고, 계약 위반이 확인되면 제품 수정 후보를 별도로 분리한다. 002-14·15·16과 003-10·11·12는 조사 접근점이며 완료 근거가 아니다.

### 4. 코드 책임을 어디에 두며 예외는 어디까지 인정했는가

`.claude/context/architecture.md`에는 실제 없는 `packages/db`와 Prisma 설명이 남아 있고 `application` 층이 구조도에 없다. shared를 비즈니스와 무관하다고 소개하면서 같은 본문에서 앱 특화 services·policy를 허용한다. Project의 current architecture는 현재 책임을 요약하지만 이 차이를 풀어주는 개발 기준은 부족하다.

002의 조회 조합 기록은 공통 service와 일정·경비 feature를 나눈 이유, 공개 조회 훅의 한정 재사용 조건, Project-wide 예외 채택을 보류한 사용자 발화를 보존한다. 이 선택은 “공개 index면 feature 간 import 허용” 같은 일반 규칙으로 올릴 수 없다.

권장 처리는 현재 구조 지도의 재작성과 구조·UI·schema 작업 guidance의 연결이다. 폴더 목록보다 준비 조합·상태·정책·저장·화면 표현의 책임을 설명한다. 실제 feature 재사용 위치를 대조하고, 한정 예외를 Project 전체 기준으로 채택할지는 별도 판단 지점으로 둔다. `typescript.md`는 목차만 조사했으므로 본문 선별을 이 후보의 남은 일로 명시한다.

### 5. 입력값·초안·선택창·저장값의 수명

005가 보완한 form 본문에는 재사용할 설명이 상당히 있다. 일정 검색을 오가며 유지되는 초안, 장소 텍스트 수정 시 좌표 해제, 생성/수정의 다른 reset 조건, 날짜와 시간 picker의 다른 확인 시점이 구체적이다. 이를 Project의 날짜·API 본문과 연결하면 다음 작업자가 폼의 기술 이름보다 값의 수명으로 변경 영향을 이해할 수 있다.

권장 처리는 초안과 입력 본문의 이관·재구성이다. 공통 동작과 현재 차이를 구별하고, 같은 경비 ID 재열기·늦은 기본 통화·수정 Places 상세 실패의 0/0 호환을 미완성 범위로 보존한다. 생성/수정 UX를 일괄 통일하거나 005의 과거 테스트 통과를 현재 전체 폼 검증으로 올리지 않는다. 후속에서는 실제 폼 소비자·정책 전환·저장 오류·picker 수명을 대조한다.

2026-10-31 변경분 재검토에서 구체적인 차이를 추가로 확인했다. `UpdateScheduleDrawer`는 수정 정책이 막히면 입력 영역 전체를 제한 안내로 바꾼다. 입력을 계속 보여 준다는 작성 계약과 다르며, 내부 입력값 소실까지 확인된 것은 아니다. 예정 06에서는 비활성 여행의 열린 일정 수정에 online → offline/unknown → online 전환을 적용해 입력 표시·편집, 값 보존, 자동 제출 없음, 복귀 뒤 재저장을 구분해 확인한다. 02 문서는 계약과 구현 차이를 명시했지만 제품 코드는 고치지 않았다. 계약을 충족하는 수정과 계약 자체를 바꾸는 제품 판단도 구별한다.

### 6. 날짜·통화·API의 기존 Project 본문을 더 잘 구성하기

004의 날짜 입력 불일치를 그대로 새 미결 항목으로 제시하면 틀린다. 현재 공유 Expense create/update request는 모두 `expenseDateInput`을 적용한다. Project 날짜 본문과 10월 6일 결정은 도시 IANA 시간대, 기존 ISO 저장 유지, 경비 date-only, 기존 여행 호환과 마지막 여행일 뒤 7일의 의미를 이미 담고 있다.

현재 날짜 본문은 제품 의미와 많은 경계별 구현·호환 설명을 함께 담는다. “한 시점과 달력 날짜”, “여행 도시 기준”, “기존 데이터 호환” 순서로 독자가 이해하도록 재구성하고, 상세 현재 적용 관계를 분리할 가치가 있는지 판단한다. 모든 주제를 common/current/guidance 세 파일로 쪼개지는 않는다.

통화 본문은 환산 없는 분리와 표시 자릿수·저장 정밀도의 차이를 이미 설명한다. 현재 server DB의 decimal(10,2)도 확인했다. 입력·저장·합산·반올림과 `주 통화`의 의미는 별도 선택으로 남긴다. Expense 날짜의 명칭(결제일/사용일), 다중 도시·일정별 시간대 같은 확장은 기존 채택을 무효화하는 미결 목록과 구별한다.

API guidance는 Schedule의 접근·직렬화와 새 입수 검사를 다루지만, `.claude` 오류 가이드는 AppError/errorHandler를 기본으로 강하게 지시하고 API 본문은 일부 route의 sendInternalError와 통일 방향 미정을 설명한다. 현재 구현·목표 기준·공개 오류 응답을 한 문서에서 분리해 읽게 할 필요가 있다. 후속에서는 route·middleware·fetcher를 대조하고, 새 오류 계약은 사용자 선택으로 연결한다.

### 7. 개발 시작·인증·DB 준비와 검증 경계

새로 발견한 `START_GUIDE.md`는 하드코딩된 테스트 유저를 일반 시작 절차로 안내한다. 실제 Trip route는 requireAuth와 req.userId를 쓰며, server guide는 인증 경로를 req.user로 표기한다. scripts README는 setup 스크립트가 id=1과 sequence를 다룬다고 하지만 실제 SQL은 ULID 사용자를 삽입한다. 문서 간 차이를 코드에서 확인했다. SQL의 password 열과 현재 OAuth 중심 user schema의 전체 호환은 추가 확인 대상으로 둔다.

이 후보는 온보딩 문서를 아카이브할지 유지할지의 실질적인 판단을 만든다. 현재 실행 명령·인증 방식·스키마 준비·도시 시간대 migration·mock/실DB/실기기의 증거 범위를 연결하되, 도구 설치 버전·외부 서비스 운영 상태를 이번 정적 조사로 확정하지 않는다. 기존 실행 스킬·설정 개편은 별도 범위다.

## 002·004·005에서 계승할 것과 다시 확인할 것

| 자료 묶음 | 이번에 얻은 의미 | 현재성 처리 |
| --- | --- | --- |
| 002-01~05 | 통화 표시, 도시 선별, 용량 부분 실패, API 오류 전달, 서버 직렬화·접근 경계 | 기존 Project에 상당 부분 편입. 다시 같은 국소 보완부터 반복하지 않고 통합 설명과 남은 차이에 활용 |
| 002-06과 10월 후속 | 앱 준비·인증·네트워크·조회·입력·여행 목록·시간대의 축적 | 번호 06의 이름만 보고 앱 초기화에 한정하지 않음. output 후반과 관련 decision·조회 배치 기록으로 범위 확장 |
| 002-07~18 | API·날짜·활성화·폼·표시·저장 후 처리·Local·sync·cleanup·server의 전체 과제 지도 | 정의와 실제 완료는 다름. 색인 전체를 읽었으며 개별 티켓·기록 전부를 읽거나 완료로 확인하지 않음 |
| 002 원래 분석 | 이름과 실제 완료 의미 차이, 입력 초기화, callback, 중복 처리의 조사 질문 | engine/components 본문을 읽고 일부 현재 코드와 대조. 오래된 재시도·초기화 문제는 현재 결함으로 재진술하지 않음 |
| 004 | 날짜·통화·API의 편입 결과와 열린 제품 질문 | 후속 날짜 합의를 반영해 해결된 표현 불일치와 남은 의미 선택을 분리 |
| 005 | app-runtime, policy, form의 설명과 근거 | 재사용 가능한 본문. 전체 목표 수락으로 해석하지 않으며 `.claude`에 남은 부분은 이관 후보 |

## 권장 후속 티켓 구성

02·03은 생성된 Ticket이고 04–08은 권장 범위다. 각 티켓이 근거 대조부터 본문과 선택 이유 재구성·참조 전환·옛 문서 격리 또는 제거·대표 질문 읽기까지 책임진다. 수집과 작성 담당만 나누어 주제의 완성이 빠지는 구성을 피한다.

| 제안 | 독립적으로 완성할 결과 | 우선순위·연결 |
| --- | --- | --- |
| 02 제품·활성화·네트워크 접근 | product와 관련 본문을 재구성해 여행 카드/내용/초안의 다른 보존 의미와 Router·Policy 관계를 설명 | 먼저 권장. 다른 주제의 지원 범위를 이해하는 기반 |
| 03 데이터 저장·동기화·정리 | Local 변경부터 서버 반영·정리까지의 보존 계약과 현재 공백, app-runtime 연결 | 높은 우선순위. 준비 완료·삭제 설명의 근거를 제공 |
| 04 오프라인 준비·지도·경로 | 데이터/지도/경로 완료·실패·재시도와 저장 후 준비의 구별, 오래된 구현 가이드 선별 | 02의 의미를 재사용하고 03의 정리 경계와 맞춤. 자체 조사 착수는 기다릴 필요 없음 |
| 05 구조·계층·UI·schema 개발 기준 | current architecture 재작성, 경로별 가이드 정비, 한정 예외와 일반 기준 구별 | 초기에 착수 가능. 02·04·06의 배치 설명과 조정 |
| 06 작성·입력·날짜 경험 | form/manual-input의 Project 이관, 날짜 본문의 재구성, 초안·picker·저장 경계 연결 | 02의 접근 의미·05의 책임 배치를 활용. 현재 날짜 계약은 유지 |
| 07 통화·API·오류 계약의 남은 선택 | 기존 본문 보완과 선택 가능한 제품 쟁점·영향 제시, 결정된 범위 반영 | 문서 사실 정정은 진행 가능. 새 금액/라벨/오류 계약은 논의 필요 |
| 08 개발 시작·운영 전제·전체 읽기 점검 | 루트/서버/SQL 안내 정비와 전체 현재 경로에서 옛 제품 문서·결정·아카이브를 읽지 않는지 확인 | 온보딩 사실 조사는 조기 가능. 전체 읽기 점검은 주제별 결과를 합쳐 수행 |

02부터 시작하되 03·04를 핵심 후속으로 두는 안을 권한다. 005의 익숙한 세 주제를 다시 반복하는 데 치우치지 않고, 데이터 보존과 오프라인 준비라는 제품 중심을 먼저 복원하기 위해서다. 05는 모든 문서의 위치를 먼저 확정하는 선행 작업으로 만들지 않는다. 07의 서로 다른 제품 선택이 커지면 통화와 오류를 나눌 수 있다.

## 읽은 범위와 남은 조사

- 006 Spec 다섯 문서·현재 상태·티켓 01·source 색인·사용자 방향을 읽었다. 루트 지침은 제공된 전문을 적용하고 현재 document map과 연결을 대조했다.
- `.claude/context` 파일·목차 전체를 펼치고 활성화·입력·구조·Policy·오류의 주요 본문을 읽었다. 큰 묶음의 출력 일부는 생략되어 모든 문장을 완독한 것으로 표시하지 않는다. 지도는 개요·구조·트리거, 경로는 개요·트리거·체크리스트·향후 제안을 선택 읽었다. TypeScript는 목차 수준이다.
- client/server/schema/UI guide 본문과 다섯 symlink를 확인했다. README는 제품 목적·목차·주요 설명, server README는 구조·섹션과 표본을 읽었다. START_GUIDE와 SQL 안내를 조사했으며 외부 링크를 열거나 설치 절차를 실행하지 않았다.
- Project product·architecture·날짜·통화·API·도시·용량 본문과 app-runtime의 주요 본문을 읽었다. 리팩터링 guidance와 app-runtime 형성 자료 전체의 재검토는 남았다.
- 002 output·Ticket 전체 색인·source/분석 목차와 engine/components 본문을 읽었다. 004 Ticket 01·output, 005 output을 읽고 조회 배치 기록과 도시 시간대 결정을 직접 대조했다. 002 모든 records, 나머지 분석 본문, 003 개별 재현 기록, `.claude` sessions/archive 전수 내용은 미확인이다.
- 현재 코드 확인은 Expense 요청 날짜, sync 여행별 대기 조회와 소비자, 준비 상태 metadata, 일정 생성 후 경로 준비, 활성화 지도 호출, server 인증·Trip route·DB 관련 필드, setup SQL에 한정했다. 제품 테스트·실기기·외부 서비스·실DB 검증은 이번에 수행하지 않았다.

추가 조사에서 특히 볼 곳은 002-09/13/14/15/16의 실제 최신 결과·003 재현, offline map/routing의 전체 소비자와 native 준비, TypeScript·runbook·guard의 혼합 책임, server README의 실행/배포 전제다. 이 공백 때문에 현재 지도는 첫 조사 결과이며 전체 이관 확정표가 아니다.

## 조사 근거 접근점

아래 옛 문서 링크는 006의 이관 조사와 그 판단을 재검토하기 위한 원자료 경로다. 최종 Project의 개발 읽기 경로로 재사용하지 않는다. 원본의 격리·제거 결과는 주제별 결과에 남긴다.

- [기존 문서 지도](../../../../../.claude/README.md)
- [현재 Project 진입](../../../../project/README.md)
- [제품 본문](../../../../project/common/product.md)
- [현재 구조](../../../../project/current/architecture.md)
- [활성화와 목록의 이관 전 보존판](../../../../../_archive/selective-activation-pre-project-2026-10-31.md)
- [활성화 실행의 이관 전 보존판](../../../../../_archive/activation-system-pre-project-2026-10-31.md)
- [네트워크·조회 이관 전 원문](../../../../../_archive/policy-architecture-pre-project-2026-10-30.md)
- [입력 수명](../../../../../_archive/form-pre-project-2026-10-31.md)
- [지도 원자료](../../../../../_archive/offline-map-pre-project-2026-10-31.md)
- [경로 원자료](../../../../../_archive/offline-routing-pre-project-2026-10-31.md)
- [구조 원자료](../../../../../_archive/architecture-pre-project-2026-10-31.md)
- [날짜 본문](../../../../project/common/date-and-time.md)
- [통화 본문](../../../../project/common/currency.md)
- [API 본문](../../../../project/guidance/api-contracts.md)
- [앱 실행 본문](../../../../project/current/app-runtime/INDEX.md)
- [002 전체 티켓](../../002-code-readability-refactoring/current/memory/tickets/index.md)
- [002 산출물](../../002-code-readability-refactoring/output/index.md)
- [002 원자료](../../002-code-readability-refactoring/source/codebase-analysis/README.md)
- [조회 배치 선택](../../002-code-readability-refactoring/records/2026-09-29-09-policy-query-ownership-and-migration.md)
- [도시 시간대 결정](../../../../../_archive/trip-time-zone-decision-pre-project-2026-10-31.md)
- [004 열린 선택](../../004-project-context-contracts-and-guidance/current/memory/tickets/01-product-contract-agreements.md)
- [005 산출물](../../005-context-based-code-improvement/output/index.md)
- [개발 시작](../../../../../START_GUIDE.md)
- [SQL 안내](../../../../../apps/server/scripts/README.md)
- [여행별 큐 조회](../../../../../apps/client/src/shared/services/sync/queue.ts)
- [정리 소비자](../../../../../apps/client/src/shared/services/sync/cleanup-job.ts)
- [비활성화 소비자](../../../../../apps/client/src/entities/trip/data/useDeactivateTrip.ts)
- [준비 판정](../../../../../apps/client/src/shared/services/offline-prep/metadata.ts)
- [일정 저장 후 경로](../../../../../apps/client/src/features/schedule/create-schedule/useSubmitSchedule.ts)
- [날짜 입력 계약](../../../../../packages/schema/src/requests/expense.ts)
- [서버 인증](../../../../../apps/server/src/middleware/auth.ts)
- [실제 초기화 SQL](../../../../../apps/server/scripts/setup-dev-db.sql)
