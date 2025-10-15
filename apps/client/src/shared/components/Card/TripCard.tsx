import { View, Text, type ViewProps } from 'react-native';
import { cn } from '@repo/ui';
import { Calendar } from 'lucide-react-native';

interface TripCardProps extends ViewProps {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  scheduleCount?: number;
  totalExpense?: string;
  currency?: string;
  className?: string;
}

export function TripCard({
  destination,
  country,
  startDate,
  endDate,
  scheduleCount,
  totalExpense,
  currency = 'EUR',
  className,
  ...props
}: TripCardProps) {
  return (
    <View
      className={cn('rounded-xl bg-primary p-md', className)}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
      {...props}
    >
      {/* Title and Date */}
      <View className='mb-md flex-col gap-2xs'>
        <Text className='text-display-medium text-primary-foreground'>
          {destination}, {country}
        </Text>
        <View className='flex-row items-center gap-xs'>
          <Calendar size={16} color='rgba(245, 251, 245, 0.9)' strokeWidth={2} />
          <Text className='text-body text-primary-foreground/90'>
            {startDate} - {endDate}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View className='mb-sm h-px bg-primary-foreground/20' />

      {/* Stats */}
      <View className='flex-row items-center justify-between'>
        {scheduleCount !== undefined && (
          <View className='flex-col gap-3xs'>
            <Text className='text-label text-primary-foreground/70'>일정</Text>
            <Text className='text-title-large text-primary-foreground'>{scheduleCount}개</Text>
          </View>
        )}
        {totalExpense !== undefined && (
          <View className='flex-col items-end gap-3xs'>
            <Text className='text-label text-primary-foreground/70'>총 경비</Text>
            <Text className='text-title-large text-primary-foreground'>
              {currency} {totalExpense}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
