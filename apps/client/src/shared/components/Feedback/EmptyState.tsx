import { View, Text } from 'react-native';
import { Pressable, cn } from '@repo/ui';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon = '📭', title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-sm px-sm', className)}>
      <Text className='text-display-medium'>{icon}</Text>
      <Text className='text-title-large text-center text-foreground'>{title}</Text>
      {description && <Text className='text-body text-center text-muted-foreground'>{description}</Text>}
      {actionLabel && onAction && (
        <Pressable variant='default' onPress={onAction}>
          <Text className='text-body text-primary-foreground'>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
