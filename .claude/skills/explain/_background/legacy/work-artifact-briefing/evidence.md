# 작업물 이해 브리핑의 형성 근거

2026-10-21에 사용자가 지정한 외부 연구의 공동 적용 자료에서 원래 이해 지원 설계·품질 보강·Spec/Ticket 연결 기록으로 내려가 확인했다. 아래는 그 문서의 연속 발췌다. 사용자 발화로 표시된 인용도 당시 기록에 보존된 발췌이며, 이번에 최초 채팅 로그 전체를 확보한 것은 아니다. 설계자의 분석·리뷰·정적 검증 보고를 실제 사용 효과와 구별한다.

원 저장소: `/Users/hammyeong-yeon/Desktop/memory-harness-research`. 확인 당시 HEAD는 `40a9f4ef6d087ddbb1d0ace21549ee92a8cf3b1f`, 작업 트리는 clean이었다. 아래 경로는 이 저장소 기준이며 추가 조사용 식별자다. 이 파일의 발췌만으로 가까운 [형성 맥락](context.md)을 검토할 수 있고 외부 저장소 전체 정독을 요구하지 않는다.

## 목표와 분리 이유

출처: `context/analysis/09-tripproof-cognitive-debt/05-current-solution-design.md`, 19~19행. SHA-256: `3d6ee4ca083611d8aed8febc3d94fa5402a5366b4c4a6c8e5a88f8bc7b989806`.

당시 설계자의 선택 이유 설명이다. 외부 자료가 세 스킬 구성을 직접 제시한 것으로 취급하지 않는다.

```text
세 skill을 유지한 이유는 사용자가 하나로 묶지 않기로 선택했고, 위 입력·조사 범위·대화 수명·기대 결과의 차이가 실제로 존재하기 때문이다. 외부 자료가 세 skill이라는 완성 구성을 직접 제시한 것은 아니다. 이름만 다른 공통 template이나 별도 상위 skill로 합치지 않고 반복되는 근거·권한 기준만 공유한다.
```

## 역할에서 실제 연결과 값으로

출처: `context/analysis/09-tripproof-cognitive-debt/05-current-solution-design.md`, 49~51행. SHA-256: `3d6ee4ca083611d8aed8febc3d94fa5402a5366b4c4a6c8e5a88f8bc7b989806`.

역할·값·조건·근거 연결은 원래 설계에도 있었다.

```text
브리핑은 대상의 전체 역할과 대표 흐름에서 시작해 현재 질문에 필요한 component 책임·경계, 실제 연결, source·사용 위치와 실행 근거로 내려가게 한다. File 이름이나 호출 순서를 나열하는 것만으로 사용자가 자기 일과 연결할 수 있다고 가정하지 않는다. 중요한 이름은 처음 등장할 때 그것이 가리키는 데이터나 책임, 사용자가 하려는 일에서의 역할과 함께 설명한다.

추상적인 역할 설명만으로 동작이나 근거 한계가 잘 드러나지 않을 때는 대표 장면의 입력·중간값·결과 가운데 필요한 값을 연결한다. 실제 확인한 값과 설명용 값을 구분하고, 중요한 조건에 따라 결과가 달라지면 그 차이를 함께 보여 준다. Source로 재구성한 동작, 관찰한 실행과 아직 제안한 동작의 지위를 유지한다. 핵심 주장 가까이에 무엇을 확인한 source인지 두어 사용자가 설명과 원자료 사이를 이동할 수 있게 한다.
```

## 자연어 선택의 승인 범위

출처: `workspaces/005-tripproof-cognitive-debt-skill/records/2026-09-06-01-package-quality-review-and-revision-history.md`, 37~39행. SHA-256: `8a6b05db55622bc22bf93e89fe4237d87ef7f394d96b3d8efb6a96423ec33348`.

당시 기록이 사용자와 확정했다고 보고한 선택이다. 원 채팅 전체의 직접 재검증은 아니다.

