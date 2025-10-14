import { View, Text, Pressable, type PressableProps } from 'react-native';
import { Card, Badge } from '@repo/ui';
import { cn } from '@repo/ui';

interface ExpenseCardProps extends Omit<PressableProps, 'children'> {
  title: string;
  amount: string;
  currency: string;
  category?: string;
  schedule?: string;
  hasReceipt?: boolean;
  isSynced?: boolean;
  icon?: string;
  className?: string;
}

export function ExpenseCard({
  title,
  amount,
  currency,
  category,
  schedule,
  hasReceipt = false,
  isSynced = true,
  icon = '💶',
  className,
  ...props
}: ExpenseCardProps) {
  return (
    <Pressable {...props}>
      {({ pressed }) => (
        <Card className={cn('p-xs flex-row items-center gap-xs', pressed && 'opacity-80', className)}>
          <View className='h-10 w-10 items-center justify-center rounded-md bg-muted'>
            <Text className='text-display-medium'>{icon}</Text>
          </View>

          <View className='flex-1 flex-col gap-3xs'>
            <Text className='text-title-medium text-foreground'>{title}</Text>
            <Text className='text-body text-primary'>
              {currency} {amount}
            </Text>
            {(category || schedule) && (
              <Text className='text-label text-muted-foreground'>
                {category}
                {category && schedule && ' | '}
                {schedule}
              </Text>
            )}
          </View>

          <View className='flex-col items-end gap-3xs'>
            {hasReceipt && <Text className='text-label'>📸</Text>}
            {isSynced && (
              <Badge variant='outline' className='h-4 px-2xs'>
                <Text className='text-label-small text-status-online'>✓</Text>
              </Badge>
            )}
          </View>
        </Card>
      )}
    </Pressable>
  );
}
