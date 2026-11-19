# 2026-11-19 — `createPack` 완료 시점 문제를 012에서 고치지 않고 Work 008로 넘긴 결정

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이다. 문제 자체의 발견 경위는 [04 코드 작업 기록](2026-11-19-02-ticket04-newarch-code-and-review.md)의 열린 판단 (a)에 있다. 같은 날 소관이 003에서 008로 바뀌어, 커밋 전인 이 기록을 최종 결정에 맞춰 고쳐 썼다.

## 쟁점

04 코드 작업에서 Main이 rnmapbox iOS 구현(`RNMBXOfflineModule.swift`)을 읽어, `createPack`이 타일 다운로드를 시작한 직후 resolve한다는 것을 확인했다. 그래서 `apps/client/src/shared/services/offline-map/download.ts`가 다운로드가 끝나기 전에 `mapDownloaded = true`를 기록할 수 있다. Ticket 04 완료 조건의 "'준비됨'인데 빈 지도가 없다"와 직접 닿아, Ticket 04는 이 Ticket에서 고칠지 사용자 결정이 필요하다고 적었다. 이 문제는 SDK 업그레이드로 생긴 것이 아니라 그 전부터 있던 동작이다.

## 결정이 내려진 과정

**1. 다른 곳에 있으면 012에서는 넘어간다.** 사용자 원문(5876행):

> 이게 다른 티켓에서도 있던것 같거든 기록예외처리 거기 보고서에 유서하게 있으면 넘어가자 우리 워크스페이스에선

Main은 이 문제가 기록된 곳으로 다음을 확인했다(5971·5980행).

- **Work 003 Ticket 05**([오프라인 지도 준비 상태와 재시도](../../003-bug-investigation-and-fixes/current/memory/tickets/05-offline-map-readiness.md)): "실행 맥락"이 2026-09-13 카테고리 조사에서 설치 iOS SDK의 pack 생성 promise가 타일 완료를 뜻하지 않는다는 계약을 확인했다고 적는다. 완료 조건에 pack 생성·진행·완료·실패·취소·재시작의 구별과 iOS 비행기 모드 타일·준비 표시 대조가 있다. 들어간 것은 같은 도시 지도 공유 결함 수정(`c8004d6e`)뿐이라 미완료다.
- **Project 지도 기준**: [map-packs](../../../../project/guidance/offline-maps-and-routes/map-packs.md)는 `await createPack`이 타일 완료 대기가 아니라고, [INDEX](../../../../project/guidance/offline-maps-and-routes/INDEX.md)는 전체 타일 다운로드가 끝나기 전에 `mapDownloaded`가 켜질 수 있다고 현재 동작으로 적는다.

이 확인에 따라 처음에는 003 Ticket 05에 두기로 정리했다.

**2. 사용자가 담당을 008로 바꿨다.** 사용자 원문:

> 003 말고 예외처리 워크스페이스 있잖아  011인가 008 인가 (6017행)

> 008이야 (6043행)

Main은 Work 008(앱의 예외 안내를 상황별 규칙으로 정리하기)을 확인해, 008에는 이 문제가 기록돼 있지 않다고 답했다(6057행). 008의 지도 관련 내용은 위치 권한 거절 모달과, 11월 15일 기록의 "지도·경로의 부분 준비 실패" 장면에 촬영 자료가 더 필요하다는 한 줄뿐이며, 둘 다 실패를 어떻게 알릴지의 질문이라는 설명이었다. Main은 고칠 때 008의 "부분 준비 실패를 어떻게 알릴지"와 이어질 수는 있다고 덧붙였다. 사용자 원문:

> 008로해 (6062행)

## 결론

012에서는 이 문제를 고치지 않고 [Work 008](../../008-exception-notice-rules/README.md)로 넘긴다. 008에는 원래 기록이 없었으므로 [008 현재 상태](../../008-exception-notice-rules/current/state/index.md)에 넘겨받은 과제로 추가했다. 처음 찾고 기록한 곳이 003 Ticket 05라는 사실과 Project 문서의 현재 동작 서술은 그대로다. 003 Ticket 05 문서는 고치지 않았다.

Ticket 04의 완료 조건 "'준비됨'인데 빈 지도가 없다"는 SDK 업그레이드가 지도에 주는 영향, 곧 스타일·pack 호환과 옛 pack 처리로만 본다. 이 범위는 Main이 첫 결정 뒤 답변(5980행)에서 밝혔고 담당이 바뀐 뒤에도 유지된다.

## 함께 찾은 나머지 두 문제

같은 검증에서 찾은 (b) `download.ts`가 `'size'`·`'tileCount' in pack`으로 읽어 늘 0·null로 저장되는 값, (c) `requiredResourceCount = 0`일 때의 진행률 NaN은 이번 결정의 대상이 아니었다. 둘 다 (a)와 같은 `download.ts` 다운로드 경로에 있다. (b)는 Project map-packs가 이미 신뢰할 근거가 없다고 적고 있고 003 Ticket 05의 "flag와 용량 표시가 실제 자원 상태를 반영"과도 가깝다. (c)는 003 Ticket 05의 진행 처리(진행률 0·10%의 ready 처리, 생성·진행·완료 구별)와 가깝다. 소관은 정하지 않았고 012에서는 저우선으로 남아 있다.
