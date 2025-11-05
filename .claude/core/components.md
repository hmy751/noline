---
description: 컴포넌트 아키텍처 & 개발 프로토콜 - 사용자가 컴포넌트 생성/수정을 요청할 때 반드시 가져와야 합니다. MVP(빠르고 유연한) 및 Production(완전하고 모범 사례를 따르는) 레벨을 지원합니다. 컨텍스트 인식 워크플로우를 통해 atom (packages/ui)과 composition (shared/components) 레이어 분리를 정의합니다.
alwaysApply: false
---

# 컴포넌트

- 이 프로젝트는 리액트 네이티브 프로젝트로 모바일 앱을 중점으로 개발한다.
- 기본적으로 재사용성과 확장성을 고려한다.

---

## 0. ⚠️ AI 자동 실행 프로토콜 (레벨별 가이드)

### 📊 구현 레벨 선택 (기본: MVP)

사용자가 명시하지 않으면 **MVP** 레벨 적용  
"production 레벨로" 명시하면 **Production** 레벨 적용

---

### 🟢 MVP Level (기본값)

**목표**: 빠른 구현, 작동하는 코드

**원칙**:

- ✅ 기존 구조가 있으면 → 따른다
- ✅ 기존 구조가 없으면 → 유연하게 구현 (atom 생성 skip 가능)

**체크리스트**:

```
1. packages/ui 확인
   - 필요한 atom 있나?
   - ✅ 있으면 → 사용
   - ⚠️ 없으면 → shared/components에 직접 구현 (atom skip)

2. 조합 컴포넌트
   - shared/components에 작성
   - 기본 props만 (variant, size 등은 optional)

📌 핵심: "있으면 쓰고, 없으면 간단하게"
```

**예시**:

```
사용자: "여행 선택 컴포넌트 만들어줘"
→ MVP 레벨 (기본)

AI 실행:
1. packages/ui/Select.tsx 있나? → ❌ 없음
2. MVP니까 → TripSelector만 바로 구현

결과:
- shared/components/Select/TripSelector.tsx ✅
  (Pressable, View 등 기본 RN 컴포넌트로 직접 구현)
```

---

### 🔴 Production Level

**목표**: 완전한 베스트 프랙티스, 확장 가능한 코드

**원칙**:

- ✅ 기존 구조가 있으면 → 따른다
- ✅ 기존 구조가 없으면 → 만들어서라도 완벽하게

**체크리스트**:

```
1. packages/ui 확인
   - 필요한 atom 있나?
   - ✅ 있으면 → 사용
   - ❌ 없으면 → 먼저 생성
     • variant, size props
     • forwardRef, displayName
     • cva로 스타일 variants

2. 조합 컴포넌트
   - packages/ui atom 활용
   - 완전한 타입 정의
   - JSDoc 문서화

📌 핵심: "없으면 만들어서라도 완벽하게"
```

**예시**:

```
사용자: "여행 선택 컴포넌트 production 레벨로 만들어줘"
→ Production 레벨

AI 실행:
1. packages/ui/Select.tsx 있나? → ❌ 없음
2. Production이니까 → Select atom 먼저 생성

결과:
- packages/ui/Select.tsx ✅
  (SelectTrigger, SelectContent, variant/size props)
- shared/components/Select/TripSelector.tsx ✅
  (Select atom 조합, JSDoc 포함)
```

---

## 1. 재사용 가능한 컴포넌트 설계 원칙

### [핵심 철학] 컴포넌트는 "자신이 놓일 환경"을 가정해서는 안 된다.

훌륭하고 재사용 가능한 컴포넌트는 **컨텍스트에 독립적(Context-Agnostic)**이어야 합니다. 이는 컴포넌트가 특정 페이지의 특정 위치에 놓일 것이라고 미리 가정하고 외부 여백이나 위치와 관련된 스타일을 포함해서는 안 된다는 의미입니다.

컴포넌트의 책임은 **오직 자신의 내부를 어떻게 보여줄 것인가**에 있으며, **"어디에, 어떻게 배치될 것인가"**는 전적으로 컴포넌트를 사용하는 부모(Consumer)의 책임입니다.