```text
3. `explanation-recovery`는 직접 호출에 더해 사용자가 특정한 앞선 AI 설명의 뜻·지시 대상·중간 논리를 놓쳤음을 드러낸 상황에서 선택할 수 있다.
4. `work-artifact-briefing`은 직접 호출에 더해 사용자가 이미 존재하는 작업물의 역할·흐름·실제 연결·현재 상태·근거 범위를 이해하려는 상황에서 선택할 수 있다.
5. 두 implicit entry는 사용자의 실제 이해 요청에 맞춰 skill을 선택한다는 뜻이다. 사용자가 아직 발견하지 못한 silent semantic failure를 AI가 먼저 찾고 개입하는 책임은 포함하지 않는다.
```

## 구조 표현의 근거 상한

출처: `context/analysis/09-tripproof-cognitive-debt/06-work-artifact-briefing-visual-structure-analysis.md`, 62~73행. SHA-256: `672184636c3457ab1b6715465fb9fd64472f79257dee286b1be22d55e446e47a`.

영상 원문이 아니라 당시 분석의 한계 진술을 보존한다. 이번에 영상을 새로 검증하지 않았다.

```text
### 영상에서 직접 가져올 수 없는 것

Source 02는 다음을 직접 입증하거나 규칙으로 제시하지 않는다.

- 모든 AI 브리핑에 다이어그램을 넣으면 이해가 쉬워진다는 보편 효과
- 정적인 Markdown 구조도가 영상의 interactive visualization과 같은 효과를 낸다는 것
- Flow, tree, map과 table을 상황별로 고르는 response 규칙
- 시각화가 실제 이해 시간이나 인지피로를 얼마나 줄였는지에 관한 측정
- BAML 전용 click·zoom UI, typed CLI와 모든 function 독립 실행을 일반 AI 설명에 그대로 옮길 수 있다는 것
- 구조 그림이 현재 runtime 수행이나 invariant 준수를 증명한다는 것

보존된 source에는 한국어 번역문은 있지만 영상 화면 snapshot과 demo의 실제 code·결과가 없다. 따라서 현재 확인한 것은 발표자가 설명한 demo 동작이며, 화면 표현의 충실도나 이해 효과를 독립 검증한 것은 아니다. [`Source 보존 상태`](../../../../source/02-bKT2wOec_rg/source.md), [`기존 분석의 증거 한계`](../../../../work-artifact-briefing/02-bKT2wOec_rg.md#이-영상과-분석의-한계)
```

## 구조의 이득과 제약 보강

출처: `workspaces/008-tripproof-cognitive-debt-package-adoption/records/2026-09-06-03-quality-review-revision.md`, 10~12행. SHA-256: `33a34d88d48277b9f8990cc5399e23b6c2edbebe7c501ab908ab03af52405cbb`.

2026-09-06 보강 반영 기록. 같은 문서가 사용자 승인 발화를 “좋아 반영해보자”로 보존한다. 실제 사용 효과의 승인은 아니다.

```text
- [작업물 브리핑](../../../../../context/analysis/09-tripproof-cognitive-debt/v0/payload/.agents/skills/work-artifact-briefing/SKILL.md)에 다음 변경·선택이 목적일 때의 조건부 설명을 넣었다. 중요한 구조 선택의 이득과 남는 제약을 현재 질문에 필요한 부분에서 연결한다. 당시 이유는 보존 근거로 확인할 수 있을 때만 말하고 현재 구조에서 도출한 효과와 구분한다. 모든 구조의 장단점·선택 이력을 조사하거나 일반 동작 설명을 architecture review로 확대하지 않는다.
- [출력 preview](../../../../../context/analysis/09-tripproof-cognitive-debt/v0/OUTPUT-PREVIEW.md)에 다음 변경을 준비하는 별도 가상 사례를 추가했다. 역할 분리로 어디부터 읽을 수 있고 무엇은 기존 함수 안에 남아 있는지 설명하되, 실제 수정 비용·실행 효과·당시 의도는 주장하지 않는다. 앞선 TripProof 기본 구조 예시와 짧은 설명 복구 예시는 유지했다.
- [Package README](../../../../../context/analysis/09-tripproof-cognitive-debt/v0/README.md)에 이번 보강의 의미와 조건을 연결했다.
```

