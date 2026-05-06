---
alwaysApply: false
---

# React Native 폼 구현 가이드 (Form Implementation Guide)

> Archived on 2026-05-06 during the harness restructure.
> Current active guide: [context/form.md](../context/form.md).
> 이 문서는 legacy web component 표현이 섞인 폼 가이드 보존용이다. 현재 작업 기준은 active guide를 우선한다.

이 문서는 프로젝트의 폼(Form) 기능 구현에 대한 규칙과 가이드라인을 정의합니다. 일관성 있고 재사용 가능하며 유지보수가 용이한 폼을 만들기 위해 모든 팀원은 이 가이드를 준수해야 합니다.

> 문서 상태: archived history.

## 1. 핵심 기술 스택 (Core Tech Stack)

- **상태 관리 (State Management):** `react-hook-form`
- **UI 컴포넌트 (UI Components):** 기존 웹 프로젝트의 `Input`, `Select`와 같은 컴포넌트 구조를 활용하여 React Native 컴포넌트를 구성합니다. 기반이 되는 요소로는 `TextInput`, `View` 등 React Native 기본 컴포넌트나 외부 라이브러리를 사용합니다.

## 2. UI 컴포넌트 구조: 컴파운드 컴포넌트 패턴 (Compound Component Pattern)

모든 폼 필드는 **`Field` 컴파운드 컴포넌트**를 사용하여 구성합니다. 이는 UI의 유연성과 가독성을 높입니다. 이렇게 만들어진 순수 UI 컴포넌트들은 **비즈니스 로직을 담고 있는 컨트롤러(Hooks)와 효과적으로 조합되어야 합니다.**

### 2.1. `Field` 컴포넌트 구성 요소

- **`Field` (`Field.Root`):** 하나의 필드 단위를 감싸는 최상위 `View` 컨테이너.
- **`Field.Title`:** 필드의 제목을 표시하는 `Text` 컴포넌트.
- **`Field.ElementsBox`:** 입력 요소(`TextInput` 등)들을 감싸는 `View` 컨테이너. 수평/수직 정렬을 담당합니다.
- **`Field.Description`:** 필드에 대한 부가 설명을 제공하는 `Text` 컴포넌트.
- **`Field.Message`:** 유효성 검사 에러 메시지를 표시하는 `Text` 컴포넌트.

### 2.2. 사용 예시

```tsx
<Field>
  <Field.Title>이름</Field.Title>
  <Field.ElementsBox>{/* 여기에 Controller로 감싼 TextInput이 위치합니다. */}</Field.ElementsBox>
  <Field.Description>실명을 입력해주세요.</Field.Description>
  <Field.Message>{/* 에러 메시지 */}</Field.Message>
</Field>
```

## 3. 상태 관리 및 UI 연동 규칙

### 3.1. `Controller` 사용 의무화

모든 폼 입력 컴포넌트는 `react-hook-form`의 **`<Controller>`** 컴포넌트로 감싸야 합니다. `register`는 React Native 환경에서 예기치 않은 동작을 유발할 수 있으므로 **사용을 금지**합니다.

- **이유:** `Controller`는 `render` prop을 통해 `field` 객체(`onChange`, `onBlur`, `value` 등)를 명시적으로 전달하므로, 어떤 종류의 React Native 컴포넌트와도 안정적으로 통합할 수 있습니다.

### 3.2. `Controller` `render` prop 명명 규칙

`render` prop에서 받는 `field` 객체는 항상 구조 분해 할당하여 사용합니다.

- **권장:** `render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => ...}`
- **주의:** `onChange` prop을 `TextInput`의 `onChangeText`에 전달해야 합니다.

### 3.3. `Controller` 구현 예시

```tsx
<Controller
  control={control}
  name='username'
  rules={{
    required: '이름은 필수 항목입니다.',
    minLength: { value: 2, message: '최소 2자 이상 입력해주세요.' },
  }}
  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
    <>
      <TextInput
        onBlur={onBlur}
        onChangeText={onChange}
        value={value}
        placeholder='이름을 입력하세요'
        style={error ? styles.inputError : styles.input}
      />
      {error && <Field.Message>{error.message}</Field.Message>}
    </>
  )}
/>
```

