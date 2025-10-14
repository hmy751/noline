import { View, type ViewProps } from 'react-native';
import { cn } from '@repo/ui';

interface ContainerProps extends ViewProps {
  className?: string;
}

export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <View className={cn('flex-1 px-sm', className)} {...props}>
      {children}
    </View>
  );
}