> **"좋은 컴포넌트는 블랙박스처럼 작동해야 한다. 내부를 몰라도 예측 가능하게 동작해야 한다."**

### [문제 정의] 컨텍스트 결합이 만드는 문제 (Coupling Issue)

이 원칙이 깨졌을 때, 다음과 같은 문제가 발생합니다.

- **상황**: 버튼 컴포넌트를 만들면서 "아마 왼쪽에 여백이 필요할 거야"라고 생각해 `margin-left: 16px` 스타일을 컴포넌트 자체에 포함시켰다.
- **문제 발생**:
  1.  **재사용성 저하**: 다른 화면에서는 왼쪽에 여백이 필요 없는 경우, 이 컴포넌트를 사용할 수 없게 됩니다. 여백을 없애기 위해 불필요한 `!ml-0` 같은 오버라이드 스타일을 사용해야만 합니다.
  2.  **예측 불가능성**: 컴포넌트 사용자는 단순히 `<Button />`을 썼을 뿐인데 예상치 못한 여백이 생겨 레이아웃이 깨집니다. 원인을 찾기 위해 컴포넌트 내부 구현까지 들여다봐야 하는 번거로움이 발생합니다.
  3.  **레이아웃 중첩**: 부모에서 `grid`나 `flex`로 간격을 제어하고 있는데, 컴포넌트의 자체 여백까지 더해져 "이중 여백" 문제가 발생합니다.

### [실천 규칙] "배치"는 부모에게, "내부"는 컴포넌트에게

위의 핵심 철학을 지키기 위한 구체적인 실천 규칙은 다음과 같습니다.

#### 1. 컴포넌트는 외부 여백(Margin)을 절대 갖지 않는다.

- 컴포넌트의 최상위 요소에는 `margin`, `position: absolute`, `top`, `left` 등 **외부 배치**와 관련된 스타일을 포함해서는 안 됩니다.
- 컴포넌트 간의 간격은 `flex`의 `gap`, `grid`의 `gap`, 또는 부모 요소의 패딩 등을 통해 컴포넌트를 사용하는 쪽에서 제어해야 합니다.

```tsx
// ❌ 나쁜 예: 컴포넌트가 스스로 외부 여백을 결정한다.
export function Button() {
  return <button className='... m-4'>Click Me</button>;
}

// ✅ 좋은 예: 컴포넌트는 여백이 없고, 부모가 간격을 제어한다.
export function Button() {
  return <button className='...'>Click Me</button>;
}

// 부모 컴포넌트
export function ButtonGroup() {
  // 부모가 자식들의 간격을 책임진다.
  return (
    <div className='flex gap-4'>
      <Button />
      <Button />
    </div>
  );
}
```

#### 2. 컴포넌트는 너비(Width)를 100%로 설정하는 것을 기본으로 한다.

- 컴포넌트가 스스로 고정된 너비(`w-64` 등)를 갖게 되면, 다양한 레이아웃에 유연하게 대응할 수 없습니다.
- 기본적으로 부모가 제공하는 공간을 꽉 채우도록 하고, 필요한 경우 부모에서 컴포넌트를 감싸는 `div` 등을 통해 너비를 제어하는 것이 훨씬 유연합니다.

#### 3. 컴포넌트 내부의 패딩(Padding)은 허용된다.

- 패딩은 컴포넌트의 **내부 레이아웃**의 일부입니다. 버튼의 텍스트와 테두리 사이의 간격처럼, 컴포넌트의 고유한 디자인을 구성하는 요소이므로 컴포넌트가 직접 관리하는 것이 타당합니다.

---

## 2. 컴포넌트 기반 개발 (Component-Driven Development)

컴포넌트 기반 개발(CDD)은 UI를 독립적이고 재사용 가능한 부분들, 즉 '컴포넌트'로 나누어 개발하는 방법론입니다. 이는 확장성과 유지보수성을 높이고, 개발 프로세스를 효율화하는 데 목적이 있습니다. 이 원칙을 이해하는 것은 `packages/ui`와 `shared/components`의 역할을 명확히 구분하고 올바르게 활용하는 데 필수적입니다.

