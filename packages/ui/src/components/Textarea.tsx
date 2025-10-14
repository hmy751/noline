import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '../lib/utils';

export interface TextareaProps extends Omit<TextInputProps, 'multiline'> {
  className?: string;
}

export const Textarea = forwardRef<React.ElementRef<typeof TextInput>, TextareaProps>(
  ({ className, placeholderTextColor = 'hsl(0, 0%, 75%)', ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        multiline
        className={cn(
          'min-h-[80px] rounded-md border border-input bg-background px-4 py-3 text-body text-foreground',
          'placeholder:text-input',
          className,
        )}
        placeholderTextColor={placeholderTextColor}
        textAlignVertical='top'
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
