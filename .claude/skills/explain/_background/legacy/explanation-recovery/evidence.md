# 설명 복구의 형성 근거

2026-10-21에 사용자가 지정한 외부 연구의 공동 적용 자료에서 원래 이해 지원 설계·품질 보강·Spec/Ticket 연결 기록으로 내려가 확인했다. 아래는 그 문서의 연속 발췌다. 사용자 발화로 표시된 인용도 당시 기록에 보존된 발췌이며, 이번에 최초 채팅 로그 전체를 확보한 것은 아니다. 설계자의 분석·리뷰·정적 검증 보고를 실제 사용 효과와 구별한다.

원 저장소: `/Users/hammyeong-yeon/Desktop/memory-harness-research`. 확인 당시 HEAD는 `40a9f4ef6d087ddbb1d0ace21549ee92a8cf3b1f`, 작업 트리는 clean이었다. 아래 경로는 이 저장소 기준이며 추가 조사용 식별자다. 이 파일의 발췌만으로 가까운 [형성 맥락](context.md)을 검토할 수 있고 외부 저장소 전체 정독을 요구하지 않는다.

## 앞선 발화가 복구 대상인 이유

출처: `context/analysis/09-tripproof-cognitive-debt/05-current-solution-design.md`, 39~45행. SHA-256: `3d6ee4ca083611d8aed8febc3d94fa5402a5366b4c4a6c8e5a88f8bc7b989806`.

당시 설계자의 설명이다. verdict 예시는 설명용이며 실제 출력 시험의 관찰로 취급하지 않는다.

```text
설명 복구는 사용자가 가리킨 **실제 앞선 응답의 뜻**에서 시작한다. 같은 단어의 일반 정의나 codebase에 있는 동명 symbol로 대상을 바꾸지 않는다. 직접 답과 가장 가까운 누락을 먼저 연결하고, 그것으로 부족할 때 마지막으로 의미가 공유됐던 지점과 필요한 전제까지 돌아간다. 원뜻의 조건·한계를 유지하고, 새 라벨이나 비유를 늘려 막힘을 덮지 않는다.

예를 들어 앞선 말의 `verdict`를 묻는다면 “판단”이라는 동의어만 주는 데서 끝내지 않고, 그 문장에서 근거를 본 뒤 결과를 받아들일지 보류할지 정하는 결론을 뜻했는지 설명한다. 앞선 문장을 확인하지 못했고 가능한 뜻에 따라 답이 달라지면 대상을 확인하거나 현재 해석이 추정임을 밝힌다.

**원뜻 복구와 원래 주장의 타당성 인정은 다르다.** 뜻 질문과 이의 제기가 함께 있으면 둘 다 답한다. 대화나 읽은 근거에서 실제 오류·모순·잘못된 추론을 확인했다면 문제가 된 연결과 무엇을 유지·정정·철회하거나 아직 판단하지 못하는지 보여 준다. 재설명 중 결론이나 제안이 달라졌다면 달라진 뜻을 원래부터 했던 말처럼 쓰지 않는다. 반대로 사용자가 혼란을 알렸다는 이유만으로 원래 주장을 오류로 단정하지 않는다.

대화만으로 복구할 수 있으면 repository와 공통 guidance를 먼저 읽지 않는다. 사실 부족이나 의심되는 사실 오류가 현재 답을 바꾸고 대화로 확인할 수 없는 부분에 한해 source를 조사한다. 정정은 확인한 발화·사실·추론에서 설명하며 AI의 숨은 의도를 만들어내지 않는다. 설명 안의 정정이 과거 전체 감사, 구현·문서 수정이나 작업 범위 재합의를 자동으로 시작하게 하지는 않는다.
```

## 초기 무거움과 분리 유지

출처: `workspaces/005-tripproof-cognitive-debt-skill/records/2026-09-06-01-package-quality-review-and-revision-history.md`, 27~29행. SHA-256: `8a6b05db55622bc22bf93e89fe4237d87ef7f394d96b3d8efb6a96423ec33348`.

도출 당시 품질 검토 보고. 현재 실행이 항상 무거웠다는 실측은 아니다.

