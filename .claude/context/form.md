---
alwaysApply: false
---

# React Native Form Guide

> 문서 상태: active source.
> 과거 web component 구조가 섞인 폼 가이드는 [_archive/form-guide-legacy-web-patterns.md](../_archive/form-guide-legacy-web-patterns.md)에 보존되어 있다.

Noline의 폼은 React Native/Expo 화면에서 `react-hook-form`, Zod schema, `Field` 조합 컴포넌트, feature hook을 기본 조합으로 사용한다.

## Current Defaults

- form state: `react-hook-form`.
- validation: `zodResolver`.
- input bridge: `Controller`.
- field shell: `apps/client/src/shared/components/Form/Field.tsx`.
- submit side effect: feature hook 또는 entity data hook.
- date/time input: `DatePicker`, `TimePicker`, `shared/lib/datetime`.

## Controller Pattern

React Native input은 `register` 대신 `Controller`로 연결한다.

```tsx
<Controller
  control={control}
  name='title'
  render={({ field: { value, onChange }, fieldState: { error } }) => (
    <Field>
      <Field.Title>제목</Field.Title>
      <Field.ElementsBox>
        <TextInput value={value} onChangeText={onChange} />
      </Field.ElementsBox>
      {error && <Field.Message>{error.message}</Field.Message>}
    </Field>
  )}
/>
```

## Layer Split

| Layer | 책임 |
| --- | --- |
| schema file | form input validation |
| feature hook | `useForm`, submit handler, date/time picker state |
| form component | field layout and user input |
| entity data hook | server/local mutation and query invalidation |
| repository | Activation Router local/remote routing |

폼 컴포넌트가 직접 API나 DB를 호출하지 않게 한다.

## Policy and Manual Mode

오프라인/활성화 상태에 따라 입력 가능성이 달라지는 폼은 [manual-input.md](manual-input.md)와 [policy-architecture.md](policy-architecture.md)를 같이 본다.

폼 내부에서 네트워크/활성화 조건을 새로 계산하기보다, 화면이나 feature 조합부에서 `useAppPolicy`로 분기한다.

## 체크리스트

- [ ] schema와 form default value가 같은 shape인가?
- [ ] React Native input이 `Controller`로 연결되어 있는가?
- [ ] submit 전에 date/time/currency 같은 경계 값이 정규화되는가?
- [ ] side effect가 form UI가 아니라 hook/data layer로 분리되어 있는가?
- [ ] policy/manual mode 분기가 중복 계산되지 않는가?
