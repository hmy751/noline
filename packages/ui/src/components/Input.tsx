import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '../lib/utils';

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, placeholderTextColor = 'hsl(0, 0%, 75%)', ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(
          'h-[44px] rounded-md border border-input bg-background px-4 text-body text-foreground',
          'placeholder:text-input',
          className,
        )}
        placeholderTextColor={placeholderTextColor}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