## 공동 적용의 선택

출처: `context/analysis/07-tripproof-spec-driven-continuity/06-judgment-and-understanding-application/01-joint-application-decisions.md`, 7~7행. SHA-256: `7ea2231cb142eea77bde3857a0fc7efa325fff2e820ee3739c5d46481db20aa5`.

2026-09-08 공동 적용 판단. 책임 중복을 가정해 강제 순서를 만들지 않은 이유다.

```text
**기존 네 스킬을 각각 유지한 채 한 배포 묶음으로 둔다.** 문구 대조와 제3 리뷰에서 함께 사용하기 위해 반드시 수정해야 할 충돌은 확인되지 않았다. 따라서 역할 재분할, 호출 우선순위, 강제 순서나 상호 호출을 새로 만들지 않는다. 이미 특정 프로젝트의 구조가 일부 들어 있으므로, 진입 안내와 동반 지침을 조금 일반화한 [v0 사본](../../../../work-artifact-briefing/_background/v0/README.md)을 준비한다.
```

## Spec/Ticket과 실제 결과

출처: `context/analysis/07-tripproof-spec-driven-continuity/08-skills-spec-ticket-integration/01-discussion-decisions.md`, 107~111행. SHA-256: `34918b572b841f0d2bea6efa426aa6978eb62fdde0b77ee1b59ca8ad795eb0f7`.

후속 연결 논의의 원문. 작성 당시의 미설치·미반영 상태와 후속 완료 상태를 섞지 않는다.

```text
### work-artifact-briefing

Spec에서 무엇을 이루려 했고 어떤 기준을 지켜야 하는지, Ticket에서 실행을 어떻게 나눴고 어디까지 진행됐다고 기록했는지 확인한다. 실제 코드·산출물·검증 결과도 함께 보면서 사용자가 묻는 작업물의 역할과 현재 상태를 설명한다.

예를 들어 작업이 어디까지 됐는지 묻는다면 Ticket의 완료 표시와 실제 결과가 Spec의 어떤 요구까지 충족하는지를 연결해 설명할 수 있어야 한다. Spec·Ticket을 읽었다는 사실로 실제 구현·수행·검증을 대신하지 않는다. 기존의 질문 범위와 근거 구별 원칙을 Spec·Ticket에도 적용하며 모든 설명에 전체 Spec·모든 Ticket을 읽히는 규칙을 추가하지 않는다.
```

## 원래 문제의 구체적인 대체와 시점 진단

당시 분석의 중심 진단이다. 원래 대화 전체가 아니라 그 분석 문서를 보존한다.

출처: `context/analysis/09-tripproof-cognitive-debt/03-integrated-causal-map-and-solution-obligations.md`, 15~29행. SHA-256: `f01f723f746f596eaf598020c25ed322d6457351683e943061144846afe74d46`.

