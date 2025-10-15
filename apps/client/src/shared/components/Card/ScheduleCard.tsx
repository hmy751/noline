import { View, Text, Pressable, type PressableProps } from 'react-native';
import { Card } from '@repo/ui';
import { cn } from '@repo/ui';
import { MapPin, Wallet } from 'lucide-react-native';

interface ScheduleCardProps extends Omit<PressableProps, 'children'> {
  date?: string;
  time: string;
  title: string;
  location: string;
  expense?: string;
  expenseCount?: number;
  currency?: string;
  className?: string;
}

export function ScheduleCard({
  date,
  time,
  title,
  location,
  expense,
  expenseCount,
  currency = 'EUR',
  className,
  ...props
}: ScheduleCardProps) {
  return (
    <Pressable {...props}>
      {({ pressed }) => (
        <Card className={cn('p-sm flex-col gap-xs', pressed && 'opacity-70', className)}>
          {/* Title */}
          <Text className='text-title-medium text-foreground'>{title}</Text>

          {/* Location */}
          <View className='flex-row items-center gap-3xs'>
            <MapPin size={14} color='hsl(120, 8%, 35%)' strokeWidth={2} />
            <Text className='text-body text-muted-foreground'>{location}</Text>
          </View>

          {/* Date, Time, and Expense */}
          <View className='flex-row items-center gap-xs'>
            {date && (
              <View className='rounded-md bg-muted px-2xs py-3xs'>
                <Text className='text-label text-foreground'>{date}</Text>
              </View>
            )}
            <View className='rounded-md bg-muted px-2xs py-3xs'>
              <Text className='text-label text-foreground'>{time}</Text>
            </View>
            {expense && expenseCount && (
              <View className='flex-row items-center gap-3xs'>
                <Wallet size={12} color='hsl(0, 0%, 12%)' strokeWidth={2} />
                <Text className='text-label text-foreground'>
                  {currency} {expense} ({expenseCount}개)
                </Text>
              </View>
            )}
          </View>
        </Card>
      )}
    </Pressable>
  );
}
