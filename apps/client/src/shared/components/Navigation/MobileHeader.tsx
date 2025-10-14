import { View, Text, Pressable } from 'react-native';
import { cn } from '@repo/ui';

interface MobileHeaderProps {
  title?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  className?: string;
}

export function MobileHeader({ title, leftIcon, rightIcon, onLeftPress, onRightPress, className }: MobileHeaderProps) {
  return (
    <View
      className={cn(
        'h-14 flex-row items-center justify-between border-b border-card-border bg-background px-sm',
        className,
      )}
    >
      <View className='w-10'>
        {leftIcon && onLeftPress && (
          <Pressable onPress={onLeftPress} className='h-10 w-10 items-center justify-center'>
            {leftIcon}
          </Pressable>
        )}
      </View>

      {title && <Text className='text-title-large text-foreground'>{title}</Text>}

      <View className='w-10'>
        {rightIcon && onRightPress && (
          <Pressable onPress={onRightPress} className='h-10 w-10 items-center justify-center'>
            {rightIcon}
          </Pressable>
        )}
      </View>
    </View>
  );
}