```text
- 다만 최초 package는 공통 guidance가 개별 skill보다 훨씬 크고 상황별 절차를 반복했으며, `설명 복구본`도 작은 이해 단절에 비해 무거워질 수 있었다.
- `작업 이해안`은 실제 TripProof 반복 실패의 중심 해법이 아니라 기존 작업 전 인터뷰·구체화를 보강하는 예방적 결과인데, 다른 두 결과와 같은 근거 강도로 보일 수 있었다.
- `작업물 이해 브리핑`은 interface와 실제 provider, 국소 test와 전체 목표, 내부 데이터 전달과 사용자 답변 완성을 구분해 세 결과 중 실제 문제와 가장 직접적으로 연결됐다.
```

## 작은 복구로 조정한 내용

출처: `workspaces/005-tripproof-cognitive-debt-skill/records/2026-09-06-01-package-quality-review-and-revision-history.md`, 65~71행. SHA-256: `8a6b05db55622bc22bf93e89fe4237d87ef7f394d96b3d8efb6a96423ec33348`.

초기 산출물을 보강한 과정 기록. 현재 조항을 사후에 원래 의도로 추측한 것이 아니다.

```text
### 설명 복구본

- 직접 호출과 실제 이해 단절 상황을 모두 description에 넣고, 단순 요약·재작성·새 주제 설명과 구분했다.
- 대화만으로 복구할 수 있으면 Project context와 공통 guidance를 먼저 읽지 않는다.
- 직접 답 → 가장 가까운 누락 → 필요한 경우 더 앞선 전제와 source 순으로 깊어진다.
- 사용자의 실제 앞선 응답보다 같은 이름의 일반 개념이나 code symbol을 우선하지 않는다.
- 제목, 전체 근거 분류, repository 조사와 이해 확인 질문을 기본 출력에서 제외했다.
```

## 정정과 실제 조사 범위 보강

출처: `workspaces/008-tripproof-cognitive-debt-package-adoption/records/2026-09-05-05-quality-review-revision.md`, 11~15행. SHA-256: `7cea688f383d25ecb6de9acd05422143caacf4add1e82aeb1f998d76379f89cd`.

2026-09-05 반영 기록. 같은 문서에 사용자 승인 발화 “좋네 반영하자”가 보존돼 있다.

```text
- [`explanation-recovery`](../../../../../context/analysis/09-tripproof-cognitive-debt/v0/payload/.agents/skills/explanation-recovery/SKILL.md): 뜻 질문과 이의 제기가 함께 있으면 모두 답한다. 실제 오류·모순·잘못된 추론이나 재설명 중 의미 변경이 보이면 무엇을 유지·정정·철회하거나 아직 판단하지 못하는지 밝힌다. 추가 source 조사는 사실 부족·의심되는 사실 오류가 현재 답을 바꾸며 대화로 확인할 수 없는 부분에 한정한다. 혼란만으로 앞선 응답을 틀렸다고 단정하거나 과거 전체 감사·구현·문서 수정·작업 범위 재합의로 확대하지 않는다.
- [`work-discussion`](../../../../../context/analysis/09-tripproof-cognitive-debt/v0/payload/.agents/skills/work-discussion/SKILL.md): 원하는 결과나 완료 경계를 여러 방식으로 해석할 수 있을 때 같은 대표 입력·장면에서 원하는 결과와 비슷하지만 부족한 결과를 대비한다. 이미 정한 차이는 이해안에 남기고 재질문하지 않는다. 모든 작업의 사례·acceptance 문서 의무는 만들지 않았다.
- [`work-artifact-briefing`](../../../../../context/analysis/09-tripproof-cognitive-debt/v0/payload/.agents/skills/work-artifact-briefing/SKILL.md): 중요한 이름의 데이터·책임을 사용자 일과 연결하고, 필요할 때 입력·중간 값·결과와 중요한 조건 차이를 보여 준다. 실제 값과 설명용 값, source 재구성과 관찰·제안의 지위를 구별하고 핵심 주장 가까이에 무엇을 확인한 source인지 둔다.
- [`OUTPUT-PREVIEW.md`](../../../../../context/analysis/09-tripproof-cognitive-debt/v0/OUTPUT-PREVIEW.md): 작업 이해안에 대표 질문의 결과 대비, 설명 복구에 잘못된 앞선 주장을 정정하는 예시, 브리핑에 역할·값·근거 한계의 연결을 반영했다. 단순한 `verdict` 뜻 질문 예시는 유지했다. 새 값과 대화는 실제 skill 실행이 아니라 설명용 예시로 표시했다.
- [`Package README`](../../../../../context/analysis/09-tripproof-cognitive-debt/v0/README.md): 보강의 의미와 기존 호출·설치 경계 유지를 설명했다.
```

