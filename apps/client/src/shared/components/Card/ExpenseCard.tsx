import { View, Text, TouchableOpacity } from 'react-native';
import { Card, Badge, cn, Pressable } from '@repo/ui';
import { MapPin, Camera, Clock, MoreVertical } from 'lucide-react-native';

interface ExpenseCardProps {
  title: string;
  amount: string;
  currency: string;
  category?: string;
  location?: string;
  date?: string;
  hasReceipt?: boolean;
  isPending?: boolean;
  className?: string;
  onPress?: () => void;
  onMenuPress?: (event: any) => void;
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
  onPress,
  onMenuPress,
}: ExpenseCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className={cn('p-sm flex-col gap-xs relative', className)}>
        {/* Title and Amount */}
        <View className='flex-row items-start justify-between'>
          <Text className='flex-1 text-title-medium text-foreground pr-8'>{title}</Text>
          <View className='flex-row items-center gap-xs'>
            {isPending && (
              <Badge variant='outline'>
                <Clock size={10} color='hsl(45, 90%, 55%)' strokeWidth={2} />
              </Badge>
            )}
            {hasReceipt && (
              <Badge variant='outline'>
                <Camera size={10} color='hsl(0, 0%, 12%)' strokeWidth={2} />
              </Badge>
            )}
            {/* Menu Button */}
            {onMenuPress && (
              <Pressable
                variant='ghost'
                className='rounded-full p-2xs'
                onPress={(event) => {
                  event.stopPropagation();
                  onMenuPress(event);
                }}
              >
                <MoreVertical size={20} color='#666' strokeWidth={2} />
              </Pressable>
            )}
          </View>
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
    </TouchableOpacity>
  );
}
