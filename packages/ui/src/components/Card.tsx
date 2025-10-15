import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../lib/utils';

export interface CardProps extends ViewProps {
  className?: string;
}

export const Card = forwardRef<React.ElementRef<typeof View>, CardProps>(
  ({ className, children, style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('rounded-lg bg-card p-sm', className)}
        style={[
          {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  },
);

Card.displayName = 'Card';
