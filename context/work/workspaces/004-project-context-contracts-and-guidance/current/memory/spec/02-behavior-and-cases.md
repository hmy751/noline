# 요구 동작과 대표 사례

## 제품 계약을 논의할 때

Expense 날짜는 현재 경계마다 다르다. Entity와 수정 request는 `YYYY-MM-DD`를 요구하고 server serializer는 날짜 부분을 반환한다. 생성 form은 timezone datetime을 검증하며 생성 request는 비어 있지 않은 문자열만 요구한다. Local 저장·sync queue는 받은 date를 그대로 사용한다. 이 사실을 확인한 뒤 현지 날짜, timezone 이동, 생성·수정·동기화에서 무엇을 보존해야 하는지 사용자와 논의한다. “client local 입력도 date-only를 강제한다”는 초안 문장은 제품 선택 없이 정정할 수 있는 사실 오류다.

통화는 환산 없이 분리해 보존하는 기존 의미를 유지한다. 기본 통화 경비가 없을 때 첫 그룹이 무엇을 뜻하는지와 ‘주 통화’ 라벨, 표시 0/2자리와 입력 scale·DB precision·합산·반올림의 관계를 구별한다. `1.005 USD`에서 화면의 `toFixed`와 공용 formatter가 다를 수 있다는 관찰은 어느 결과가 옳다는 결정이 아니다. 환산 정책 검토는 새 환산 기능을 만들라는 요구가 아니다.

서버 오류는 문서가 설명하는 `AppError + errorHandler`와 실제 route의 `try/catch + sendInternalError`·직접 envelope가 다르다. 사용자가 볼 메시지·복구와 client `APIError` 연결을 포함해 목표 계약을 논의한다. 스타일이 다른 catch가 있다는 이유만으로 전부 같은 구조로 바꾸지 않는다.

## 지침의 효과를 확인할 때

“다음 API 응답 변경”에서는 공통 계약과 기능별 적용, 일반 조회와 sync tombstone 차이를 문서에서 이해한 뒤 코드로 내려갈 수 있어야 한다. “기존 server guide에서 endpoint 작업 시작”도 새 Project API 본문에 도달해야 한다. Project README에서만 시작한 성공으로 이전 진입 경로까지 확인했다고 보지 않는다.

통화 Owner 이동은 사용자별 경비 통화 선택과 금액·통화 코드/기호의 동시 표시 같은 기존 의미를 보존해야 한다. 새 문서 파일이 생기고 이전 문서가 짧아져도 이 뜻이 빠졌다면 이동은 불충분하다.

Current의 가치는 어떤 검사 기반과 지원 관계가 다음 판단에 필요한지로 본다. 이번 실행의 통과 개수·sandbox 오류·Docker 미실행 사실이 단순히 기존 architecture 문서에 합쳐진 것은 독립 파일을 줄인 것과 별개로 평가한다. 파일 수·문서 길이·정해 둔 API 목차는 성공 조건이 아니다.
