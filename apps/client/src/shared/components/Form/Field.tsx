import { View, Text, type ViewProps, type TextProps } from 'react-native';
import { cn } from '@repo/ui';

// ========================================
// Field Compound Component (form 규칙 준수)
// ========================================

type FieldRootProps = ViewProps;
type FieldTitleProps = TextProps;
type FieldElementsBoxProps = ViewProps;
type FieldDescriptionProps = TextProps;
type FieldMessageProps = TextProps;

/**
 * Field.Root - 단일 필드를 감싸는 최상위 컨테이너
 */
function FieldRoot({ className, ...props }: FieldRootProps) {
  return <View className={cn('flex-col gap-2xs', className)} {...props} />;
}

/**
 * Field.Title - 필드의 제목/레이블
 */
function FieldTitle({ className, ...props }: FieldTitleProps) {
  return <Text className={cn('text-label text-foreground font-medium', className)} {...props} />;
}

/**
 * Field.ElementsBox - 입력 요소(TextInput 등)를 감싸는 컨테이너
 * 가로/세로 정렬 처리
 */
function FieldElementsBox({ className, ...props }: FieldElementsBoxProps) {
  return <View className={cn('flex-col gap-2xs', className)} {...props} />;
}

/**
 * Field.Description - 필드에 대한 추가 정보 제공
 */
function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return <Text className={cn('text-label text-muted-foreground', className)} {...props} />;
}

/**
 * Field.Message - 유효성 검사 에러 메시지 표시
 */
function FieldMessage({ className, ...props }: FieldMessageProps) {
  return <Text className={cn('text-label text-destructive', className)} {...props} />;
}

// Compound Component 구성
export const Field = Object.assign(FieldRoot, {
  Title: FieldTitle,
  ElementsBox: FieldElementsBox,
  Description: FieldDescription,
  Message: FieldMessage,
});
