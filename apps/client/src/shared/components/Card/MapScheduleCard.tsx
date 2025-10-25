import { View, Text } from 'react-native';
import { Pressable } from '@repo/ui';
import { MapPin } from 'lucide-react-native';

interface MapScheduleCardProps {
  index: number;
  title: string;
  location: string;
  date: string;
  time: string;
  onPressDetails?: () => void;
}

export function MapScheduleCard({ index, title, location, date, time, onPressDetails }: MapScheduleCardProps) {
  return (
    <View className='w-[330px] rounded-lg border border-card-border bg-card p-sm shadow-lg'>
      {/* 상단: 순번 + 제목 */}
      <View className='mb-sm flex-row items-start gap-xs'>
        <View className='h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary'>
          <Text className='text-body font-semibold text-primary-foreground'>{index + 1}</Text>
        </View>
        <View className='flex-1'>
          <Text className='text-title-medium text-foreground' numberOfLines={1}>
            {title}
          </Text>
          <View className='mt-3xs flex-row items-start gap-3xs'>
            <MapPin size={14} color='hsl(120, 8%, 35%)' className='mt-1' />
            <Text className='text-label flex-1 text-muted-foreground' numberOfLines={2}>
              {location}
            </Text>
          </View>
        </View>
      </View>

      {/* 중간: 날짜/시간 */}
      <View className='mb-sm flex-row gap-xs'>
        <View className='rounded-md bg-muted px-xs py-3xs'>
          <Text className='text-label text-muted-foreground'>{date}</Text>
        </View>
        <View className='rounded-md bg-muted px-xs py-3xs'>
          <Text className='text-label text-muted-foreground'>{time}</Text>
        </View>
      </View>

      {/* 하단: 버튼 */}
      <View className='flex-row gap-xs'>
        <Pressable
          variant='outline'
          className='flex-1 flex-row items-center justify-center rounded-md border border-card-border bg-background px-sm py-xs'
          onPress={onPressDetails}
        >
          <Text className='text-body text-foreground'>상세보기</Text>
        </Pressable>
        <Pressable
          variant='default'
          className='flex-1 flex-row items-center justify-center rounded-md bg-primary px-sm py-xs'
          disabled
        >
          <Text className='text-body text-primary-foreground opacity-50'>길찾기</Text>
        </Pressable>
      </View>
    </View>
  );
}
