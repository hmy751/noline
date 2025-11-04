# 🎨 Noline UI Component Library

> shadcn/ui 기반 React Native 컴포넌트 라이브러리

## 📚 Quick Navigation

**프로젝트 이해 (처음 읽을 때):**

- [Root CLAUDE.md](../../CLAUDE.md) - 프로젝트 정체성, MVP vs Production 레벨
- [FSD Architecture](../../.claude/architecture.md) - @repo/ui의 역할과 계층 구조

**컴포넌트 개발시 참조:**

- [Components Guide](../../.claude/components.md) - 컴포넌트 작성 상세 규칙
- [TypeScript Guide](../../.claude/typescript.md) - TypeScript 패턴

## 📋 Overview

`@repo/ui`는 **비즈니스 로직 없는 순수 UI 컴포넌트** 라이브러리입니다.

## 🎯 컴포넌트 설계 철학

### 핵심: "컴포넌트는 자신이 놓일 환경을 가정해서는 안 된다"

좋은 컴포넌트는 **컨텍스트 독립적(Context-Agnostic)**이어야 합니다.

**❌ 나쁜 예:** 컴포넌트가 외부 margin 포함
**✅ 좋은 예:** 부모가 간격 제어 (gap, padding)

### 원칙: "배치는 부모에게, 내부는 컴포넌트에게"

1. **외부 여백(Margin) 금지**
   - 컴포넌트 최상위에 margin, position, top, left 등 금지
   - 간격은 부모의 gap, padding으로 제어

2. **내부 여백(Padding)만 허용**
   - 컴포넌트 내부 콘텐츠 간격은 padding 사용
   - 내부 요소 배치는 컴포넌트 책임

3. **크기는 유연하게**
   - 기본: 콘텐츠에 맞춤
   - 필요시: width/height props로 제어

### Atom vs Composition

- **Atom (packages/ui)**: 원자 단위 컴포넌트 (Button, Input, Card shell)
- **Composition (shared/components)**: Atom 조합 컴포넌트 (FormField, PageLayout)

### 핵심 원칙

- **비즈니스 무관**: "Trip", "Expense" 같은 도메인 지식 없음
- **순수 UI**: 스타일과 기본 인터랙션만 포함
- **재사용성**: 모든 프로젝트에서 사용 가능
- **일관성**: 통일된 디자인 언어 제공

> **상세 규칙**: [Components Guide](../../.claude/components.md) - 외부 margin 금지, forwardRef 사용 등

## 🏗 Architecture

### 기본 구조 (참고용)

```plaintext
packages/ui/
├── src/
│   ├── components/           # UI 컴포넌트
│   │   ├── Input.tsx        # 예: 입력 필드
│   │   ├── Card.tsx         # 예: 카드 컨테이너
│   │   ├── Select.tsx       # 예: 선택 박스
│   │   └── ...              # 기타 컴포넌트들
│   ├── lib/
│   │   └── utils.ts         # 유틸리티 함수 (cn)
│   └── index.ts             # 진입점 (exports)
├── package.json
└── tsconfig.json
```

> 💡 **참고**: 컴포넌트 파일명은 예시이며, 실제 구현된 컴포넌트는 아래 "현재 구현된 컴포넌트" 섹션을 참조하세요.

## 🧩 Core Components

### 현재 구현된 컴포넌트 (계속 추가 중)

**Form 관련:**

- **Input** - 텍스트 입력
- **Textarea** - 멀티라인 텍스트 입력
- **Checkbox** - 체크박스
- **Switch** - 토글 스위치
- **RadioGroup** - 라디오 버튼 그룹
- **Select** - 드롭다운 선택
- **Label** - 폼 라벨

**Layout 관련:**

- **Card** - 콘텐츠 컨테이너 (CardHeader, CardContent, CardFooter)
- **Separator** - 구분선
- **Drawer** - 하단 서랍 (Bottom Sheet)

**Media & Display:**

- **Image** - 이미지 컴포넌트
- **Avatar** - 프로필 아바타
- **Badge** - 배지/태그

**Interaction:**

- **Pressable** - 터치 인터랙션 래퍼
- **Calendar** - 날짜 선택 캘린더

> 💡 **참고**: 컴포넌트는 프로젝트 요구사항에 따라 지속적으로 추가됩니다.
> 각 컴포넌트의 상세 Props는 해당 파일을 참조하세요.

## 🎨 Styling System

### 디자인 토큰

**색상:**

- primary, secondary, destructive
- muted, background, foreground, border

**간격:**

- xs(4), sm(8), md(16), lg(24), xl(32), 2xl(48)

**타이포그래피:**

- h1(32), h2(24), h3(20), body(16), caption(14)

## 🛠 Utilities

**cn (Class Names)**: 조건부 클래스 결합 유틸리티

- 위치: `@repo/ui/lib/utils`

## 📋 개발 가이드라인

### 권장 패턴

- **순수 UI**: 비즈니스 로직 없음
- **범용 Props**: title, description, children
- **스타일 변형**: variant, size props 제공

### 주의 사항

- **도메인 결합**: Trip, Expense 등 비즈니스 개념 피함
- **API 호출**: fetch, axios 등 네트워크 요청 피함
- **외부 의존성**: 특정 앱 로직에 종속 피함

## 📦 Usage in Apps

### 사용 예시

**entities 레이어**: @repo/ui를 활용한 도메인 컴포넌트

- `entities/trip/ui/TripCard.tsx` - Card 컴포넌트 활용

**shared 레이어**: 앱 공용 컴포넌트 조합

- `shared/components/FormField.tsx` - Input + Label 조합

## 🔄 Component Lifecycle

### 1. 개발 프로세스

```
1. 디자인 시스템 정의 (Figma)
   ↓
2. @repo/ui에 순수 컴포넌트 구현
   ↓
3. Storybook으로 문서화 (예정)
   ↓
4. 앱에서 import하여 사용
```

### 2. 버전 관리

```json
// packages/ui/package.json
{
  "name": "@repo/ui",
  "version": "1.0.0",
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*.tsx"
  }
}
```

## 🧪 Testing (구현 예정)

### 컴포넌트 테스트

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@repo/ui';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button>Click me</Button>
    );
    expect(getByText('Click me')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>Click me</Button>
    );
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## 📚 Related Documents

**다른 Workspace:**

- [Client CLAUDE.md](../../apps/client/CLAUDE.md) - 클라이언트에서 @repo/ui 사용법

**상세 구현 가이드:**

- [Components Guide](../../.claude/components.md) - 컴포넌트 작성 규칙
- [FSD Architecture](../../.claude/architecture.md) - @repo/ui의 계층적 역할
- [TypeScript Guide](../../.claude/typescript.md) - Props 타입 정의
