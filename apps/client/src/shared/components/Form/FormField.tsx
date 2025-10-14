import { View, Text } from 'react-native';
import { Input, Label, type InputProps } from '@repo/ui';
import { cn } from '@repo/ui';

interface FormFieldProps extends InputProps {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormField({ label, error, required = false, className, ...inputProps }: FormFieldProps) {
  return (
    <View className={cn('flex-col gap-2xs', className)}>
      {label && (
        <Label>
          <Text className='text-label text-foreground'>
            {label}
            {required && <Text className='text-destructive'> *</Text>}
          </Text>
        </Label>
      )}
      <Input {...inputProps} />
      {error && <Text className='text-label text-destructive'>{error}</Text>}
    </View>
  );
}
