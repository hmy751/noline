# UI 결정의 자리를 바꾸면 무엇이 달라지는가

위치와 값의 소유, 부품 축, Field의 플랫폼 이동을 코드로 비교한다. 다른 작업에 적용할 기준은 [UI 결정을 맡을 책임에 두고 쌓는다](INDEX.md)와 각 본문에 있다.

모바일 앱 코드는 구조를 보여 주는 설명 사례다. 누가 어떤 사정으로 작성했는지는 확인하지 않았으며 잘잘못을 판정하는 근거가 아니다. UI 템플릿 코드도 모범 답안이 아니라 대조를 위한 예다. 코드는 관련 부분만 줄였다.

## 메뉴의 위치를 누가 아는가

한 모바일 앱의 범용 `DropdownMenu`는 호출부에서 위치를 받지만, 좌표를 이렇게 정한다.

```ts
const menuStyle: ViewStyle = {
  position: 'absolute',
  top: currentPosition?.y ? currentPosition.y + 40 : 200,
  right: 16,
};
```

`40`은 트리거의 높이를, `right: 16`은 화면의 여백을, `200`은 위치가 없을 때의 임의 자리를 범용 메뉴가 안다는 뜻이다. 호출부가 넘긴 x와 크기는 쓰이지 않으므로, 트리거가 다른 곳에 있거나 화면 끝에 있으면 호출부가 실제 자리를 표현하기 어렵다. absolute가 문제는 아니다. 떠 있는 메뉴는 흐름 밖에 있어야 한다.

UI 템플릿은 트리거와 메뉴를 실제로 측정한다.

```ts
const triggerRect = triggerElement.getBoundingClientRect();
let top = triggerRect.bottom + window.scrollY + gap;

if (top + floatingHeight > windowHeight + window.scrollY) {
  top = triggerRect.top + window.scrollY - floatingHeight - gap;
}
```

호출부는 트리거 요소와 간격만 알고 측정 Hook이 좌표를 맡는다. 다만 가로 충돌은 처리하지 않으므로 필요한 화면에서는 보완이 필요하다. React Native에서는 `measureInWindow`와 Modal 표면으로 다시 구현해야 하며 이 코드를 옮길 수 없다. 옮겨 오는 것은 책임의 구분이다.

이제 이 범용 메뉴를 쓰는 새 화면에서 항목별 메뉴가 잘린다고 하자.

| 선택 | 얻는 것 | 남는 것 |
| --- | --- | --- |
| 범용 메뉴의 위치를 그대로 쓴다 | 변경이 없다. | 어떤 항목의 메뉴인지 알 수 없는 자리에 뜬다. |
| 기능 폴더에 측정 계산을 두고 메뉴를 직접 그린다 | 기존 사용처를 건드리지 않고 이번 화면이 정확해진다. | 공통 결함이 남고, 다음 화면이 같은 계산을 다시 만들 수 있다. 결과 보고에 결함과 우회 위치를 적어야 한다. |
| 측정 계산을 공통으로 올린다 | 이후 화면이 함께 좋아진다. | 기존 호출부의 위치 전달과 동작을 확인해야 한다. |

