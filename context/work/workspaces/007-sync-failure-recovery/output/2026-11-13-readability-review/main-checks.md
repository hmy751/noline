# 이번 수정의 Main 확인

Main의 `/tmp/noline-readability-20261113/main-checks.md`를 기록 담당자가 읽기용으로 정리했다. 사용자 원문이나 원본과 동일한 복사본이 아니다. 검사 수치·범위·판정과 한계는 유지했다.

기준은 HEAD `8ab15b33` 위의 시작 작업 트리이며 `before/`에 동결했다. `task.patch`는 기존 dirty와 분리한 이번85파일의 diff다. 생산48·기존 검사/설정36·추가 연결한 기존 서버 fixture1이며 인접 공용 UI2는 바꾸지 않았다. 기존 제품·검사·다른 작업 변경을 보존했고 commit·stage·push·배포하지 않았다.

## 범위와 코드 보존 확인

- 여섯 독립 관점이 각각128파일·24,287행을 읽었다. 여섯 coverage의 path·full·누락·중복을 대조했다. 발견53개는 중복 포함이며 Main이 모두 판단하고 같은 의견을 통합했다.
- 최초 시각적 정리는66파일·생략 블록46개를 대상으로 했다. 제어문 단일 블록과 SQL 공백만 정규화한 AST 대조에서 차이0이었다. V4의 여섯 조건은 기존 Prettier와 충돌해 원래 표현으로 복구했다. ignore나 설정을 추가하지 않았으며 마지막3파일의 formatter 정리도 AST 차이0이었다.
- Main은 활성화의 null commit 뒤 바깥 throw, 자식·준비 ID·세션, 폼의 resolver 이후/저장 이후 guard, 합성 HELD 대신 boolean, 보류 수신·알림·ACK, 410 단계와 확정 삭제의 관련 큐 순서를 직접 대조했다.
- 서버 선언 단위 대조에서는 `parentError`와 성공 payload 축소, `requiresWrite` 개명 외 query·lock 본문이 같았다. 확정 삭제 helper의 DB 재획득도 DB reset이 같은 serializer를 거치므로 transaction 도중 새 DB 교체를 허용하지 않는다.

## 최종 검사와 재사용

| 확인 | 결과와 범위 |
| --- | --- |
| client | 수정 전·후 동일한37묶음505개 통과. 마지막3파일 공백 변경은 AST가 같아 직전 실행 근거 재사용 |
| server | 수정 전·후12묶음73개 통과. 로컬 테스트 포트를 허용한 실행이며 실제 PostgreSQL integration은 제외 |
| server 타입 | `tsc --noEmit` 통과 |
| client 타입 | 시작판과 오류 헤더7개가 정확히 같음: Mapbox 좌표 tuple1, OfflinePack 속성2, UI rootDir/filelist4. 새 오류 없음 |
| client lint | 변경66파일의 전후 모두 오류0·기존 경고39. 색상·inline style·no-shadow·no-void 경고 유지 |
| diff | `git diff --check` 통과. 문서 링크·참조 대조는 기록 담당 확인과 연결 |

client 명령은 `node node_modules/jest/bin/jest.js --config apps/client/jest.config.cjs --runInBand --runTestsByPath <manifest의37검사>`다. server 명령은 `node node_modules/vitest/vitest.mjs run --root apps/server`다.

lint는 `apps/client`에서 `--resolve-plugins-relative-to ../../packages/eslint-config`를 사용해 기존 Prettier 검사까지 실행했다. 구현 담당의 최초 도구 호환 오류를 최종 검사 공백으로 남기지 않았다. 영역별 검사는 위 통합 수와 겹치므로 합산하지 않는다.

## 확인하지 않은 범위와 문서 영향

새 native 앱, 실제 JWT, Mapbox·Directions, 실제 PostgreSQL 동시성, Cloud 수신·배포는 실행하지 않았다. 이번 근거는 Node SQLite·mock HTTP 검사와 전후 코드 대조다. 이전 실제 PostgreSQL 결과를 이번 판본의 재실행으로 표시하지 않는다. 가독성은 여섯 관점 비교와 Main 채택 판단이며 사용자의 실제 이해 효과를 새로 입증한 것은 아니다.

Main은 Project data-lifecycle의 현재 사실 표에서 사라진 private 이름 `processedCount`를 “반환 처리 수”로만 정정했다. 미전송 보호로 유예한 경우도 포함한다는 기존 반환 한계와 제품 약속은 그대로다. 새 Personal·Project 정책이나 스킬 변경은 없다.