## 설명 정정과 작업 재판단 구별

출처: `context/analysis/07-tripproof-spec-driven-continuity/06-judgment-and-understanding-application/01-joint-application-decisions.md`, 93~93행. SHA-256: `7ea2231cb142eea77bde3857a0fc7efa325fff2e820ee3739c5d46481db20aa5`.

공동 적용 대화에서 과도한 중복 해석을 정정한 당시 판단이다.

```text
앞선 말과 논리를 바로잡는 것과, 그 판단에 의존한 작업 결과를 다시 확인하는 것은 이어질 수 있는 다른 책임이다. Main은 앞서 이를 같은 책임의 중복처럼 넓게 설명한 부분을 정정했다. 설명 복구에서 작업 재판단으로 자동 전환하는 새 규칙을 만들지 않는다.
```

## Spec/Ticket으로 원뜻을 덮지 않기

출처: `context/analysis/07-tripproof-spec-driven-continuity/08-skills-spec-ticket-integration/01-discussion-decisions.md`, 113~117행. SHA-256: `34918b572b841f0d2bea6efa426aa6978eb62fdde0b77ee1b59ca8ad795eb0f7`.

2026-09-08 후속 연결 논의. 필요한 범위만 읽는 기존 원칙을 유지했다.

```text
### explanation-recovery

사용자가 가리킨 앞선 설명에서 시작하는 기존 원칙을 유지한다. 대화만으로 뜻을 복구할 수 있으면 바로 설명하고, 그 말이 가리킨 범위나 근거를 알아야 한다면 관련 Spec·Ticket을 읽는다.

예를 들어 “아까 완료됐다는 게 무슨 뜻이야?”라는 질문에는 해당 Ticket의 완료 범위와 Spec의 전체 목표를 확인해 설명할 수 있다. 앞선 말에 오류가 있다면 원래 뜻의 복원과 정정할 내용을 구별한다. 현재 Spec의 내용으로 과거 발화의 원래 뜻을 바꾸거나, 설명을 묻는 요청을 자동으로 전체 작업 재판단으로 확대하지 않는다.
```

## 작은 뜻 복구와 잘못된 추론 정정의 전체 대비

작성자가 만든 설명용 대화다. 응답 평가나 실제 승인 기록으로 사용하지 않는다.

출처: `context/analysis/09-tripproof-cognitive-debt/v0/OUTPUT-PREVIEW.md`, 56~92행. SHA-256: `42b7fd8dcff620fe18e2038e21521cea4b1a7e1a18298a85e862dadf50b222d9`.

```text
## 2. `설명 복구본`

직전 AI 응답:

> 여기서 evidence는 작업과 확인이 있었다는 근거이고, verdict는 그 근거를 보고 이 결과를 받아들일지 보류할지 다시 작업할지를 사람이 내리는 판정이야.

사용자 요청:

> 못 따라갔어. verdict가 뭐야?

응답:

> 여기서 `verdict`는 **근거를 본 뒤 이 결과를 받아들일지, 보류할지, 다시 작업할지를 사람이 내리는 판단**이야.
>
> 앞 문장에서 `evidence`는 무엇을 작업하고 확인했는지를 보여 주는 근거이고, `verdict`는 그 근거가 원래 목표에 충분한지 보고 결과를 어떻게 처리할지 정하는 결론이었어. 근거가 있다는 사실만으로 결과가 자동 승인되는 것은 아니라는 뜻이야.

직전 응답만으로 복구할 수 있어 Project 문서나 codebase의 같은 이름을 조사하지 않았다. 직접 뜻과 `evidence → 사람의 판단` 연결만 답하고 멈췄다. 사용자가 전체 사례나 더 앞선 이유를 요구할 때만 범위를 넓힌다.

### 이해 요청과 앞선 주장에 대한 이의 제기가 함께 있을 때

아래는 앞선 AI 설명 자체에 잘못된 연결이 있는 설명용 대화다. 실제 검증이나 사용자 승인이 있었음을 주장하지 않는다.

직전 AI 응답:

> 작업한 근거가 있으니 이 결과는 받아들여도 됩니다.

사용자 요청:

> 이해가 안 돼. 작업한 근거가 있다는 게 왜 내가 받아들여도 된다는 뜻이야?

응답:

> 작업한 사실을 확인할 자료가 있다는 뜻이었어. 그런데 내가 그 사실을 곧바로 “결과를 받아들여도 된다”는 결론으로 연결한 건 잘못이야. 작업했음을 보여 주는 근거와 네가 원한 결과에 충분한지는 별개의 문제니까.
>
> 작업한 사실을 확인할 자료가 있다는 설명은 유지하되, 받아들여도 된다는 앞선 결론은 철회할게. 현재 대화에는 그 근거가 원래 목표를 얼마나 충족하는지 판단할 내용이 없어. 앞선 뜻을 설명하면서 이 차이를 분명히 했어야 했어.

이 응답은 사용자의 질문을 단순한 용어 이해 부족으로 돌리지 않고, 확인 가능한 앞선 문장의 잘못된 연결을 정정한다. AI의 숨은 동기를 만들어 설명하지 않으며, 이 정정만으로 구현·문서 수정이나 별도 review를 시작하지 않는다. 단순한 뜻 질문에 이 절차를 추가할 필요는 없다.
```

