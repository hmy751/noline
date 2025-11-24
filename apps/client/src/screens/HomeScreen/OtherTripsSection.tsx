import { View, Text } from 'react-native';
import { Pressable } from '@repo/ui';
import { MoreVertical } from 'lucide-react-native';
import { type TripData } from '@/entities/trip';
import { ActivationBadge } from '@/entities/trip/ui/ActivationBadge';

interface OtherTripsSectionProps {
  trips: TripData[];
  isLoading: boolean;
  isError: boolean;
  onTripMenuPress: (trip: TripData, position: { x: number; y: number; width: number; height: number }) => void;
  activatedTripId?: string | null; // 현재 활성화된 여행 ID
}

export function OtherTripsSection({
  trips,
  isLoading,
  isError,
  onTripMenuPress,
  activatedTripId,
}: OtherTripsSectionProps) {
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 로딩 중이거나 에러 상태거나 여행이 없으면 렌더링하지 않음
  if (isLoading || isError || trips.length === 0) {
    return null;
  }

  return (
    <View className='flex-col gap-sm'>
      <Text className='text-title-large text-foreground'>다른 여행</Text>
      {trips.map((trip) => {
        // 이 여행이 활성화된 여행인지 확인
        const isActivated = trip.id === activatedTripId;
        const activationStatus = isActivated ? 'ready' : 'online';

        return (
          <View
            key={trip.id}
            className='flex-row justify-between items-center rounded-lg bg-card p-md border border-card-border'
          >
            {/* 좌측: 여행지 이름 + 날짜 */}
            <View className='flex-1 justify-center pr-sm'>
              <Text className='text-body font-semibold text-foreground mb-2xs' numberOfLines={1}>
                {trip.destination}, {trip.country}
              </Text>
              <Text className='text-label text-muted-foreground'>
                {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
              </Text>
            </View>

            {/* 우측: 메뉴 + 뱃지 */}
            <View className='items-end justify-center'>
              <Pressable
                variant='ghost'
                className='rounded-full p-2xs -mr-2xs -mt-2xs mb-xs'
                onPress={(event) => {
                  // 버튼 위치 측정
                  event.currentTarget.measure((_x, _y, width, height, pageX, pageY) => {
                    onTripMenuPress(trip, { x: pageX, y: pageY, width, height });
                  });
                }}
              >
                <MoreVertical size={20} color='#666' strokeWidth={2} />
              </Pressable>
              {isActivated && <ActivationBadge status={activationStatus} />}
            </View>
          </View>
        );
      })}
    </View>
  );
}
