# 작업 관련 남은 코드 정리의 선별 커밋

2026-11-14. 여행 목록·사본 정리 보호 커밋과 기록182b1c52 뒤, 사용자는 이번 작업과 관련된 나머지 코드 정리도 커밋하도록 요청했다.

> 사용자: “다 하고나면 아까 나머지 코드 우리 작업관련 나머지 코드 정리 부분 도 커밋해줘”

위 인용은 Main이 전달한 최신 사용자 발화다. Work007 관련66파일(client54·server8·schema4)을 **f4faf7f3** `refactor(sync): 복구 관련 코드와 회귀 검사를 정리한다`로 커밋했다.1223줄 추가·1236줄 삭제이며 선택한66파일의 원본 내용을 더 수정하지 않고 커밋했다.

이번에는 미사용 비활성화 반환 제거, savedCount 개명, Zod 검증 뒤 중복 날짜 검사 제거, helper 이름과 소비자 연결 정리, sync API 오류 로그에 원문 대신 상태만 남기는 변경을 포함한다. Object.hasOwn 변경은 상속 키를 거절하는 경계 강화이므로 순수 포맷 변경으로 기록하지 않는다. 짧은 독립 감사는 이 핵심 연결에서 blocker 없음을 반환했다.

별도 UI008, 다른 범위 문서, 서버 통합 검사 환경 설정, .pnpm-store는 제외한다. 앞선 여행 목록fffab93d·사본 정리 보호6caa8846 및 해당 기록은 유지한다. 제외된18개 tracked 변경은 유지했다. 이번 선별 커밋을 모든 작업 트리 변경의 정리·배포·Work007 전체 완료로 확대하지 않는다.

## 확인 결과와 한계

Main은 정확히 선택한66파일만 HEAD 위에 반영한 격리본 `/tmp/noline-code-cleanup-commit/tree`에서 확인했고, 스테이징 내용과 검사 후보의 byte 일치를 확인했다. client의 변경 관련25묶음370개, server5묶음46개와 server 타입 검사가 통과했다. 로그는 같은 임시 폴더의 `client-tests.log`, `server-tests-retry.log`에 남겼다. 첫 server 실행은 listen EPERM으로 막혔지만 허용 환경에서 다시 실행해46개가 통과했다.

client 타입 검사는 격리 환경에서8개 오류가 있었다. 같은 환경에서 HEAD client로 교체한 baseline을 재실행한 전체 출력이 byte 단위로 같아 이번 변경으로 추가된 오류는 없었다. 기존 TimeField·mapbox·offline-map4개와 UI rootDir/include4개이며, `client-types.log`·`client-types-baseline.log`에 근거가 있다. 앞선 다른 판본의7개 오류 수치와 섞지 않는다. 실제 PostgreSQL·native·배포는 실행하지 않았다.

기록 담당자는 Main이 전달한 사용자 발화와 최종 선별·감사·검사·커밋 결과를 근거로 기존 진입 문서를 갱신했다. 이번 후속 대화 전문을 직접 읽은 것으로 주장하지 않는다. 제품·과거 기록·다른 Work·Personal·Project는 수정하지 않는다.