```text
## 중심 결론

TripProof에서 강하게 확인되는 문제는 사용자의 목적을 처음부터 전혀 이해하지 못한 것이 아니다. 사용자와 AI가 제품 목적과 기술적 기대를 함께 확인한 뒤에도 그 판단이 `작업 선택 → 미룰 범위 → 구현 → 근거 해석 → 완료 설명 → 다음 행동`으로 이동할 때 더 쉽게 만들고 측정할 수 있는 국소 산출물로 대체됐다.

실제 LLM 판단은 proposer interface로, 서버 전체의 readable flow는 세 번의 유효한 refactor와 56개 test 통과로 약해졌다. 사람이 읽을 답변을 만드는 제품 책임 대신 raw `facts[]`를 화면에 연결하자는 안은 구현된 실패가 아니라 계획 단계에서 같은 약화가 일어날 수 있음을 보여 준 사례다. 이 산출물들은 각각 가치가 있었지만 원래 목표와 같은 것은 아니었다. 사용자가 결과를 보고 다시 물었을 때 AI가 빠진 문제를 곧바로 다시 찾은 사례는 정보가 전혀 없었다기보다 **그 판단이 필요한 순간에 소비되지 않았음**을 보여 준다. 자세한 흐름은 [`07 대화 장면 분석`](../../../../work-artifact-briefing/07-tripproof-spec-driven-continuity/04-conversation-scene-analysis.md)의 `세 장면에서 반복된 흐름`과 `구체화된 중심 진단`에 있다.

따라서 여기서 줄이려는 인지부채는 단순한 정보량이나 어려운 문장의 양이 아니다.

> AI의 응답·계획·작업물·근거가 다음 판단이나 행동의 안정된 전제가 되는데, 그 전제의 목적·의미·근거 범위·영향·미확정·현재 권위를 사람이 충분히 파악하지 못한 상태에서 나중의 재질문·재조사·재판정·재작업 비용이 생기는 것

모든 세부를 사람이 완전히 이해하거나 기억해야 한다는 뜻은 아니다. 직접 이해할 범위와 의식적으로 위임할 범위는 그 결과로 내릴 다음 판단, 잘못됐을 때의 영향과 되돌리기 가능성에 따라 달라진다. 위험별로 무엇이 충분한 이해인지 검증된 기준은 아직 없다.

정확하고 쉬운 설명은 사람이 반대하거나 추가 근거를 요구하고 판단을 보류하기 위한 중요한 개입이다. 그러나 설명만으로 원래 전제와 source의 정확성, evidence의 입증 범위, artifact의 현재성, 사람 자신의 판단과 다시 열 조건까지 보장되지는 않는다. 인지부채의 전체 해답을 설명 문제로 좁히지 않는다.

인지피로 감소는 별도의 최상위 목표가 아니라 개입의 비용과 제약이다. 먼저 다음 판단에 필요한 의미·전제·위험·미확정을 보존하고, 그 이해에 기여하지 않는 반복 설명·용어 번역·재탐색·맥락 재구성 부담을 줄인다. 짧은 설명이나 AI가 대신 내린 판단을 성공으로 취급하지 않는다.
```

## 호출 시점의 대안과 남긴 한계

사용자 요청·AI 자기 호출·작업 경계 호출·독립 검토의 후보 비교다. 비교된 후보 전부의 채택 기록이 아니다.

출처: `context/analysis/09-tripproof-cognitive-debt/04-integrated-solution-candidates.md`, 71~205행. SHA-256: `e822b03682bb0d36322084d08d061754534f9806345d96dba25352c679cb9d74`.

````text
## 후보 A — 사용자가 필요할 때 직접 호출한다

### 책임 배치와 작동 시점

사용자가 작업 논의에서 이 구체화·이해 지원을 명시적으로 요청하거나, AI 응답에서 이해를 잃었다고 알리거나, code·작업물의 구조와 현재 상태를 알고 싶다고 말했을 때 005 실행 책임이 시작된다. 일반 작업 논의를 시작한 것만으로 자동 발동하지 않는다. 명시 호출은 사용자의 의도와 기대되는 작동 경계를 관찰 가능하게 하고, 누락됐을 때 일반 prose rule보다 실패를 지적하기 쉽게 한다. Skill이 실제로 load되고 모든 책임이 수행됐다는 것까지 호출 자체가 보장하지는 않는다.

평소 AI가 자기 판단으로 깊은 설명을 자동 시작하지 않는다. AI의 일반적인 사실성·권한·증명 상한 계약은 계속 지켜야 하지만, 그것이 005의 효과나 silent failure 예방으로 계산되지는 않는다.

### 정보 흐름과 결과

```text
사용자의 이해 요청
→ 005가 대상·사용 목적과 기준 상태를 확인
→ 현재 source와 필요한 과거 이유 조사
→ 의미·근거·미확정·판단 경계 설명
→ 사용자가 다음 질문·판단·보류를 선택
→ durable 변화가 있으면 별도 Owner 인수 요청
```

실제 인수자가 없으면 finding은 `아직 인수되지 않음`으로 남고, 현재 판단을 막는지 현재 설명 범위만 제한하는지 사용자에게 알린다.

### 강점

