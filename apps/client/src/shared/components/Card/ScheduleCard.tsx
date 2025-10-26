import { View, Text, TouchableOpacity } from 'react-native';
import { Card, cn, Pressable } from '@repo/ui';
import { MapPin, Wallet, MoreVertical } from 'lucide-react-native';

interface ScheduleCardProps {
  date?: string;
  time: string;
  title: string;
  location: string;
  expense?: string;
  expenseCount?: number;
  currency?: string;
  className?: string;
  onPress?: () => void;
  onMenuPress?: (event: any) => void;
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
  onPress,
  onMenuPress,
}: ScheduleCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
      <Card className={cn('p-sm flex-col gap-xs relative', className)}>
        {/* Menu Button */}
        {onMenuPress && (
          <Pressable
            variant='ghost'
            className='absolute right-xs top-xs rounded-full p-2xs z-10'
            onPress={(event) => {
              event.stopPropagation();
              onMenuPress(event);
            }}
          >
            <MoreVertical size={20} color='#666' strokeWidth={2} />
          </Pressable>
        )}

        {/* Title */}
        <Text className='text-title-medium text-foreground pr-8'>{title}</Text>

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
    </TouchableOpacity>
  );
}
