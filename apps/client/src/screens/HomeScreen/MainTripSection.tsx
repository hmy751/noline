import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { TripCard, type TripData, type ActivationStatus, useDeactivateTrip } from '@/entities/trip';
import { useGetTripExpenses } from '@/entities/expense';
import { useGetSchedules } from '@/entities/schedule';
import { groupExpensesByCurrency } from '@/shared/lib/currency';
import { getTripActivationStatusDetail } from '@/shared/services/offline-prep/metadata';

interface MainTripSectionProps {
  mainTripData: TripData | null;
  isLoading: boolean;
  isError: boolean;
  onEditPress: () => void;
  onActivatePress: (tripId: string, tripName: string) => void;
  /** 외부에서 상태 갱신을 트리거하기 위한 키 */
  refreshKey?: number;
}

export function MainTripSection({
  mainTripData,
  isLoading,
  isError,
  onEditPress,
  onActivatePress,
  refreshKey,
}: MainTripSectionProps) {
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // ✅ 일정 개수 조회
  const { data: mainTripSchedules = [] } = useGetSchedules(mainTripData?.id ?? '');

  // ✅ CURRENCY_POLICY: 통화별 경비 그룹핑 (baseCurrency 우선)
  const { data: mainTripExpenses = [] } = useGetTripExpenses(mainTripData?.id ?? '');
  const expensesByCurrency = useMemo(
    () => groupExpensesByCurrency(mainTripExpenses, mainTripData?.baseCurrency),
    [mainTripExpenses, mainTripData?.baseCurrency],
  );

  // 비활성화 mutation
  const { mutate: deactivateTrip } = useDeactivateTrip();

  // ✅ 활성화 상태 조회 (service 레이어 사용)
  const [activationStatus, setActivationStatus] = useState<ActivationStatus>('online');

  // 활성화 상태 확인 함수
  const checkActivationStatus = useCallback(async () => {
    if (!mainTripData?.id) {
      setActivationStatus('online');
      return;
    }

    try {
      const status = await getTripActivationStatusDetail(mainTripData.id);
      setActivationStatus(status);
    } catch (error) {
      console.error('❌ Failed to check activation status:', error);
      setActivationStatus('online');
    }
  }, [mainTripData?.id]);

  // mainTripData 또는 refreshKey 변경 시 상태 확인
  useEffect(() => {
    checkActivationStatus();
  }, [checkActivationStatus, refreshKey]);

  // 비활성화 핸들러
  const handleDeactivate = () => {
    if (!mainTripData) return;

    Alert.alert(
      '오프라인 해제',
      `"${mainTripData.destination}" 여행을 오프라인 해제하시겠습니까?\n\n• 오프라인 지도 삭제\n• 로컬 일정/경비 데이터 삭제\n\n서버에 저장된 데이터는 유지됩니다.`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '해제',
          style: 'destructive',
          onPress: () => {
            // UI 즉시 업데이트 (Optimistic Update)
            setActivationStatus('online');

            deactivateTrip(
              { tripId: mainTripData.id, cleanupData: true },
              {
                onSuccess: () => {
                  Alert.alert('완료', '오프라인이 해제되었습니다.');
                },
                onError: () => {
                  // 실패 시 상태 다시 확인
                  checkActivationStatus();
                  Alert.alert('오류', '오프라인 해제에 실패했습니다.');
                },
              },
            );
          },
        },
      ],
    );
  };

  // 메인 여행 데이터 변환
  const mainTrip = mainTripData
    ? {
        destination: mainTripData.destination,
        country: mainTripData.country || '',
        startDate: formatDate(mainTripData.startDate),
        endDate: formatDate(mainTripData.endDate),
        scheduleCount: mainTripSchedules.length,
        expensesByCurrency, // ✅ 통화별 경비 데이터 전달
        baseCurrency: mainTripData.baseCurrency, // ✅ 빈 경비 시 표시용
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
      onDeactivatePress={activationStatus !== 'online' ? handleDeactivate : undefined}
      onEditPress={onEditPress}
    />
  );
}
