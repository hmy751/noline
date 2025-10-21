import { View, Text } from 'react-native';
import { cn, Pressable } from '@repo/ui';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';

interface MobileHeaderProps {
  title: string;
  leftIcon?: React.ReactNode;
  leftIconAccessibilityLabel?: string;
  onLeftPress?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title,
  leftIcon,
  leftIconAccessibilityLabel,
  onLeftPress,
  rightAction,
  className,
}: MobileHeaderProps) {
  return (
    <View
      className={cn(
        'h-14 flex-row items-center justify-between border-b border-card-border bg-background px-sm',
        className,
      )}
    >
      <View className='flex-1 flex-row items-center'>
        {leftIcon && onLeftPress && (
          <Pressable
            variant='ghost'
            onPress={onLeftPress}
            className='mr-2 h-10 w-10 items-center justify-center -ml-2'
            accessibilityRole='button'
            accessibilityLabel={leftIconAccessibilityLabel || '뒤로 가기'}
          >
            {leftIcon}
          </Pressable>
        )}
        <Text className='text-title-large font-semibold text-foreground' accessibilityRole='header'>
          {title}
        </Text>
      </View>

      <View className='flex-row items-center gap-3'>
        <NetworkStatusIndicator />
        {rightAction}
      </View>
    </View>
  );
}
