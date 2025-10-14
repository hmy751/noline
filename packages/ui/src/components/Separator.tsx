import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../lib/utils';

export interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Separator = forwardRef<React.ElementRef<typeof View>, SeparatorProps>(
  ({ orientation = 'horizontal', className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('bg-border', orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]', className)}
        {...props}
      />
    );
  },
);

Separator.displayName = 'Separator';
