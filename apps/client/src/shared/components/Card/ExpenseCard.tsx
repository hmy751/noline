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
  onMenuPress?: (event: unknown) => void;
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className='w-full'>
      <Card className={cn('w-full p-sm flex-col gap-xs relative', className)}>
        {/* Menu Button - Absolute Positioned */}
        {onMenuPress && (
          <View className='absolute right-2 top-2 z-10'>
            <Pressable
              variant='ghost'
              className='rounded-full p-2xs'
              onPress={(event) => {
                event.stopPropagation();
                onMenuPress(event);
              }}
            >
              <MoreVertical size={20} color='hsl(120, 8%, 35%)' strokeWidth={2} />
            </Pressable>
          </View>
        )}

        {/* Title */}
        <Text className='text-title-medium text-foreground pr-8' numberOfLines={1}>
          {title}
        </Text>

        {/* Location */}
        {location && (
          <View className='flex-row items-center gap-3xs'>
            <MapPin size={14} color='hsl(120, 8%, 35%)' strokeWidth={2} />
            <Text className='text-body text-muted-foreground' numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}

        {/* Bottom Row: Amount & Info (All Left Aligned) */}
        <View className='mt-1 flex-row items-center gap-sm'>
          {/* Amount */}
          <Text className='text-title-large text-primary'>
            {currency} {amount}
          </Text>

          {/* Category, Date, Icons */}
          <View className='flex-row items-center gap-xs'>
            {category && (
              <View className='rounded bg-muted px-xs py-3xs'>
                <Text className='text-label text-muted-foreground'>{category}</Text>
              </View>
            )}
            {date && (
              <View className='rounded-md bg-muted px-2xs py-3xs'>
                <Text className='text-label text-foreground'>{date}</Text>
              </View>
            )}
            {isPending && <Clock size={14} color='hsl(45, 90%, 55%)' strokeWidth={2} />}
            {hasReceipt && <Camera size={14} color='hsl(120, 8%, 35%)' strokeWidth={2} />}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
