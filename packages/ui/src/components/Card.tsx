import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../lib/utils';

export interface CardProps extends ViewProps {
  className?: string;
}

export const Card = forwardRef<React.ElementRef<typeof View>, CardProps>(({ className, children, ...props }, ref) => {
  return (
    <View ref={ref} className={cn('rounded-lg border border-card-border bg-card p-sm', className)} {...props}>
      {children}
    </View>
  );
});

Card.displayName = 'Card';
