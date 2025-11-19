import { View, Text, ActivityIndicator } from 'react-native';
import { useMemo, useState, useEffect } from 'react';
import { TripCard, type TripData, type ActivationStatus } from '@/entities/trip';
import { useGetTripExpenses } from '@/entities/expense';
import { groupExpensesByCurrency } from '@/shared/lib/currency';
import { getTripActivationStatusDetail } from '@/shared/services/offline-prep/metadata';

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

  // ✅ 활성화 상태 조회 (service 레이어 사용)
  const [activationStatus, setActivationStatus] = useState<ActivationStatus>('online');

  useEffect(() => {
    if (!mainTripData?.id) {
      setActivationStatus('online');
      return;
    }

    const checkActivationStatus = async () => {
      try {
        const status = await getTripActivationStatusDetail(mainTripData.id);
        setActivationStatus(status);
      } catch (error) {
        console.error('❌ Failed to check activation status:', error);
        setActivationStatus('online');
      }
    };

    checkActivationStatus();
  }, [mainTripData?.id]);

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
      activationStatus={activationStatus}
      onActivatePress={
        activationStatus !== 'online' ? undefined : () => onActivatePress(mainTripData.id, mainTrip.destination)
      }
      onEditPress={onEditPress}
    />
  );
}
