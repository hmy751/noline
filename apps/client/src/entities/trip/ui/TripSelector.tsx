import { useState } from 'react';
import { View, Text } from 'react-native';
import { Plane, ChevronDown, Check, WifiOff } from 'lucide-react-native';
import { Badge, Drawer, Pressable } from '@repo/ui';
import { useGetTrips } from '../data';
import { useGetActiveTrip } from '../data/useGetTripActivation';
import { selectMainTrip } from '../utils';
import { useTripStore } from '@/shared/store';
import type { TripData } from '../model';

interface Trip {
  value: string;
  label: string;
  isMain?: boolean;
  isActivated?: boolean;
  activationStatus?: 'preparing' | 'ready';
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
  const [isOpen, setIsOpen] = useState(false);

  // 실제 여행 데이터 가져오기
  const { data: allTrips = [], isLoading } = useGetTrips();
  const mainTrip = selectMainTrip(allTrips);

  // 활성화된 여행 정보 (React Query로 관리 - 캐시 무효화 시 자동 갱신)
  const { data: activeTrip } = useGetActiveTrip();
  const activatedTrip = activeTrip
    ? {
        tripId: activeTrip.tripId,
        status: (activeTrip.mapDownloaded ? 'ready' : 'preparing') as 'preparing' | 'ready',
      }
    : null;

  // TripData를 Trip 형태로 변환하는 함수
  const convertTripDataToTrip = (tripData: TripData, isMain: boolean = false): Trip => {
    const label = tripData.country ? `${tripData.destination}, ${tripData.country}` : tripData.destination;
    const isActivated = activatedTrip?.tripId === tripData.id;

    return {
      value: tripData.id.toString(),
      label,
      isMain,
      isActivated,
      activationStatus: isActivated ? activatedTrip?.status : undefined,
    };
  };

  // 여행 목록 생성 (메인 여행 표시 포함)
  const trips: Trip[] = allTrips.map((tripData) => convertTripDataToTrip(tripData, tripData.id === mainTrip?.id));

  // 선택된 여행 객체
  const selectedTrip = trips.find((trip) => trip.value === selectedTripId) || {
    value: '',
    label: '여행을 선택하세요',
  };

  const handleTripChange = (trip: Trip) => {
    setSelectedTripId(trip.value);
    setIsOpen(false);
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
    <>
      <View className={className}>
        <Pressable variant='outline' size='md' onPress={() => setIsOpen(true)} className='w-full h-auto py-xs px-sm'>
          <View className='w-full flex-row items-center justify-between'>
            <View className='flex-row items-center gap-xs'>
              <Plane size={18} color='hsl(0, 0%, 12%)' strokeWidth={2} />
              <Text className='text-body text-foreground'>{selectedTrip.label}</Text>
              {selectedTrip.isMain && (
                <Badge variant='secondary' className='ml-xs'>
                  <Text className='text-label-small text-muted-foreground'>메인</Text>
                </Badge>
              )}
              {selectedTrip.isActivated && (
                <Badge variant='default' className='ml-xs flex-row items-center gap-0.5 bg-emerald-100'>
                  <Text className='text-label-small text-emerald-700'>활성화</Text>
                </Badge>
              )}
            </View>
            <ChevronDown size={16} color='hsl(0, 0%, 45%)' strokeWidth={2} />
          </View>
        </Pressable>
      </View>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title='여행 선택'>
        <View className='flex-col gap-sm pb-xl'>
          {trips.map((trip) => {
            const isSelected = trip.value === selectedTrip.value;
            return (
              <Pressable
                key={trip.value}
                variant='ghost'
                size='lg'
                onPress={() => handleTripChange(trip)}
                className={`w-full h-auto py-sm px-md justify-start ${isSelected ? 'bg-muted' : ''}`}
              >
                <View className='w-full flex-row items-center'>
                  <View className='mr-sm items-center justify-center w-5'>
                    {isSelected ? (
                      <Check size={20} color='hsl(142, 76%, 36%)' strokeWidth={2.5} />
                    ) : (
                      <Plane size={20} color='hsl(0, 0%, 45%)' strokeWidth={2} />
                    )}
                  </View>
                  <View className='flex-1 flex-row items-center'>
                    <Text
                      className={`text-body-large ${isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                    >
                      {trip.label}
                    </Text>
                    {trip.isMain && (
                      <Badge variant='secondary' className='ml-sm'>
                        <Text className='text-label-small text-muted-foreground'>메인</Text>
                      </Badge>
                    )}
                    {trip.isActivated && (
                      <Badge variant='default' className='ml-xs flex-row items-center gap-0.5 bg-emerald-100'>
                        <Text className='text-label-small text-emerald-700'>활성화</Text>
                      </Badge>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Drawer>
    </>
  );
}
