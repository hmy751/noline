import { forwardRef } from 'react';
import { Pressable as RNPressable, Text, type PressableProps, type PressableStateCallbackType } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const pressableVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors active:opacity-80',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        outline: 'border border-input bg-background',
        secondary: 'bg-secondary',
        ghost: 'bg-transparent',
      },
      size: {
        sm: 'h-[32px] px-3',
        md: 'h-[44px] px-4',
        lg: 'h-[48px] px-6',
        icon: 'h-[40px] w-[40px]',
        auto: '', // 높이 자동 (카드 등 콘텐츠 기반)
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface PressableComponentProps
  extends Omit<PressableProps, 'children'>,
    VariantProps<typeof pressableVariants> {
  children?: React.ReactNode | ((state: PressableStateCallbackType) => React.ReactNode);
  className?: string;
}

export const Pressable = forwardRef<React.ElementRef<typeof RNPressable>, PressableComponentProps>(
  ({ className, variant = 'default', size = 'md', children, disabled, ...props }, ref) => {
    // 각 variant별 텍스트 색상 정의
    const textColorMap: Record<NonNullable<typeof variant>, string> = {
      default: '#F5FBF5', // primary-foreground
      destructive: '#FBF5F5', // destructive-foreground
      outline: '#1F1F1F', // foreground
      secondary: '#1F1F1F', // foreground
      ghost: '#1F1F1F', // foreground
    };

    // 각 size별 폰트 크기 정의
    const fontSizeMap: Record<NonNullable<typeof size>, number> = {
      sm: 12,
      md: 14,
      lg: 16,
      icon: 14,
      auto: 14,
    };

    const textColor = textColorMap[variant ?? 'default'];
    const fontSize = fontSizeMap[size ?? 'md'];

    return (
      <RNPressable
        ref={ref}
        className={cn(pressableVariants({ variant, size, className }), disabled && 'opacity-50')}
        disabled={disabled}
        {...props}
      >
        {(state) => {
          const content = typeof children === 'function' ? children(state) : children;

          return typeof content === 'string' ? (
            <Text style={{ color: textColor, fontSize, fontWeight: '600', textAlign: 'center' }}>{content}</Text>
          ) : (
            content
          );
        }}
      </RNPressable>
    );
  },
);

Pressable.displayName = 'Pressable';
