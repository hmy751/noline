import { View, type ViewProps } from 'react-native';
import { cn } from '@repo/ui';

interface StackProps extends ViewProps {
  direction?: 'vertical' | 'horizontal';
  gap?: 'none' | '4xs' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

const gapClasses = {
  none: '',
  '4xs': 'gap-4xs',
  '3xs': 'gap-3xs',
  '2xs': 'gap-2xs',
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
  xl: 'gap-xl',
  '2xl': 'gap-2xl',
  '3xl': 'gap-3xl',
};

export function Stack({ direction = 'vertical', gap = 'sm', className, children, ...props }: StackProps) {
  return (
    <View
      className={cn('flex', direction === 'vertical' ? 'flex-col' : 'flex-row', gapClasses[gap], className)}
      {...props}
    >
      {children}
    </View>
  );
}
