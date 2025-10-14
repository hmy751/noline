import { forwardRef } from 'react';
import { Text, type TextProps } from 'react-native';
import { cn } from '../lib/utils';

export interface LabelProps extends TextProps {
  htmlFor?: string; // For web compatibility (ignored in React Native)
  className?: string;
}

export const Label = forwardRef<React.ElementRef<typeof Text>, LabelProps>(
  ({ className, children, htmlFor: _htmlFor, ...props }, ref) => {
    return (
      <Text ref={ref} className={cn('text-label font-medium text-foreground', className)} {...props}>
        {children}
      </Text>
    );
  },
);

Label.displayName = 'Label';
