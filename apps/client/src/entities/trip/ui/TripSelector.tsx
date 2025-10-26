import { View, Text } from 'react-native';
import { Plane, ChevronDown, Check } from 'lucide-react-native';
import { Select, Badge } from '@repo/ui';
import { useGetTrips } from '../data';
import { selectMainTrip } from '../utils';
import { useTripStore } from '@/shared/store';
import type { TripData } from '../model';

interface Trip {
  value: string;
  label: string;
  isMain?: boolean;
}

interface TripSelectorProps {
  className?: string;
}

/**
 * TripSelector - 현재 여행 선택 컴포넌트
 *
 * packages/ui의 Select Compound Component를 조합하여 만든
 * 여행 선택 특화 컴포넌트입니다.
 *
 * 실제 여행 데이터를 API에서 가져와서 표시하며,
 * 메인 여행은 자동으로 식별되어 뱃지로 표시됩니다.
 * 일정, 경비 등 화면 상단에 sticky 형태로 배치되어
 * 현재 선택된 여행을 표시하고 변경할 수 있습니다.
 *
 * @example
 * <TripSelector
 *   onTripChange={(trip) => console.log('Selected:', trip)}
 * />
 */
export function TripSelector({ className = '' }: TripSelectorProps) {
  // ✨ Zustand 전역 상태
  const { selectedTripId, setSelectedTripId } = useTripStore();

  // 실제 여행 데이터 가져오기
  const { data: allTrips = [], isLoading } = useGetTrips();
  const mainTrip = selectMainTrip(allTrips);

  // TripData를 Trip 형태로 변환하는 함수
  const convertTripDataToTrip = (tripData: TripData, isMain: boolean = false): Trip => {
    const label = tripData.country ? `${tripData.destination}, ${tripData.country}` : tripData.destination;

    return {
      value: tripData.id.toString(),
      label,
      isMain,
    };
  };

  // 여행 목록 생성 (메인 여행 표시 포함)
  const trips: Trip[] = allTrips.map((tripData) => convertTripDataToTrip(tripData, tripData.id === mainTrip?.id));

  // 선택된 여행 객체
  const selectedTrip = trips.find((trip) => trip.value === selectedTripId) || {
    value: '',
    label: '여행을 선택하세요',
  };

  const handleTripChange = (option: { value: string; label: string } | undefined) => {
    if (option) {
      setSelectedTripId(option.value);
    }
  };

  // 로딩 중이거나 여행이 없을 때
  if (isLoading) {
    return (
      <View className={className}>
        <View className='flex-row items-center gap-xs px-md py-sm'>
          <Text className='text-body text-muted-foreground'>여행을 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (trips.length === 0) {
    return (
      <View className={className}>
        <View className='flex-row items-center gap-xs px-md py-sm'>
          <Text className='text-body text-muted-foreground'>여행이 없습니다</Text>
        </View>
      </View>
    );
  }

  return (
    <Select value={selectedTrip} onValueChange={handleTripChange}>
      <View className={className}>
        <Select.Trigger size='sm'>
          <View className='flex-row items-center gap-xs'>
            <Plane size={18} color='hsl(0, 0%, 12%)' strokeWidth={2} />
            <Text className='text-body text-foreground'>{selectedTrip.label}</Text>
            {selectedTrip.isMain && (
              <Badge variant='secondary' className='ml-xs'>
                <Text className='text-label-small text-muted-foreground'>메인 여행</Text>
              </Badge>
            )}
          </View>
          <ChevronDown size={16} color='hsl(0, 0%, 45%)' strokeWidth={2} />
        </Select.Trigger>
      </View>

      <Select.Portal>
        <Select.Overlay>
          <Select.Content className='rounded-2xl bg-card shadow-lg' sideOffset={4}>
            <Select.Viewport>
              {trips.map((trip) => {
                const isSelected = trip.value === selectedTrip.value;
                return (
                  <Select.Item
                    key={trip.value}
                    value={trip.value}
                    label={trip.label}
                    className={`flex-row items-center px-sm py-xs rounded-lg ${isSelected ? 'bg-muted' : ''}`}
                  >
                    <View className='w-[20px] items-center justify-center mr-xs'>
                      {isSelected && <Check size={18} color='hsl(142, 76%, 36%)' strokeWidth={2.5} />}
                    </View>
                    <Plane size={18} color='hsl(0, 0%, 12%)' strokeWidth={2} />
                    <Text className='ml-xs text-body text-foreground'>{trip.label}</Text>
                    {trip.isMain && (
                      <Badge variant='secondary' className='ml-xs'>
                        <Text className='text-label-small text-muted-foreground'>메인</Text>
                      </Badge>
                    )}
                  </Select.Item>
                );
              })}
            </Select.Viewport>
          </Select.Content>
        </Select.Overlay>
      </Select.Portal>
    </Select>
  );
}