## 원대화와 기존 설계의 대조에서 정정 책임을 보강한 이유

당시 Main이 원대화 일부를 재확인했다고 보고한 기록이다. 이 자료의 현재 예상 출력을 실제 평균 성능으로 취급하지 않았다는 제한까지 보존한다.

출처: `workspaces/008-tripproof-cognitive-debt-package-adoption/records/2026-09-05-04-independent-quality-review-main-assessment.md`, 7~27행. SHA-256: `7cd17fcc91cbd07609629f69184df2661f0d3c0b609484a174c935050f6cff45`.

```text
## 결론

현재 후보는 실제 상태·근거의 한계·사람의 판단 권한을 구별하고, 필요한 만큼 설명하는 기반이 잘 잡혀 있다. 이번 리뷰에서 세 skill의 분리나 호출 정책을 바꿀 이유는 나오지 않았다.

보강할 방향은 사용자가 설명을 읽고 중요한 결과를 예상하거나 AI의 판단에 이의를 제기할 수 있게 하는 것이다. 세 제안 모두 그 방향에서 타당하다. 다만 모두를 기존 설계에 없던 새 원칙으로 받아들이지는 않는다. 오류 확인, 원하는 결과와 대체 완료의 구분, 대표 흐름과 역할 설명은 기존 설계에도 있다. 남는 문제는 그 원칙이 실제 답변에서 충분히 구체적으로 드러나게 하는 방법이다.

기존 설계에서 이미 생각했다는 사실만으로 지적을 기각하지 않았다. 반대로 reviewer가 작성한 ‘현재 예상’이 실제 평균 출력이라는 근거도 없으므로, 현재 skill이 언제나 그 수준으로 실패한다고 판정하지 않았다.

## 앞선 응답의 오류·이의 제기·의미 변경

**Main 판단: 우선 보강 제안으로 타당하되, 오류 확인 전체가 누락됐다는 판정은 아니다.**

기존 [장면별 합성](../../../../../context/analysis/09-tripproof-cognitive-debt/02-three-scenes-reference-synthesis.md) 141~147행은 명료한 설명이 사실성 증명이 아니며 주장이 틀렸다고 의심되면 source나 실행 근거를 확인하라고 명시한다. 현재 [설명 복구 skill](../../../../../context/analysis/09-tripproof-cognitive-debt/v0/payload/.agents/skills/explanation-recovery/SKILL.md) 14·37~38·54행에도 현재성, 사실·해석의 구별과 사실 부족에 대한 조사 경계가 있다.

그럼에도 원래 뜻을 복원하는 일과 원래 주장을 계속 정당화하는 일은 다르다. 실제 정보가 충분해도 앞선 추론이 잘못됐을 수 있고, 사용자의 질문이 이해 요청이면서 반박일 수도 있다. 이 경우 무엇을 잘못 연결했고 무엇을 유지·철회하는지 드러내는 행동은 현재 skill에서 덜 명시적이다.

Main은 첫 원대화의 물리 행 87·90·95·98·101을 직접 다시 확인했다. 사용자는 용어만 묻지 않고 `TripFact`가 있다는 사실이 LLM 판단을 미룰 이유가 되는지를 문제 삼았고, AI는 이후 앞선 플랜의 설명을 정정했다. 당시 제품 설계의 정답이나 AI의 내적 동기를 증명한 것은 아니다.

따라서 보강할 것은 모순·잘못된 추론·의미 변경이 실제로 보이는 경우의 짧은 정정 행동이다. 단순한 용어 질문마다 전체 감사를 시작하거나, 설명 skill이 범위 변경·구현 수정까지 인수하게 할 이유는 없다. 실제 반영 시에는 설치 대상의 상위 정정 규칙과 책임이 중복되는지도 확인해야 한다. 이번에는 live target의 현재 규칙까지 확인하지 않았다.

## 원하는 결과와 부족한 대체 결과의 대비
```