## 4. 유효성 검사 (Validation)

- **유효성 검사 규칙(`rules`)은 항상 `Controller`의 `rules` prop 내에 정의**합니다.
- `mode: 'onChange'` 또는 `mode: 'onBlur'`를 `useForm`에 설정하여 사용자 경험을 향상시키는 것을 권장합니다.
- 복잡한 유효성 검사 로직은 별도의 유틸리티 함수로 분리하여 관리합니다. (e.g., `src/utils/validators.ts`)

## 5. 로직과 UI의 분리 (Repo/UI Separation)

폼을 구성할 때는 UI를 담당하는 부분과 비즈니스 로직(Repository 역할)을 담당하는 부분을 명확하게 분리해야 합니다. 이는 컴포넌트의 재사용성을 높이고 테스트 용이성을 확보하기 위함입니다.

### 5.1. UI Layer (`components/forms/*.tsx`)

- **역할:** 폼의 시각적 구조와 레이아웃을 정의하고, 사용자 인터랙션을 처리하는 데 집중합니다. "어떻게 보이는가"에 대한 책임을 가집니다.
- **주요 책임:**
  - `Field`, `TextInput` 등 UI 컴포넌트를 조합하여 폼의 구조를 만듭니다.
  - `react-hook-form`을 사용하여 폼의 상태(입력 값, 유효성 검사 상태 등)를 관리합니다.
  - 사용자의 입력을 받고, 유효성 검사 메시지를 화면에 표시합니다.
  - 폼 제출 버튼 클릭 시, `handleSubmit`을 통해 유효성 검사를 통과한 데이터를 로직 레이어(커스텀 훅)에 전달하는 역할까지만 수행합니다.
- **금지 사항:**
  - UI 컴포넌트 내에서 직접 API를 호출하지 않습니다.
  - 전역 상태(Zustand, React Query 등)를 직접적으로 변경하는 로직을 포함하지 않습니다.

### 5.2. Business Logic Layer / Repo Layer (`hooks/*.ts`)

- **역할:** 폼 제출 이후의 모든 데이터 처리 및 비즈니스 로직을 담당합니다. "무엇을 하는가"에 대한 책임을 가집니다.
- **주요 책임:**
  - UI 레이어로부터 받은 데이터를 사용하여 서버 API를 호출합니다.
  - API 통신과 관련된 비동기 상태(로딩, 성공, 에러)를 관리합니다.
  - API 응답 결과에 따라 전역 상태를 업데이트하거나, 캐시를 갱신합니다.
  - 폼 제출과 관련된 모든 사이드 이펙트를 처리합니다.
- **구현 방식:**
  - 관련 로직들을 재사용 가능한 **커스텀 훅(Custom Hook)**으로 캡슐화하는 것을 원칙으로 합니다. (e.g., `useSignIn`, `useCreatePost`)

## 6. 폼 제출 (Form Submission)

- 폼 제출 로직(API 호출 등)은 폼 UI 컴포넌트에서 분리하여 **커스텀 훅(Custom Hook)**으로 관리합니다. (e.g., `useSignIn`, `useUpdateProfile`)
- `handleSubmit`을 사용하여 폼 제출을 처리하고, 첫 번째 인자로 `onValid` 콜백, 두 번째 인자로 `onInvalid` 콜백을 전달할 수 있습니다.

```tsx
// SignInForm.tsx
const { control, handleSubmit } = useForm();
const { signIn, isLoading } = useSignIn(); // 커스텀 훅

const onValid = (data) => {
  signIn(data);
};

return (
  <View>
    {/* ... Controller fields ... */}
    <Button title='로그인' onPress={handleSubmit(onValid)} disabled={isLoading} />
  </View>
);
```

## 7. 접근성 (Accessibility)

- React Native는 웹과 접근성 처리 방식이 다릅니다. `accessibilityLabel`, `accessibilityHint` 등의 prop을 적절히 사용하여 스크린 리더 사용자를 지원해야 합니다.
- `Field.Title` 컴포넌트가 `TextInput` 같은 입력 요소와 의미적으로 연결되도록 `accessibilityLabel`을 제공하는 것을 고려합니다.
