import { View, Text } from 'react-native';
import { Pressable } from '@repo/ui';
import { MapPin } from 'lucide-react-native';
import { useAppPolicy } from '@/shared/policy';
import { truncateLocationName, openGoogleMapsDirections } from '@/shared/lib/external-map';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapScheduleCardProps {
  tripId: string;
  index: number;
  title: string;
  location: string;
  date: string;
  time: string;
  coordinate?: Coordinate | null;
  previousSchedule?: {
    title: string;
    coordinate?: Coordinate | null;
  } | null;
  onPressDetails?: () => void;
}

export function MapScheduleCard({
  tripId,
  index,
  title,
  location,
  date,
  time,
  coordinate,
  previousSchedule,
  onPressDetails,
}: MapScheduleCardProps) {
  const policy = useAppPolicy(tripId);

  // 온라인(google)일 때만 길찾기 버튼 표시
  const showDirectionsButton = policy.service.mapProvider === 'google';

  // 좌표가 있어야 길찾기 가능
  const canNavigate = showDirectionsButton && coordinate != null;

  // 출발지 이름
  const getOriginName = () => {
    if (index === 0) {
      return '현위치';
    }
    if (previousSchedule?.title) {
      return truncateLocationName(previousSchedule.title);
    }
    return null;
  };

  // 길찾기 핸들러
  const handleDirections = () => {
    if (!coordinate) return;

    const destination = coordinate;

    // 첫 번째 일정: origin 생략 → Google Maps가 현재 위치 사용
    // 이후: 이전 일정 좌표를 origin으로
    const origin = index > 0 && previousSchedule?.coordinate ? previousSchedule.coordinate : undefined;

    openGoogleMapsDirections({ origin, destination });
  };

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

      {/* 하단: 버튼 (1:1.5 비율) */}
      <View className='flex-row gap-xs'>
        <Pressable
          variant='outline'
          className='flex-[1] flex-row items-center justify-center rounded-md border border-card-border bg-background px-sm py-xs'
          onPress={onPressDetails}
        >
          <Text className='text-body text-foreground'>상세보기</Text>
        </Pressable>

        {/* 온라인일 때만 길찾기 버튼 표시 */}
        {showDirectionsButton && (
          <Pressable
            variant='default'
            className='flex-[1.5] flex-row items-center justify-center rounded-md bg-primary px-sm py-xs'
            disabled={!canNavigate}
            onPress={canNavigate ? handleDirections : undefined}
          >
            <Text className={`text-body text-primary-foreground ${!canNavigate ? 'opacity-50' : ''}`}>
              <Text className='font-semibold'>&apos;{getOriginName()}&apos;</Text>
              <Text>부터 길찾기</Text>
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