## wait-what 원형의 목적과 작동 방식

짧은 원자료 전체를 보존한다. 직접 호출 전용이라는 원형 조건과 이 연구의 자연어 선택 허용은 서로 다른 선택이다.

출처: `context/source/04-matt-pocock-skills/original/wait-what.md`, 1~36행. SHA-256: `bd1bde22889a849fca4410f5af5d56a1af8abffdbead056c13a55867772207f3`.

```text
## What it does

`wait-what` is what you type when a message didn't land. The [agent](https://www.aihero.dev/ai-coding-dictionary/agent) then re-pitches what it just said. It adds the context you were missing, writes in plain English, and uses the vocabulary from your project's `CONTEXT.md`.

The skill is three lines long. That is the design, not an unfinished draft. Skills that fight verbosity fail by growing: a four-hundred-line concision skill still leaves the [model](https://www.aihero.dev/ai-coding-dictionary/model) verbose, because the model reads the volume, not the plea. This one carries a single precise leading word and nothing else.

## When to reach for it

You invoke it by typing `/wait-what`. The agent will not reach for it on its own, and it shouldn't. Only you know when you stopped following.

Use it the second you notice you're skimming. The agent has drifted into jargon it invented, stacked five acronyms, or explained a decision whose premise you never saw. It fixes the conversation you're already in. To stop the jargon arriving at all, use [grill-with-docs](https://aihero.dev/skills-grill-with-docs), which builds the shared language upfront.

## The name is the mechanism

The leading word is **wait**. "Be concise" is an instruction about the agent's output, and the model obeys it by clipping words and losing you further. **Wait** is about *your* state. It says comprehension failed here. An agent that hears "be brief" writes telegrams. An agent that hears "wait, you lost me" backs up and explains.

That difference is the whole skill. Every popular fix for verbosity names the *output*: `/tldr`, `/no-fluff`, `/talk-normal`. The model over-corrects into a caveman register that is shorter and no clearer. Naming the *listener* asks for both halves at once: fewer words **and** the context you were missing.

The skill says re-pitch **that**, not "that last message". What lost you is usually bigger than one paragraph, so the agent decides how far back to go.

## It plugs into the language you already have

The body reuses the leading words already in your global `CLAUDE.md` and your project's `CONTEXT.md`. ASD-STE100 Simplified Technical English sets the register. The ubiquitous language supplies the nouns. The skill, `CLAUDE.md` and `CONTEXT.md` reach for the same [tokens](https://www.aihero.dev/ai-coding-dictionary/token), so invoking it is not a new instruction. It is a reminder of one the agent already agreed to.

If you have no `CONTEXT.md`, the skill still works. You lose only the domain-vocabulary half.

## It's working if

- The re-pitch is **shorter and clearer**, not shorter and blunter.
- It adds the premise you were missing, instead of only deleting words.
- Project nouns replace invented ones. The terms in your `CONTEXT.md` come back.
- You can use it twice in a row, and it does not degrade into terseness.

## Where it fits

You can use `wait-what` at any point, in any conversation, inside any other skill. It repairs one message after the fact. The real cure is a shared language agreed upfront, and that is [grill-with-docs](https://aihero.dev/skills-grill-with-docs): a [grilling](https://www.aihero.dev/ai-coding-dictionary/grilling) session that runs [domain-modeling](https://aihero.dev/skills-domain-modeling) as it goes, so the words you both use land in your `CONTEXT.md`. If you're unsure which skill fits the moment, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
```
