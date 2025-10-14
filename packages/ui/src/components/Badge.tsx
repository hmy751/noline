import { forwardRef } from 'react';
import { View, Text, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-sm px-2 py-1', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'bg-secondary',
      destructive: 'bg-destructive',
      outline: 'border border-input bg-transparent',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const badgeTextVariants = cva('text-label-small font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export const Badge = forwardRef<React.ElementRef<typeof View>, BadgeProps>(
  ({ className, textClassName, variant, children, ...props }, ref) => {
    return (
      <View ref={ref} className={cn(badgeVariants({ variant }), className)} {...props}>
        {typeof children === 'string' ? (
          <Text className={cn(badgeTextVariants({ variant }), textClassName)}>{children}</Text>
        ) : (
          children
        )}
      </View>
    );
  },
);

Badge.displayName = 'Badge';
