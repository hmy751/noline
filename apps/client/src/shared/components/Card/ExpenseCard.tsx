import { View, Text, Pressable, type PressableProps } from 'react-native';
import { Card, Badge } from '@repo/ui';
import { cn } from '@repo/ui';
import { MapPin, Camera, Clock } from 'lucide-react-native';

interface ExpenseCardProps extends Omit<PressableProps, 'children'> {
  title: string;
  amount: string;
  currency: string;
  category?: string;
  location?: string;
  date?: string;
  hasReceipt?: boolean;
  isPending?: boolean;
  className?: string;
}

export function ExpenseCard({
  title,
  amount,
  currency,
  category,
  location,
  date,
  hasReceipt = false,
  isPending = false,
  className,
  ...props
}: ExpenseCardProps) {
  return (
    <Pressable {...props}>
      {({ pressed }) => (
        <Card className={cn('p-sm flex-col gap-xs', pressed && 'opacity-70', className)}>
          {/* Title and Amount */}
          <View className='flex-row items-start justify-between'>
            <Text className='flex-1 text-title-medium text-foreground'>{title}</Text>
            {isPending && (
              <Badge variant='outline' className='ml-xs'>
                <Clock size={10} color='hsl(45, 90%, 55%)' strokeWidth={2} />
              </Badge>
            )}
            {hasReceipt && (
              <Badge variant='outline' className='ml-xs'>
                <Camera size={10} color='hsl(0, 0%, 12%)' strokeWidth={2} />
              </Badge>
            )}
          </View>

          <Text className='text-display-medium text-primary'>
            {currency} {amount}
          </Text>

          {/* Location and Category */}
          <View className='flex-row items-center gap-3xs'>
            {location && (
              <>
                <MapPin size={14} color='hsl(120, 8%, 35%)' strokeWidth={2} />
                <Text className='text-body text-muted-foreground'>
                  {location}
                  {category && ` · ${category}`}
                </Text>
              </>
            )}
          </View>

          {/* Date Badge */}
          {date && (
            <View className='flex-row items-center gap-xs'>
              <View className='rounded-md bg-muted px-2xs py-3xs'>
                <Text className='text-label text-foreground'>{date}</Text>
              </View>
            </View>
          )}
        </Card>
      )}
    </Pressable>
  );
}