#### 핵심 원칙

1.  **독립성 (Isolation)**: 각 컴포넌트는 다른 부분과 격리되어 독립적으로 개발되고 테스트됩니다. 이를 통해 의존성을 최소화하고 예측 가능한 동작을 보장합니다.
2.  **재사용성 (Reusability)**: 잘 설계된 컴포넌트는 프로젝트의 다른 부분이나 심지어 다른 프로젝트에서도 쉽게 재사용될 수 있습니다. `packages/ui`의 아토믹 컴포넌트가 이 원칙을 극대화합니다.
3.  **조립성 (Composability)**: 작은 단일 목적의 컴포넌트들을 조합하여 더 크고 복잡한 컴포넌트나 UI를 구축합니다. 레고 블록처럼 UI를 조립하여 개발 생산성을 높입니다.

#### 왜 CDD를 따라야 하는가?

- **명확한 확장성**: 새로운 기능이 필요할 때, 기존 컴포넌트를 재사용하거나 조합하여 빠르게 개발할 수 있습니다. UI의 특정 부분만 수정해야 할 때, 해당 컴포넌트만 수정하면 되므로 변경이 쉽고 안전합니다. 모호하게 `packages/ui`를 수정하는 대신, 새로운 조합 컴포넌트를 만들거나 `props`를 확장하는 명확한 방향을 제시합니다.
- **유지보수 용이**: UI가 작은 단위로 분리되어 있어 특정 기능의 코드를 찾고 수정하기가 쉽습니다. 버그가 발생했을 때 문제의 범위를 특정 컴포넌트로 좁힐 수 있습니다.
- **개발 효율성**: 디자이너와 개발자가 컴포넌트 단위로 소통하며 협업할 수 있습니다. UI 컴포넌트 라이브러리를 시각적으로 탐색하고 개발하여 생산성이 향상됩니다.

---

## 3. Component Hierarchy

이 컴포넌트 계층은 `01-project-architecture.md`에 정의된 전체 애플리케이션 아키텍처의 일부입니다. `packages/ui` (Atom), `shared/components` (앱 공용 조합), 그리고 `entities` (비즈니스 객체)는 `features`와 `screens` 레이어에서 사용되어 완전한 기능을 갖춘 UI를 구축합니다.

- `entities`는 `@repo/ui`와 `shared/components` 컴포넌트를 사용하여 비즈니스 데이터(예: Trip, User)를 표현하는 UI를 만듭니다.
- `features`는 특정 기능을 구현하기 위해 `entities`와 `shared` 컴포넌트를 사용하고 비즈니스 로직을 추가합니다.
- `screens`는 이렇게 만들어진 `features`, `entities`, `shared` 컴포넌트를 조합하여 최종 사용자 화면을 구성합니다.

### 📁 Directory Structure

```
packages/ui/                      # 🔵 Atom 레이어 (순수 UI 컴포넌트)
    ├── Button/
    ├── Input/
    └── ...

apps/client/src/
    ├── shared/components/        # 🔵 앱 공용 조합 레이어 (비즈니스 무관)
    │   ├── layout/               # Container, Stack, Grid
    │   └── Form/                 # FormField, SearchBar
    │
    ├── entities/                 # 🔵 비즈니스 엔티티 레이어
    │   ├── trip/
    │   │   └── ui/
    │   │       ├── TripCard.tsx
    │   │       └── TripSelector.tsx
    │   └── user/
    │       └── ui/
    │           └── UserAvatar.tsx
    │
    └── ...
```

### 🎯 계층별 역할

#### `packages/ui` - Atom 레이어

> 비즈니스 로직 없이 스타일링만 담당하는 순수 UI 요소

**특징:**

- ✅ 순수 UI 요소 (버튼, 입력, 아바타 등)
- ✅ 스타일링과 기본 동작만 담당
- ✅ 비즈니스 로직 없음
- ✅ 다른 앱에서도 재사용 가능
- ✅ variant, size 등의 props로 스타일 제어

**예시:**

```typescript
// packages/ui/Button.tsx
<Button variant="default" size="md">저장</Button>
<Button variant="outline" size="sm">취소</Button>
```

