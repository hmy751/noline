# 규칙: Auth/User Scope

## 적용 범위

- `apps/server` route와 middleware
- sync endpoint
- user-owned row를 읽거나 쓰는 query/mutation
- local user data를 저장하거나 필터링하는 client 코드

## 규칙

- 보호된 server route는 user data에 접근하기 전에 인증을 확인한다.
- user-owned query는 인증된 사용자의 ownership scope로 필터링한다.
- sync endpoint는 인증된 사용자 밖의 row를 반환하거나 수정하면 안 된다.
- local data는 현재 모델이 기대하는 user ownership 기준에 맞게 분리한다.
- client가 보낸 ownership field를 server-side 검증 없이 신뢰하지 않는다.

## 마무리 확인

- [Guard Map](../guards/README.md)의 Auth/user scope를 확인한다.
- auth transport를 건드렸다면 [Auth Axios Factory decision](../decisions/2025-12-23-auth-axios-factory.md)을 읽는다.
