import { View, Text, ActivityIndicator } from 'react-native';
import { useMemo } from 'react';
import { TripCard, type TripData, type ActivationStatus } from '@/entities/trip';
import { useGetTripExpenses } from '@/entities/expense';
import { groupExpensesByCurrency } from '@/shared/lib/currency';

interface MainTripSectionProps {
  mainTripData: TripData | null;
  isLoading: boolean;
  isError: boolean;
  onEditPress: () => void;
  onActivatePress: (tripId: string, tripName: string) => void;
}

export function MainTripSection({
  mainTripData,
  isLoading,
  isError,
  onEditPress,
  onActivatePress,
}: MainTripSectionProps) {
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // ✅ CURRENCY_POLICY: 통화별 경비 그룹핑 (금액 기준 내림차순)
  const { data: mainTripExpenses = [] } = useGetTripExpenses(mainTripData?.id ?? '');
  const expensesByCurrency = useMemo(() => groupExpensesByCurrency(mainTripExpenses), [mainTripExpenses]);

  // 메인 여행 데이터 변환
  const mainTrip = mainTripData
    ? {
        destination: mainTripData.destination,
        country: mainTripData.country || '',
        startDate: formatDate(mainTripData.startDate),
        endDate: formatDate(mainTripData.endDate),
        scheduleCount: 0, // TODO: 일정 개수 집계 API 추가 필요
        expensesByCurrency, // ✅ 통화별 경비 데이터 전달
      }
    : null;

  // 활성화 상태 가져오기
  const getActivationStatus = (trip: TripData | null): ActivationStatus => {
    if (!trip) return 'online';

    // tripActivations에서 확인해야 하지만, 일단 activated 필드로 판단
    if (trip.activated) {
      // mapDownloaded 필드가 있다면 'ready', 없으면 'preparing'
      // 여기서는 단순화를 위해 activated면 ready로 표시
      return 'ready';
    }
    return 'online';
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <View className='flex-row items-center justify-center rounded-xl bg-card p-lg'>
        <ActivityIndicator size='large' color='#228B22' />
      </View>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <View className='rounded-xl bg-card p-md'>
        <Text className='text-body text-muted-foreground text-center'>여행 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  // 여행 없음
  if (!mainTrip || !mainTripData) {
    return (
      <View className='rounded-xl bg-card p-md'>
        <Text className='text-body text-muted-foreground text-center'>아직 생성된 여행이 없습니다.</Text>
      </View>
    );
  }

  // 메인 여행 카드
  return (
    <TripCard
      {...mainTrip}
      activationStatus={getActivationStatus(mainTripData)}
      onActivatePress={
        mainTripData.activated ? undefined : () => onActivatePress(mainTripData.id, mainTrip.destination)
      }
      onEditPress={onEditPress}
    />
  );
}