#### `shared/components` - 앱 공용 조합 레이어

> packages/ui를 조합하여 앱 전반에서 사용되는 **비즈니스와 무관한** 조합 컴포넌트

**특징:**

- ✅ packages/ui의 Atom 컴포넌트를 조합
- ✅ 현재 앱에서만 재사용
- ✅ 레이아웃, 범용 폼 요소 등
- ❌ 비즈니스 로직 포함하지 않음

**예시:**

```typescript
// shared/components/layout/Stack.tsx
// 방향, 간격 등 레이아웃만 제어하는 순수 HOC
export function Stack({ direction, gap, children }) { ... }

// shared/components/Form/FormField.tsx
// Label, Input, ErrorMessage를 조합한 범용 폼 필드
export function FormField({ label, error, ...props }) { ... }
```

#### `entities/{entity}/ui` - 비즈니스 엔티티 레이어

> 특정 비즈니스 데이터(Trip, User 등)를 표현하고 다루는 컴포넌트

**특징:**

- ✅ `@repo/ui`와 `shared/components`를 조합
- ✅ 특정 비즈니스 도메인에 강하게 결합됨 (`trip`, `user` 등)
- ✅ 해당 엔티티의 데이터를 props로 받아 렌더링
- ✅ 엔티티와 관련된 간단한 비즈니스 로직 포함 가능

**예시:**

```typescript
// entities/trip/ui/TripCard.tsx
import { Avatar } from '@packages/ui/Avatar';
import { Badge } from '@packages/ui/Badge';
import { Card } from '@packages/ui/Card';

export function TripCard({ trip }) {
  return (
    <Card>
      <div className="flex gap-3">
        <Avatar src={trip.image} />
        <div className="flex-1">
          <h3 className="text-title-medium">{trip.destination}</h3>
          <p className="text-body text-muted-foreground">{trip.dates}</p>
        </div>
        <Badge variant="default">진행중</Badge>
      </div>
    </Card>
  );
}
```

### 📋 분리 기준

| 기준       | packages/ui         | shared/components     | entities/{entity}/ui            |
| ---------- | ------------------- | --------------------- | ------------------------------- |
| **역할**   | 순수 UI 요소        | 비즈니스 무관 조합    | 비즈니스 데이터 표현            |
| **스타일** | 스타일링만          | Atom + 레이아웃       | Atom/Shared + 비즈니스 데이터   |
| **로직**   | 없음                | 없음                  | 해당 엔티티 관련 로직 포함 가능 |
| **재사용** | 여러 앱에서 사용    | 현재 앱 전용          | 해당 엔티티를 다루는 모든 곳    |
| **예시**   | Button, Input, Card | PageLayout, FormField | TripCard, UserAvatar            |

---

## 4. Atom 컴포넌트 카탈로그

> 현재 프로젝트에서 사용하는 `packages/ui` 컴포넌트 목록

### Input 계열

#### Button

```typescript
// packages/ui/Button.tsx
variants: {
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  size: 'sm' | 'default' | 'lg' | 'icon'
}

// 사용 예시
<Button variant="default" size="md">저장</Button>
<Button variant="outline" size="sm">취소</Button>
```

#### Input

```typescript
// packages/ui/Input.tsx
<Input
  type="text"
  placeholder="목적지 입력"
  className="h-9"
/>
```

#### Textarea

```typescript
// packages/ui/Textarea.tsx
<Textarea
  placeholder="메모 입력"
  rows={4}
/>
```

#### Select

```typescript
// packages/ui/Select.tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="통화 선택" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="KRW">KRW</SelectItem>
    <SelectItem value="USD">USD</SelectItem>
  </SelectContent>
</Select>
```

#### Checkbox

```typescript
// packages/ui/Checkbox.tsx
<Checkbox id="sync" checked={enabled} onCheckedChange={setEnabled} />
```

#### Switch

```typescript
// packages/ui/Switch.tsx
<Switch checked={enabled} onCheckedChange={setEnabled} />
```

#### Radio