- 사용자가 필요성을 느낀 순간과 기대 동작을 명시해 실패 경계를 볼 수 있다.
- 작업 전 인터뷰·구체화의 기존 방식을 자동 절차로 덮지 않는다.
- 깊이와 비용에 대한 최종 통제권이 사용자에게 있다.
- 현재 구체화한 005 단독 책임 범위에서 성립하며 07이나 상시 reviewer가 있다고 가정하지 않는다.

### 한계

- 사용자가 간극을 감지하지 못하면 호출되지 않는다.
- 설명 전에 이미 잘못 닫힌 completion claim이나 제품·코드 불일치를 자동 발견하지 않는다.
- TripProof의 silent judgment failure 전체를 해결하지 않고, 사용자가 이해를 요구한 뒤의 재구성 부담을 줄이도록 설계하는 데 한정된다.

### 증명 상한

이 후보가 약속할 수 있는 것은 **호출된 대상에 대해 판단에 사용할 수 있는 설명 기반을 만드는 것**이다. 사용자가 먼저 발견하지 않아도 모든 간극이 노출된다고 말할 수 없다.

## 후보 B — 응답을 만든 같은 AI가 필요성을 스스로 판단해 호출한다

### 책임 배치와 작동 시점

응답 AI가 새 plan·scope·completion·acceptance처럼 중요하다고 판단한 순간 또는 자기 claim보다 evidence가 좁다고 판단한 순간 005 실행 책임을 함께 수행한다. 별도 주체나 workflow가 필요하지 않다.

### 정보 흐름과 결과

```text
AI가 응답 작성
→ 같은 AI가 중요도·불확실성·근거 범위를 판별
→ 필요하다고 보면 005 설명 수행
→ 사람에게 claim·evidence·판단 경계 제시
```

### 강점

- 사용자가 혼란을 먼저 표현하지 않아도 개입할 수 있다.
- 별도 runtime이나 reviewer 없이 일반 대화 안에서 작동할 수 있다.
- AI가 이미 알고 있는 evidence 상한과 미확정을 더 일찍 드러낼 수 있다.

### 한계

TripProof에서는 같은 AI가 상위 판단을 알고도 완료 순간에 소비하지 못했다. 이 후보는 그 AI에게 다시 `중요한 순간`, `핵심 책임`, `충분한 근거`를 올바르게 판별하라고 맡긴다. 일반 instruction이 실제 행동 순간에 소비된다는 보장도 없다.

자기 claim이 인용한 evidence보다 문언상 넓다는 것은 발견할 수 있어도, AI가 놓친 제품·코드 불일치를 독립적으로 찾는 장치는 아니다. 작동하지 않은 경우가 사용자에게 보이지 않는다는 점도 크다.

### 증명 상한

보조 경로로는 유용할 수 있지만 단독 예방 장치로 채택할 근거는 부족하다. 특히 “사용자가 먼저 발견하지 않아도 대리 승격을 막는다”고 약속할 수 없다.

## 후보 C — 미리 정한 작업 경계가 005를 호출한다

### 책임 배치와 작동 시점

응답 AI의 자기 판단이 아니라 workflow·host·작업 계약이 completion claim, scope 변경, handoff, acceptance 요청 같은 명시적 event에서 005를 호출한다. 호출에는 현재 claim, 기준 목표·범위, 사용한 evidence와 기준 상태가 입력돼야 한다.

### 정보 흐름과 결과

```text
명시 event 발생
→ workflow가 005 호출과 필수 입력을 요구
→ 005가 주어진 claim·evidence의 의미와 상한 설명
→ 사용자 또는 다음 책임자가 판단
→ 인수 여부가 별도로 결정됨
```

### 강점

- `필요한 행동 순간에 규칙이 실제로 소비돼야 한다`는 05 회고의 인과에 직접 대응한다.
- 같은 AI가 호출 여부를 전부 결정하지 않는다.
- Completion과 handoff처럼 이름 붙일 수 있는 경계에서는 누락 여부가 보인다.

### 한계

