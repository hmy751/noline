import { forwardRef } from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
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
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const buttonTextVariants = cva('font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-foreground',
      ghost: 'text-foreground',
    },
    size: {
      sm: 'text-sm',
      md: 'text-body',
      lg: 'text-body-large',
      icon: 'text-body',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ className, textClassName, variant = 'default', size, children, disabled, ...props }, ref) => {
    // 각 variant별 텍스트 색상 정의
    const textColorMap: Record<NonNullable<typeof variant>, string> = {
      default: '#F5FBF5', // primary-foreground
      destructive: '#FBF5F5', // destructive-foreground
      outline: '#1F1F1F', // foreground
      secondary: '#1F1F1F', // foreground
      ghost: '#1F1F1F', // foreground
    };

    const textColor = textColorMap[variant ?? 'default'];

    return (
      <Pressable
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }), disabled && 'opacity-50')}
        disabled={disabled}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text className={cn(buttonTextVariants({ variant, size }), textClassName)} style={{ color: textColor }}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);

Button.displayName = 'Button';