```typescript
// packages/ui/RadioGroup.tsx
<RadioGroup value={category}>
  <RadioGroupItem value="food" id="food" />
  <RadioGroupItem value="tour" id="tour" />
</RadioGroup>
```

### Display 계열

#### Avatar

```typescript
// packages/ui/Avatar.tsx
<Avatar>
  <AvatarImage src={user.photo} />
  <AvatarFallback>{user.initials}</AvatarFallback>
</Avatar>

// 크기는 className으로 조정
<Avatar className="h-8 w-8" />   // sm
<Avatar className="h-10 w-10" />  // default
<Avatar className="h-12 w-12" />  // lg
```

#### Badge

```typescript
// packages/ui/Badge.tsx
variants: {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
}

<Badge variant="default">동기됨</Badge>
<Badge variant="destructive">오류</Badge>
```

#### Label

```typescript
// packages/ui/Label.tsx
<Label htmlFor="email">이메일</Label>
```

#### Separator

```typescript
// packages/ui/Separator.tsx
<Separator orientation="horizontal" />
<Separator orientation="vertical" />
```

#### Spinner

```typescript
// packages/ui/Spinner.tsx (필요시 추가)
<Spinner size="sm" | "md" | "lg" />
```

### Icon 계열

#### Icon

```typescript
// packages/ui/Icon.tsx (lucide-react wrapper)
import { MapPin, Calendar, DollarSign } from 'lucide-react';

<Icon name={MapPin} size={16} className="text-primary" />
```

---

## 5. 조합 컴포넌트 구조

> `shared/components`에서 관리하는 앱 전용 컴포넌트

### 디렉토리 구조

```
shared/components/
├── layout/
│   ├── Container.tsx      # max-width 컨테이너
│   ├── Stack.tsx          # 수직/수평 스택
│   └── Grid.tsx           # 그리드 레이아웃
│
├── Form/
│   ├── FormField.tsx      # Input + Label + Error 조합
│   └── SearchBar.tsx      # Input + Icon 조합
│
├── Navigation/
│   ├── BottomNav.tsx
│   └── MobileHeader.tsx
│
└── Feedback/
    ├── EmptyState.tsx
    └── NetworkStatus.tsx
```

### 주요 컴포넌트 예시

#### FormField (Input + Label 조합)

```typescript
// shared/components/Form/FormField.tsx
import { Label } from '@packages/ui/Label';
import { Input } from '@packages/ui/Input';

export function FormField({ label, error, ...inputProps }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input {...inputProps} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

#### TripCard (엔티티 컴포넌트 예시)

```typescript
// entities/trip/ui/TripCard.tsx
import { Avatar } from '@packages/ui/Avatar';
import { Badge } from '@packages/ui/Badge';
import { Card } from '@packages/ui/Card';

export function TripCard({ trip }) {
  return (
    <Card>
      <div className="flex gap-3">
        <Avatar src={trip.image} />
        <div className="flex-1">
          <h3 className="text-title-medium">{trip.destination}</h3>
          <p className="text-body text-muted-foreground">{trip.dates}</p>
        </div>
        <Badge variant="default">진행중</Badge>
      </div>
    </Card>
  );
}
```

#### Stack (레이아웃 컴포넌트)

```typescript
// shared/components/layout/Stack.tsx
export function Stack({
  direction = 'vertical',
  gap = 'md',
  children
}) {
  return (
    <div className={`
      flex
      ${direction === 'vertical' ? 'flex-col' : 'flex-row'}
      gap-${gap}
    `}>
      {children}
    </div>
  );
}
```

### 실제 사용 예시

```typescript
// app/(tabs)/index.tsx
import { Button } from '@packages/ui/Button';
import { Badge } from '@packages/ui/Badge';
import { TripCard } from '@/entities/trip/ui/TripCard';
import { Stack } from '@/shared/components/layout/Stack';