- 어느 event가 충분히 중요한지와 필요한 입력을 누가 정할지 별도 설계가 필요하다.
- Event 호출은 시점을 보장할 뿐, 상위 목적과 현재 artifact의 숨은 불일치를 새로 발견하지 않는다.
- 모든 completion에 무거운 설명을 강제하면 후보에서 제외한 전면 고정 방식으로 돌아갈 수 있다.
- 현재 005 Workspace에는 이 호출 workflow와 실제 consumer acceptance가 구현돼 있지 않다.

### 증명 상한

이 후보는 설명 책임의 **호출 시점**을 더 강하게 만들 수 있지만 semantic review를 대신하지 않는다. 어떤 경계에 어떤 깊이로 적용할지는 아직 열린 설계다.

## 후보 D — 독립적인 finding 생성과 005 설명을 분리한다

### 책임 배치와 작동 시점

별도 reviewer 또는 07 판단 연속성 책임이 상위 목적·현재 판단과 plan·code·result를 대조해 새로운 충분성·불일치 finding을 만든다. 005는 그 finding, 근거와 증명 상한을 사람이 이해하고 판단할 수 있게 설명한다. 사용자의 직접 호출도 별도 입구로 유지한다.

### 정보 흐름과 결과

```text
별도 review·판단 대조
→ bounded finding + 근거 + 미확정
→ 005가 현재 사람의 질문과 의미 구조에 맞게 설명
→ 사용자의 채택·보류·추가 근거 요구
→ 실제 실행·완료·과거 결과 재판정 책임이 별도 인수
```

005는 finding을 쉽게 만드는 과정에서 범위를 넓히거나 최종 verdict로 바꾸지 않는다. Reviewer도 사람의 acceptance를 대신하지 않는다.

### 강점

- 응답을 만든 같은 AI의 blind spot과 설명 책임을 분리한다.
- 사용자가 먼저 code와 목표를 대조하지 않아도 불일치가 제기될 수 있다.
- 005는 고유 책임인 의미·근거·판단 연결에 집중한다.

### 한계

- 독립 reviewer와 07 판단 연속성은 현재 005의 기존 인수 Owner가 아니다. 특히 07은 아직 연구 중인 방향이다.
- Finding을 누가 언제 요청하고, 어떤 baseline을 고정하며, 누가 실제로 수락하는지가 없으면 read-only 보고서로 끝난다.
- Review 비용과 오탐, finding 없는 일반 이해 요청은 별도로 다뤄야 한다.

### 증명 상한

TripProof의 silent semantic failure까지 다루려면 가장 직접적인 책임 분리지만, 지금 존재하는 005 단독 해결안으로 말할 수 없다. 07 또는 별도 review 설계와 명시적으로 결합해야 하는 시스템 후보다.
````

## 값과 조건을 연결한 당시 브리핑 전체

작성자가 보강한 설명용 preview다. 코드 기준은2026-09-04 TripProof commit 8b1418d6e67c7897e933af3c8eaf0c76547c5d9b이며 test·live runtime을 실행하지 않았다. 체크인·체크아웃 값과 후반 구조 분리 사례는 실제 관찰값이 아니다.

출처: `context/analysis/09-tripproof-cognitive-debt/v0/OUTPUT-PREVIEW.md`, 94~159행. SHA-256: `42b7fd8dcff620fe18e2038e21521cea4b1a7e1a18298a85e862dadf50b222d9`.

````text
## 3. `작업물 이해 브리핑`

요청:

> 지금 TripProof의 answer 생성 구조가 실제로 어떻게 이어지는지 작업물 이해 브리핑해줘.

응답:

> ### 작업물 이해 브리핑 — 현재 TripProof answer 생성 구조
>
> 결론부터 말하면 현재 구조는 raw facts 전달이 아닙니다. 검색된 원문에서 LLM 후보를 만들고, code certification을 통과시켜 `ChatAnswer`로 만든 뒤 API와 client가 사용자용 상태·문장·근거만 표시합니다.
>
> 아래는 live trace가 아니라 current source와 기본 configuration에서 확인한 대표 기본 wiring입니다. 대괄호 이름은 이해를 위해 묶은 의미 단계이고, 화살표는 기본 처리와 data 변환 방향을 나타냅니다. 현재 질문과 직접 관련 없는 branch는 생략했습니다.
>
> ```text
> [질문 접수]
> ChatWorkspace · App.ask · POST /api/questions
>        ↓
> [근거 context 구성]
> AskQuestionUseCase · QuestionContextRetriever · AnswerContext
>        ↓
> [답변 후보 생성]
> OllamaLibraryChatAnswerComposer · AnswerCandidate
>        ↓
> [검증과 사용자 상태 확정]
> Certification · ChatAnswer
>        ↓
> [API 투영과 화면 표시]
> QuestionResponse · ChatWorkspace의 body·state·evidence
> ```
>
> 사용자의 질문은 `apps/client/App.tsx:56`에서 읽을 준비가 된 자료들의 ID와 함께 전송됩니다. `apps/server/use_cases/questions.py:86`의 `AskQuestionUseCase.run`은 자료 범위 확인, 원문 검색, 답변 생성, 응답 변환을 순서대로 연결합니다. `apps/server/use_cases/question_retrieval.py:59`의 `QuestionContextRetriever.retrieve`는 원 질문으로 먼저 검색한 뒤 필요한 근거별 검색 결과를 모읍니다. 이때 답변 생성에 넘길 질문·선택된 원문과 검색 정보를 담는 것이 `AnswerContext`입니다.
>
> `apps/server/answers/library_chat.py:143`의 `OllamaLibraryChatAnswerComposer.compose`는 LLM payload를 `AnswerCandidate`로 정규화합니다. 후보는 아직 최종 상태나 사용자 문장이 아닙니다. 기본 설정에서는 LLM이 제안한 상태를 `apps/server/answers/certification.py:10`의 `certify`가 ceiling으로 삼고 evidence snippet과 값의 grounding을 검사합니다. `EntailmentVerdict`를 사용하는 분리 경로는 구현돼 있지만 현재 기본값은 disabled이므로 위 대표 기본 흐름에 넣지 않았습니다.
>
> 이 단계의 의미를 설명용 값으로 보면, 질문은 “체크인은 몇 시부터야?”, 검색된 원문은 “체크인 15:00”, 답변 후보의 값은 `15:00`이라고 둘 수 있습니다. `AnswerCandidate`는 이 값과 인용 원문, LLM이 제안한 확인 상태를 담습니다. `certify`는 인용 문장과 값이 원문에 실제 있는지 등을 확인하며, LLM이 미확인·추가 검토로 제안한 답을 더 강한 확인 상태로 올리지 않습니다.
>
> 하지만 원문과 후보가 모두 “체크아웃 11:00”을 가리킨다면 문장과 값이 원문에 있다는 사실만으로 체크인 질문에 맞는 답인지 알 수는 없습니다. `apps/server/answers/certification.py:10`의 기본 검사는 질문 문장을 읽어 답과 의미를 대조하지 않습니다. 따라서 이 검사 통과를 질문과 답의 의미까지 맞다는 보장으로 읽으면 안 됩니다. 위 값들은 실제 실행에서 관찰한 입력·출력이 아니며, 이 대비만으로 전체 제품의 오답이나 분리된 의미 판정 경로의 성능을 판정하지 않습니다.
>
> Certification 뒤 `apps/server/answers/library_chat.py:1205`의 `_item_from_certification`이 `ChatAnswerItem`의 최종 state, value, evidence와 기본 body를 만듭니다. 기본 enabled인 body synthesis는 이 인증된 item의 문장만 다시 쓰며 state·value·evidence를 바꾸지 않는 계약입니다. API는 certification reason, condition candidate, trace와 raw facts를 제거하고 `summary`, `body`, `evidenceState`, `value`, `evidence`만 내보냅니다. API test도 응답에 `facts`가 없음을 명시합니다.
>
> React는 `apps/client/App.tsx:78`에서 summary를 assistant message로 저장하고, `apps/client/components/ChatWorkspace.tsx:101`에서 item body, 상태 pill과 원문 snippet을 rendering합니다. `supported`이면서 evidence가 있는 item만 evidence-backed draft가 되고, 나머지는 빈 값을 사람이 채우는 manual draft가 됩니다.
>
> 현재 근거의 한계도 있습니다. `accepted`는 요청 처리가 끝났다는 뜻이지 답이 `supported`라는 뜻이 아닙니다. `conflict`는 schema와 UI에는 있지만 기본 certification에서 `needs_review`로 낮아져 end-to-end 완료 상태가 아닙니다. Backend test는 fake composer·repository·judge를 많이 사용하고 client component/e2e test는 없습니다. 이번 브리핑에서는 test나 live Supabase·Ollama 실행을 하지 않았으므로 실제 답 품질과 외부 배선 성공은 확인 범위 밖입니다.
>
> 다음 drill-down은 retrieval이 어떤 source를 고르는지, candidate가 certification에서 왜 강등되는지, body synthesis가 무엇을 바꿀 수 있는지, client draft 전환 중 하나를 고르면 됩니다.

