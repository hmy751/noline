import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { TripCard, type TripData, type ActivationStatus, useDeactivateTrip } from '@/entities/trip';
import { useTripExpensesReadQuery } from '@/features/expense/read-expenses';
import { useTripSchedulesReadQuery } from '@/features/schedule/read-schedules';
import type { ReadQueryView } from '@/shared/services/policy-query';
import { PolicyErrorDisplay } from '@/shared/components/ErrorBoundary';
import { Pressable } from '@repo/ui';
import { ScheduleRefreshError } from '../ScheduleQueryFeedback';
import { ExpenseRefreshError } from '../ExpenseQueryFeedback';
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

  const schedulesRead = useTripSchedulesReadQuery(mainTripData?.id);
  const expensesRead = useTripExpensesReadQuery(mainTripData?.id);
  const schedules = schedulesRead.view.kind === 'ready' ? schedulesRead.view.data : undefined;
  const expenses = expensesRead.view.kind === 'ready' ? expensesRead.view.data : undefined;
  const expensesByCurrency = useMemo(
    () => (expenses ? groupExpensesByCurrency(expenses, mainTripData?.baseCurrency) : undefined),
    [expenses, mainTripData?.baseCurrency],
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
        scheduleCount: schedules?.length,
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
    <>
      <TripCard
        {...mainTrip}
        scheduleSummary={
          schedulesRead.view.kind !== 'ready' ? (
            <SummaryFeedback view={schedulesRead.view} label='일정을' retry={() => schedulesRead.actions.refetch()} />
          ) : undefined
        }
        expenseSummary={
          expensesRead.view.kind !== 'ready' ? (
            <SummaryFeedback view={expensesRead.view} label='경비를' retry={() => expensesRead.actions.refetch()} />
          ) : undefined
        }
        activationStatus={activationStatus}
        onActivatePress={
          activationStatus !== 'online' ? undefined : () => onActivatePress(mainTripData.id, mainTrip.destination)
        }
        onDeactivatePress={activationStatus !== 'online' ? handleDeactivate : undefined}
        onEditPress={onEditPress}
      />
      {schedulesRead.view.kind === 'ready' && schedulesRead.view.refreshFailed && (
        <ScheduleRefreshError
          retry={schedulesRead.access.canFetch ? () => schedulesRead.actions.refetch() : undefined}
        />
      )}
      {expensesRead.view.kind === 'ready' && expensesRead.view.refreshFailed && (
        <ExpenseRefreshError retry={expensesRead.access.canFetch ? () => expensesRead.actions.refetch() : undefined} />
      )}
    </>
  );
}

function SummaryFeedback({ view, label, retry }: { view: ReadQueryView<unknown>; label: string; retry: () => void }) {
  if (view.kind === 'blocked') return <PolicyErrorDisplay policy={view.policy} variant='inline' />;
  if (view.kind === 'error') {
    return (
      <View>
        <Text className='text-body text-primary-foreground'>{label} 불러오지 못했어요.</Text>
        <Pressable variant='outline' onPress={retry}>
          다시 불러오기
        </Pressable>
      </View>
    );
  }
  return <Text className='text-body text-primary-foreground'>{view.kind === 'loading' ? '불러오는 중' : '—'}</Text>;
}