export default function HomeScreen() {
  return (
    <Stack direction="vertical" gap="md">
      <TripCard trip={currentTrip} />

      <div className="bg-muted rounded-lg p-sm">
        <p className="text-label text-muted-foreground">총 경비</p>
        <p className="text-display-medium text-primary">EUR 156.50</p>
      </div>

      <Button variant="default" size="lg">
        여행 추가
      </Button>
    </Stack>
  );
}
```

---

## 6. 컴포넌트 작성 컨벤션

이 컨벤션은 React/React Native 컴포넌트에 적용됩니다.
다른 프레임워크 사용 시에는 구조를 조정하되, 핵심 원칙(관심사 분리, early return, 타입 정의)은 유지합니다.

### 🎨 컴포넌트 구조 (표준 템플릿)

```tsx
'use client'; // Next.js Client Component인 경우만

// 1️⃣ Import 섹션 (순서 엄수)
import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@repo/ui/Button';
import styles from './Component.module.css';

// 2️⃣ 타입 정의
interface ComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  onSubmit?: (data: FormData) => void;
  children: React.ReactNode;
}

// 3️⃣ 컴포넌트 선언 (default export)
export default function Component({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  onSubmit,
  children,
}: ComponentProps) {
  // 4️⃣ Hooks (선언 순서 중요)
  const router = useRouter();
  const [state, setState] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // 5️⃣ 이벤트 핸들러 (useCallback 권장)
  const handleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit?.(new FormData(e.currentTarget as HTMLFormElement));
    },
    [onSubmit],
  );

  // 6️⃣ Side Effects
  useEffect(() => {
    // componentDidMount, componentDidUpdate 로직
    return () => {
      // cleanup
    };
  }, [state]);

  // 7️⃣ 조건부 렌더링 (early return)
  // 경우에 따라서 합성형을 통해서 표현한다 ex) Suspense와 Component.Loading 형태로
  if (isLoading) {
    return <Spinner />;
  }

  // 8️⃣ JSX 반환
  return (
    <div className={styles.container}>
      <Button variant={variant} size={size} onClick={handleClick}>
        {children}
      </Button>
    </div>
  );
}
```

### Props Destructuring

```tsx
// ✅ DO: Props 구조 분해 할당
function Button({ variant, size, children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

// ❌ DON'T: props 객체 직접 사용
function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.children}</button>;
}
```

### 기본값 설정

```tsx
// ✅ DO: 파라미터 기본값
function Button({ variant = 'primary', size = 'md', fullWidth = false, children }: ButtonProps) {
  // ...
}

// ❌ DON'T: 컴포넌트 내부에서 기본값
function Button({ variant, size, children }: ButtonProps) {
  const finalVariant = variant || 'primary'; // ❌
  const finalSize = size || 'md'; // ❌
}
```

---

## 7. 컴포넌트 패턴: Compound Component

다음 질문으로 합성형 패턴 사용을 판단합니다:

**사용을 고려할 상황:**

- ✅ 여러 연관된 하위 컴포넌트로 구성되는가? (예: Dialog.Header, Dialog.Body, Dialog.Footer)
- ✅ 하위 컴포넌트들이 상태나 컨텍스트를 공유해야 하는가?
- ✅ 여러 곳에서 다양한 조합으로 사용될 예정인가?
- ✅ 사용자가 하위 컴포넌트의 순서나 조합을 자유롭게 구성해야 하는가?

**사용하지 않아야 할 상황:**

- ❌ 하위 부분이 없는 단순 컴포넌트
- ❌ 한 곳에서만 특정 형태로만 사용되는 컴포넌트
- ❌ Props로 충분히 제어 가능한 경우 (예: `showHeader={false}`가 더 간단함)
- ❌ 하위 컴포넌트 간 상태 공유가 필요 없는 경우

**판단 규칙**: 위 질문 중 첫 2개에 모두 "예"이고, 마지막 2개 중 하나 이상 "예"라면 합성형 패턴 고려

```tsx
export default function Dialog({ children, open: controlledOpen, onOpenChange }: DialogProps): ReactElement {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;

  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = useMemo(() => {
    if (isControlled) {
      return onOpenChange || (() => {});
    }
    return setUncontrolledOpen;
  }, [isControlled, onOpenChange]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      controlled: isControlled,
    }),
    [open, setOpen, isControlled]
  );

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

Dialog.Trigger = ({ children }: { children: ReactNode }) => {
  const { setOpen } = useContext(DialogContext);
  return <div onClick={() => setOpen(true)}>{children}</div>;
};