이 결과는 file 목록에 머물지 않고 entry point부터 UI consumer까지를 의미 단계로 먼저 묶고, source와 기본 configuration에서 확인한 대표 wiring이라는 범위를 밝혔다. 중요한 이름을 실제 역할과 연결하고, 설명용 값으로 근거 검사의 한계가 현재 질문에 무엇을 뜻하는지 보여 준 뒤 내부 변환과 proof ceiling을 exact source로 펼쳤다. Disabled 경로를 기본 흐름과 구분하며 다른 설명 결과를 선행 입력으로 사용하지 않았다. 추가한 원문·값 대비의 근거는 2026-09-05 같은 commit의 `question_retrieval.py`와 `certification.py`에서 다시 확인했으며 실행 관찰은 하지 않았다.

### 다음 변경을 준비하는 브리핑

아래는 설명용 가상 사례다. Source에서 다음 구조를 확인했다고 가정한다. HTTP 요청·응답 변환, 질문 처리 순서, 실행 기록을 남기는 일은 분리돼 있다. 질문 처리 함수는 검색과 답변 생성을 호출하며, 검색 순위와 근거 부족 때의 답변 기준은 각 검색·답변 생성 함수 내부에 남아 있다. 실행·개발 이력은 확인하지 않았고 실제 TripProof의 현재 구조나 성능을 주장하지 않는다.

요청:

> 이 분리 덕분에 다음 변경에서 뭐가 쉬워진 거야? 근거가 없을 때 답하는 방식을 바꾸려면 어디를 봐야 하는지도 설명해줘.

응답:

> 질문 처리 순서를 살필 때 HTTP 요청·응답 변환과 실행 기록의 세부 구현을 함께 읽지 않고, 검색·답변 생성을 연결하는 함수부터 볼 수 있습니다. 세 책임을 분리한 구조에서 도출되는 이점입니다.
>
> 다만 근거가 부족할 때 어떤 답을 내는지까지 별도 책임으로 분리된 것은 아닙니다. 지금 바꾸려는 기준은 답변 생성 함수 안에 있으므로, 다음에는 그 함수가 근거 부족을 판단하는 조건과 반환하는 답을 확인해야 합니다. 이번 분리가 그 기준까지 정리했다는 뜻은 아닙니다.
>
> 이는 가정한 source 구조에서 읽을 수 있는 변경·이해 범위의 설명입니다. 실제 수정 비용이나 실행 효과는 확인하지 않았고, 작성자가 당시 이 이유로 분리했는지도 알 수 없습니다.

영향 설명을 별도 review로 미루지 않으면서 다음 변경에 도움이 되는 이득·남은 제약을 연결한다. 이 설명만으로 구조의 최종 수용, 추가 refactor나 작업 중단을 결정하지 않는다. 실제 작업물 브리핑에서는 각 주장 가까이에 확인한 file·symbol을 붙이며, 여기서는 가상의 사실 관계만 제공했으므로 존재하지 않는 source 링크를 만들지 않았다. 단순 동작 설명이나 한 값 질문에 이 예시를 덧붙이지 않는다.
````
