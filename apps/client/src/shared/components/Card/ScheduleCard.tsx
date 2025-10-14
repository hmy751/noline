import { View, Text, Pressable, type PressableProps } from 'react-native';
import { Card, Badge } from '@repo/ui';
import { cn } from '@repo/ui';

interface ScheduleCardProps extends Omit<PressableProps, 'children'> {
  order: number;
  time: string;
  title: string;
  location: string;
  expense?: string;
  expenseCount?: number;
  className?: string;
}

export function ScheduleCard({
  order,
  time,
  title,
  location,
  expense,
  expenseCount,
  className,
  ...props
}: ScheduleCardProps) {
  return (
    <Pressable {...props}>
      {({ pressed }) => (
        <Card className={cn('p-sm flex-col gap-2xs', pressed && 'opacity-80', className)}>
          <View className='flex-row items-start justify-between'>
            <View className='flex-row items-center gap-xs'>
              <Badge variant='default' className='h-6 w-6 items-center justify-center rounded-full'>
                <Text className='text-label-small text-primary-foreground'>{order}</Text>
              </Badge>
              <Text className='text-label text-muted-foreground'>{time}</Text>
            </View>
          </View>

          <Text className='text-title-medium text-foreground'>{title}</Text>

          <View className='flex-row items-center gap-3xs'>
            <Text className='text-body text-muted-foreground'>📍 {location}</Text>
          </View>

          {(expense || expenseCount) && (
            <View className='flex-row items-center gap-xs'>
              {expense && <Text className='text-body text-primary'>💶 {expense}</Text>}
              {expenseCount && <Text className='text-body text-muted-foreground'>🧾 {expenseCount}건</Text>}
            </View>
          )}
        </Card>
      )}
    </Pressable>
  );
}
