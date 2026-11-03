# 01. 서버가 재전송을 같은 결과로 받기

## 맡은 결과와 범위

같은 사용자가 이미 반영된 일정·경비 생성이나 삭제를 다시 보내도 서버가 성공으로 응답한다. 앱이 응답을 못 받아 다시 보내는 상황이 더 이상 500·404로 실패하지 않게 하는 것이 결과다. 이 결과는 서버 배포만으로 이미 설치된 앱(build 12 포함)에도 적용된다.

| 요청 | 지금 | 이 Ticket 뒤 |
| --- | --- | --- |
| 일정·경비 생성: 같은 사용자·같은 여행의 기존 ID | 500 (중복 키) | 200, 기존 행 |
| 일정·경비 생성: 다른 사용자 또는 다른 여행의 기존 ID | 500 | 409 |
| 일정·경비 삭제: 이미 지운 자기 행 | 404 | 200, 처음 삭제 시각 |
| 일정·경비 삭제: 다른 사용자 행 또는 없는 행 | 404 | 404 |
| 여행 삭제 재전송 | 200 (코드 읽기) | 200을 테스트로 확인 |

[API 계약](../../../../../../project/guidance/api-contracts.md)에 재전송 응답을, [데이터 수명](../../../../../../project/guidance/data-lifecycle/INDEX.md) 42행의 "재전송은 별도 확인 대상" 문장과 push 상태표의 "응답 전 중복 처리 보장은 별도 확인" 칸을 실제 동작으로 고친다.

포함하지 않는다.
- **경비 생성의 부모 Trip·Schedule 소유권 검사:** 003 Ticket 13이 맡으며 별도 커밋으로 한다. 같은 파일이지만 바뀌는 이유가 다르다.
- **"부모보다 기존 행 먼저 확인":** API 계약의 부모 우선 문장과 부딪힌다. 충돌 상황이므로 Ticket 07에서 다룬다.

## 실행 맥락과 접근

**이미 있는 것:** 생성 재전송 처리와 테스트가 작업 트리에 미커밋으로 있다.
- route: [schedules.ts](../../../../../../../apps/server/src/routes/schedules.ts), [expenses.ts](../../../../../../../apps/server/src/routes/expenses.ts)
- 테스트 DB 대역: [test-app.ts](../../../../../../../apps/server/tests/support/test-app.ts)
- 새 테스트: [단위](../../../../../../../apps/server/tests/routes/create.idempotency.test.ts), [PostgreSQL 통합](../../../../../../../apps/server/tests/integration/create.idempotency.test.ts)

`.onConflictDoNothing({ target: id })`로 새로 만들지 않고, 만들지 못했으면 `id + userId`로 기존 행을 조회한다. 같은 여행이면 200, 아니면 409를 돌려준다. 일정 생성은 그보다 먼저 부모 여행을 확인한다. 이 수정은 판단 요청 중 범위를 넘어 만들어졌다([경위](../../../records/2026-11-02-02-create-replay-fix-beyond-scope.md)). 내용은 현재 설계와 맞아 이 Ticket이 이어 쓰는 것을 전제로 설계했다. 다만 사용자는 이 수정을 유지할지 명시적으로 답하지 않았다. 1단계 진행 승인을 받을 때 이 수정의 유지 여부도 함께 묻는다([state](../../state/index.md#사용자-결정을-기다리는-것)).

**남은 것:** 일정·경비 삭제. 실제 쓰기 조건은 그대로 두고, 바뀐 행이 0개일 때만 자기 행이 이미 삭제됐는지 본다. 아래는 구현하지 않은 초안이다.

```ts
const [deleted] = await db.update(schedules).set({ deletedAt: new Date(), /* ... */ })
  .where(and(eq(schedules.id, id), eq(schedules.userId, userId), isNull(schedules.deletedAt)))
  .returning();

if (!deleted) {
  // 0행이면 내 행이 이미 삭제됐는지만 본다. 다른 사용자의 행은 여기서도 보이지 않는다
  const [mine] = await db.select().from(schedules)
    .where(and(eq(schedules.id, id), eq(schedules.userId, userId))).limit(1);
  if (mine?.deletedAt) {
    return res.status(200).json({ success: true, data: { id, deletedAt: mine.deletedAt.toISOString() } });
  }
  return res.status(404).json(/* 지금과 같은 404 */);
}
```

**실행하며 정할 것:** [trips.ts](../../../../../../../apps/server/src/routes/trips.ts)의 여행 삭제는 존재 확인에 `deletedAt` 조건이 없어 재전송해도 200이다. 다만 삭제 시각을 새로 찍고 version을 올린다. 일정·경비처럼 처음 삭제 시각을 유지할지 판단한다. 유지하지 않더라도 200은 테스트로 고정한다. 여행 mutation이 ID만으로 쓰는 공백은 003 Ticket 13의 범위다.

## 완료 조건과 확인 방법

- 통합 테스트로 다음을 확인한다.
  - 생성 재전송 201→200과 행 1개, 동시 요청 [200, 201]
  - 다른 사용자 409와 원래 행 불변, 같은 사용자의 다른 여행 409
  - 삭제 재전송 200과 처음 삭제 시각 유지, 다른 사용자 삭제 404
  - 여행 삭제 재전송 200
- route 단위 테스트가 같은 분기를 다룬다.
- 서버 수정을 잠시 되돌리면 같은 테스트가 이번 증상(중복 키 500, 삭제 404)으로 실패한다.
- server typecheck·build·기존 테스트가 통과한다.
- API 계약과 데이터 수명 문서가 위 응답을 설명하고, 오류 처리 문서의 "status를 조용히 바꾸지 않는다"를 지킨다.

## 현재 상태와 실제 결과

생성 재전송 부분은 작업 트리에 구현돼 있고 미커밋이다. 2026-11-02 당시 결과는 다음과 같다.
- typecheck와 build 통과, 단위 65개 통과, 통합 11개 통과
- 서버 수정만 되돌리면 통합 7개가 `duplicate key … pkey`와 동시 요청 `[201, 500]`으로 실패

이후 재실행하지 않았다. 생성 시점 파일 해시는 [source](../../../source/index.md)에 있다.

삭제 재전송, 여행 삭제 확인과 문서 반영은 아직 시작하지 않았다. 1단계 진행 승인을 기다린다.