어느 쪽이 맞는지는 [공통에 둘 이유를 댈 수 있는지와, 이득과 사람이 다시 봐야 할 양](INDEX.md#공통-부품은-이유를-댈-수-있을-때-고치고-애매하면-묻는다)에 달려 있다. 호출부 수 자체는 이유가 아니다. 지킬 것은 선택을 드러내는 일이다. 좋은 계산을 만들고 공통 결함을 말하지 않으면 다음 작업자는 결함이 있는지 모른다.

## 제목과 액션의 자리를 누가 나누는가

같은 앱의 카드는 메뉴 버튼을 띄우고 제목에 오른쪽 여백을 준다.

```tsx
<Card className="relative p-sm">
  {onMenuPress && (
    <View className="absolute right-2 top-2 z-10">{/* 메뉴 버튼 */}</View>
  )}
  <Text className="pr-8" numberOfLines={1}>{title}</Text>
</Card>
```

메뉴 버튼의 크기를 제목의 `pr-8`도 알고 있다. 버튼이 커지거나, 메뉴가 없는 카드이거나, 화살표까지 함께 놓이면 여백을 다시 맞춰야 한다. 조합이 행으로 자리를 나누면 그 지식이 사라진다.

```tsx
<View className="flex-row items-start gap-xs">
  <Text className="flex-1" numberOfLines={1}>{title}</Text>
  {onMenuPress && <MenuButton onPress={onMenuPress} />}
</View>
```

반대 선택이 맞는 경우도 있다. UI 템플릿의 프로모션 Card는 첫 자식 이미지를 absolute로 전체에 깐다.

```css
.promotion > :first-child {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

이미지는 내용과 서로 밀어낼 일이 없고 겹치는 것이 목적이다. 카드 위 구석의 배지처럼 본문과 겹쳐도 되는 작은 표시도 마찬가지다. **겹쳐야 하는지, 서로 비켜야 하는지**가 수단을 가른다. 프로모션 Card가 첫 자식의 역할을 가정한다는 숨은 계약은 별개의 비용이므로 그 Card의 API에서 드러낼지 판단한다.

## 한 화면의 겹침과 여러 화면에 퍼진 위치 지식

두 화면의 겹침을 다르게 처리한 일이 있다.

| | 로그인 화면 | 다른 화면의 안내 |
| --- | --- | --- |
| 증상 | 하단에 띄운 약관이 안내와 버튼이 늘자 겹쳤다 | 시간대 안내가 헤더와 겹쳐 상태 표시줄 쪽을 덮었다 |
| 코드에서 본 것 | 위치를 아는 곳이 그 화면 안에 있다 | 안내가 어떤 화면에서는 헤더 앞에, 어떤 화면에서는 뒤에 놓인다. 상단 안전 영역을 헤더, 배너, 화면이 각자 비운다 |
| 처리 | 내용과 약관을 흐름으로 쌓고 넘치면 스크롤하게 고쳤다 | 안내 위치만 옮기는 수정을 멈추고 레이아웃 관점에서 다시 보기로 했다 |

어느 쪽도 absolute의 많고 적음으로 갈리지 않는다. 뒤의 해석은 사후 정리이며, 그때 사용자가 이 기준을 말한 것은 아니다. 원인이 한 화면 안에 있으면 그 자리에서 고쳐도 되고, 같은 지식이 여러 곳에 있으면 그 위치를 먼저 나열한다. 안내 문제의 해결 방법은 아직 정하지 않았다.

## 같은 색을 두 곳이 소유하면

React Native의 `Text`는 바깥 `View`나 `Pressable`에서 글자 색을 물려받지 않으므로, 문자열 내용을 그리는 버튼 부품은 글자 색을 정해야 한다. 앞의 앱에서는 theme에 값이 있는데도 부품이 같은 값을 다시 적는다.

```ts
// theme
primary: { DEFAULT: 'hsl(120, 61%, 34%)', foreground: 'hsl(120, 61%, 98%)' /* #F5FBF5 */ },

// Pressable
const textColorMap = {
  default: '#F5FBF5', // primary-foreground
  outline: '#1F1F1F', // foreground
};
```

색을 명시해야 한다는 플랫폼의 필요와 값을 새로 소유하는 일은 다르다. 지금은 값이 같아 화면에는 문제가 없다. 그러나 theme의 `primary-foreground`를 바꾸면 버튼 글자만 남고, 코드를 읽어도 어느 쪽이 원천인지 주석으로만 알 수 있다.

| 상황 | 선택 |
| --- | --- |
| 값을 바꾸거나 테마를 전환할 가능성이 있다 | theme 값을 코드에서 읽어 한 원천을 쓴다. |
| 부품이 class로 표현할 수 있다 | variant별 class에 토큰을 쓰고 map을 없앤다. 동작하는지 확인한다. |
| 제품이 실험 단계이고 값이 고정이며 변경 경로를 만드는 비용이 더 크다 | 지금은 유지할 수 있다. 원천이 둘이라는 점을 알고 택한다. |

## Button의 축은 무엇을 드러내는가

여러 프로젝트를 건너 유지한 Button은 네 개의 독립 축을 갖는다.

```ts
type ButtonVariant = "primary" | "secondary" | "outline" | "text";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
}
```

`variant`는 위계를, `size`는 크기를, `fullWidth`는 놓인 공간을 채울지를, `isLoading`은 진행 중 표시와 입력 차단을 맡는다. `isLoading`이면 spinner와 문구를 함께 보여 주고 버튼을 비활성화한다. 버튼을 쓰는 화면은 위계와 크기를 고를 뿐 색과 패딩을 다시 정하지 않는다.

대조되는 모양은 **어느 화면, 어느 자리에 쓰는 버튼인지**로 분기하는 스타일 값이다. 화면이 늘면 값도 늘고, 같은 위계의 버튼이 값마다 조금씩 달라질 수 있다.

그렇다고 네 축이 정답인 것은 아니다. 다른 플랫폼에서 `icon`, `auto` 크기가 필요하거나 부품이 텍스트만 그리지 않는다면 축이 달라진다. 축을 더할 때는 이번 사용처가 실제로 갈리는지, 기존 축의 조합으로 표현되지 않는지 본다.

## Field를 웹에서 모바일로 옮기면 무엇이 남는가

웹의 UI 템플릿과 모바일 앱의 Field는 모두 합성으로 자리를 나눈다.

```tsx
// 웹: Title, ElementsBox, Label, Description, Message
<Field ariaLabelledby="email-group">
  <Field.Title id="email-group">이메일</Field.Title>
  <Field.ElementsBox>
    <Field.Label style={{ maxWidth: "100px" }}>
      <Input {...register("emailLocal")} />
    </Field.Label>
    <Text>@</Text>
    <Field.Label>
      <Select {...register("emailDomain")}>{/* 옵션 */}</Select>
    </Field.Label>
  </Field.ElementsBox>
</Field>

// 모바일: Title, ElementsBox, Message와 Controller
<Controller
  control={control}
  name="title"
  render={({ field: { value, onChange }, fieldState: { error } }) => (
    <Field>
      <Field.Title>제목 *</Field.Title>
      <Field.ElementsBox>
        <Input value={value} onChangeText={onChange} accessibilityLabel="일정 제목" />
      </Field.ElementsBox>
      {error && <Field.Message>{error.message}</Field.Message>}
    </Field>
  )}
/>
```

남은 것은 제목·입력행·오류의 자리를 Field가 맡고 입력은 children으로 받는 구조다. 달라진 것은 라벨 관계, 입력 이벤트 연결, 고정 입력행 높이다. 코드가 아니라 이 책임 구분을 옮긴다. 앱의 기존 코드에는 같은 자리에 raw `TextInput`을 쓴 곳이 있지만, 입력 부품과 모양이 같아 개발 중 놓친 것이므로 예시로 삼지 않았다.