Dialog.Content = ({ children }: { children: ReactNode }) => {
  const { open, setOpen } = useContext(DialogContext);

  ...

  return createPortal(
    <>
      <div className={styles.overlay} onClick={() => setOpen(false)} />
      <div className={styles.content}>{children}</div>
    </>,
    document.body
  );
};

Dialog.Title = ({ children }: { children: ReactNode }) => {
  return <Text as="h2">{children}</Text>;
};

Dialog.Description = ({ children }: { children: ReactNode }) => {
  return <Text as="p">{children}</Text>;
};

Dialog.Footer = ({ children }: { children: ReactNode }) => {
  return <div className={styles.footer}>{children}</div>;
};

Dialog.Confirm = ({ callback, children }: { callback: () => void; children: ReactNode }) => {
  const { setOpen } = useContext(DialogContext);

  ...

  return (
    <Button variant="primary" fullWidth={true} onClick={handleConfirm}>
      {children}
    </Button>
  );
};

```

- 비동기 상태에 따른 구분이 필요할 경우 합성형 패턴을 활용할 수 있다.

```tsx
export default function InterviewerCard() {}
InterviewerCard.Loading = Loading;
InterviewerCard.Error = Error;

// 사용
<Suspense fallback={<InterviewerCard.Loading />}>
  <InterviewerCardList />
</Suspense>;
```

---

## 8. 개발 워크플로우

### 새 컴포넌트 개발 시 판단 프로세스

#### Step 1: Atom 컴포넌트 확인

```
1. packages/ui에 이미 존재하는가?
   ├─ 예 → 그대로 사용
   └─ 아니오 → Step 2로

2. 다른 앱에서도 사용 가능한 순수 UI인가?
   ├─ 예 → packages/ui에 새로 작성
   └─ 아니오 → Step 3로
```

#### Step 2: 조합 컴포넌트 확인

```
3. shared/components에 유사한 것이 있는가?
   ├─ 예 → 재사용 또는 확장
   └─ 아니오 → shared/components에 새로 작성
```

### `packages/ui` 사용 기준

**사용해야 하는 경우:**

- ✅ 새 컴포넌트 생성 전 항상 `packages/ui`에서 유사 기능 검색
- ✅ 다음 질문으로 재사용 가능성 평가:
  - 핵심 UI 동작이 동일한가?
  - 추가할 props나 스타일이 기존 구조에 자연스럽게 확장 가능한가?
  - 수정으로 인해 기존 사용처에 영향이 없는가?
- ✅ 공통 UI 요소(Button, Input, Card, Modal 등)는 반드시 `packages/ui` 사용

**사용하지 않아도 되는 경우:**

- ❌ 앱별 비즈니스 로직이 강하게 결합된 컴포넌트
- ❌ `packages/ui` 컴포넌트 사용 시 측정 가능한 성능 문제 발생
- ❌ 기존 컴포넌트를 크게 수정해야 하고, 그 수정이 다른 사용처에 부정적 영향을 주는 경우

**판단 프로세스:**

1. 확실하지 않으면 `packages/ui`로 시작
2. 사용 중 문제 발견 시, 다음 질문:
   - "이 문제를 `packages/ui` 수정으로 해결하면 다른 곳에서도 도움이 되는가?"
   - "예" → `packages/ui` 개선
   - "아니오" → 앱 전용 컴포넌트 작성 + 코드 주석으로 이유 명시

### Atom 컴포넌트 작성 패턴 (`packages/ui`)

```typescript
// packages/ui/Button.tsx
import { forwardRef } from 'react';
import { cva, VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        outline: 'border border-input',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  // 추가 props
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size })}
        {...props}
      />
    );
  }
);
```

### CSS 스타일링

- `cn` 유틸리티를 활용하여 조건부 또는 동적 스타일을 적용합니다.

- 프로젝트의 `design-guide`를 준수하며, `theme`과 디자인 토큰을 최대한 활용합니다.

**코드 스타일 일관성:**

- 같은 파일/모듈 내에서는 기존 코드의 스타일을 따릅니다.
