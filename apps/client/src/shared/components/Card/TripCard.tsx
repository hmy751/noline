import { View, Text, type ViewProps } from 'react-native';
import { Card } from '@repo/ui';
import { cn } from '@repo/ui';

interface TripCardProps extends ViewProps {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  className?: string;
}

export function TripCard({
  destination,
  country,
  startDate,
  endDate,
  daysRemaining,
  className,
  ...props
}: TripCardProps) {
  return (
    <Card className={cn('p-sm', className)} {...props}>
      <View className='flex-col gap-2xs'>
        <Text className='text-title-medium text-foreground'>
          📍 {destination}, {country}
        </Text>
        <Text className='text-body text-muted-foreground'>
          {startDate} - {endDate}
        </Text>
        <Text className='text-body text-primary'>{daysRemaining}일 남음</Text>
      </View>
    </Card>
  );
}
