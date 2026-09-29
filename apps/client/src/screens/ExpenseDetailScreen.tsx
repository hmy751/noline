import { PolicyErrorDisplay } from '@/shared/components/ErrorBoundary';
import { useTripExpensesReadQuery } from '@/features/expense/read-expenses';
import { useTripSchedulesReadQuery } from '@/features/schedule/read-schedules';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Container, Stack, MobileHeader } from '@/shared/components';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Tag, Calendar, Receipt, ChevronLeft } from 'lucide-react-native';
import { formatISOToLocalDate } from '@/shared/lib/datetime';
import { ExpenseQueryFeedback, ExpenseRefreshError } from './ExpenseQueryFeedback';

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { id, tripId } = useLocalSearchParams<{ id: string; tripId: string }>();

  const { query: expenseQuery, access, actions, view } = useTripExpensesReadQuery(tripId);
  const expense = view.kind === 'ready' ? view.data.find((item) => item.id === id) : undefined;
  const retry = () => {
    if (access.canFetch) actions.refetch();
  };

  // 연결된 일정 조회는 표시할 경비가 있을 때 시작하고 일정의 접근 조건도 적용한다.
  const { view: scheduleView } = useTripSchedulesReadQuery(tripId, {
    enabled: access.canFetch && !!expense?.scheduleId,
  });
  const linkedSchedule =
    expense?.scheduleId && scheduleView.kind === 'ready'
      ? scheduleView.data.find((schedule) => schedule.id === expense.scheduleId)
      : null;

  // 카테고리별 배경색
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      관광: '#DBEAFE',
      쇼핑: '#F3E8FF',
      식사: '#FFEDD5',
      교통: '#DCFCE7',
      숙박: '#FCE7F3',
      체험: '#E0F2FE',
      기타: '#F3F4F6',
    };
    return colors[cat] || '#F3F4F6';
  };

  const getCategoryTextColor = (cat: string) => {
    const colors: Record<string, string> = {
      관광: '#1D4ED8',
      쇼핑: '#7C3AED',
      식사: '#C2410C',
      교통: '#15803D',
      숙박: '#BE185D',
      체험: '#0369A1',
      기타: '#374151',
    };
    return colors[cat] || '#374151';
  };

  if (view.kind === 'blocked') {
    return (
      <View className='flex-1 bg-background'>
        <MobileHeader title='경비 상세' onLeftPress={() => router.back()} leftIcon={<ChevronLeft size={24} />} />
        <PolicyErrorDisplay policy={view.policy} variant='block' />
      </View>
    );
  }

  // 여행 목록 캐시가 있어도 현재 경비가 없다면 최신 조회가 끝나기 전에는 부재를 확정하지 않는다.
  if (
    view.kind === 'loading' ||
    view.kind === 'error' ||
    (view.kind === 'ready' && !expense && (expenseQuery.isFetching || expenseQuery.isError))
  ) {
    return (
      <View className='flex-1 bg-background'>
        <MobileHeader title='경비 상세' onLeftPress={() => router.back()} leftIcon={<ChevronLeft size={24} />} />
        <ExpenseQueryFeedback status={expenseQuery.isError ? 'error' : 'loading'} retry={retry} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View className='flex-1 bg-background'>
        <MobileHeader
          title='경비 상세'
          leftIcon={<ChevronLeft size={24} color='hsl(0, 0%, 12%)' />}
          onLeftPress={() => router.back()}
        />
        <View className='flex-1 items-center justify-center'>
          <Text className='text-body text-muted-foreground'>경비를 찾을 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-background'>
      <MobileHeader
        title='경비 상세'
        leftIcon={<ChevronLeft size={24} color='hsl(0, 0%, 12%)' />}
        onLeftPress={() => router.back()}
      />

      {view.kind === 'ready' && view.refreshFailed && (
        <ExpenseRefreshError retry={access.canFetch ? retry : undefined} />
      )}

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='md' className='py-md'>
            {/* 지출 금액 카드 */}
            <View className='rounded-lg bg-muted p-md'>
              <View className='flex-col gap-2xs'>
                <Text className='text-label text-muted-foreground'>지출 금액</Text>
                <Text className='text-display-large text-primary'>
                  {expense.currency} {parseFloat(expense.amount).toFixed(2)}
                </Text>
                <Text className='text-title-large text-foreground'>{expense.title}</Text>
              </View>
            </View>

            {/* 상세 정보 카드 */}
            <View className='rounded-lg border border-card-border bg-card p-md'>
              <Stack direction='vertical' gap='md'>
                {/* 카테고리 */}
                <View className='flex-col gap-2xs'>
                  <View className='flex-row items-center gap-2xs'>
                    <Tag size={16} color='hsl(120, 8%, 35%)' strokeWidth={2} />
                    <Text className='text-label text-muted-foreground'>카테고리</Text>
                  </View>
                  <View
                    className='self-start rounded px-xs py-3xs'
                    style={{ backgroundColor: getCategoryColor(expense.category) }}
                  >
                    <Text className='text-body' style={{ color: getCategoryTextColor(expense.category) }}>
                      {expense.category}
                    </Text>
                  </View>
                </View>

                {/* 날짜 */}
                <View className='flex-col gap-2xs'>
                  <View className='flex-row items-center gap-2xs'>
                    <Calendar size={16} color='hsl(120, 8%, 35%)' strokeWidth={2} />
                    <Text className='text-label text-muted-foreground'>날짜</Text>
                  </View>
                  <Text className='text-body text-foreground'>{formatISOToLocalDate(expense.date)}</Text>
                </View>

                {/* 영수증 */}
                <View className='flex-col gap-2xs'>
                  <View className='flex-row items-center gap-2xs'>
                    <Receipt size={16} color='hsl(120, 8%, 35%)' strokeWidth={2} />
                    <Text className='text-label text-muted-foreground'>영수증</Text>
                  </View>
                  <Text className='text-body text-foreground'>{expense.hasReceipt ? '첨부됨' : '없음'}</Text>
                </View>
              </Stack>
            </View>

            {/* 연결된 일정 (있는 경우만 표시) */}
            {linkedSchedule && (
              <View className='flex-col gap-xs'>
                <Text className='text-title-medium text-foreground'>연결된 일정</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/schedules/[id]',
                      params: {
                        id: linkedSchedule.id,
                        tripId: linkedSchedule.tripId,
                        scheduledAt: linkedSchedule.scheduledAt,
                      },
                    });
                  }}
                >
                  <View className='w-full rounded-lg border border-card-border bg-card p-sm relative'>
                    {/* Arrow Icon - Absolute Positioned (Right Center) */}
                    <View className='absolute right-sm top-1/2 -translate-y-1/2 z-0'>
                      <ChevronLeft size={20} color='hsl(0, 0%, 80%)' style={{ transform: [{ rotate: '180deg' }] }} />
                    </View>

                    <View className='flex-col gap-xs pr-8'>
                      <Text className='text-title-medium text-foreground' numberOfLines={1}>
                        {linkedSchedule.title}
                      </Text>
                      <View className='flex-row items-center gap-3xs'>
                        <MapPin size={14} color='hsl(120, 8%, 35%)' strokeWidth={2} />
                        <Text className='text-body text-muted-foreground' numberOfLines={1}>
                          {linkedSchedule.location}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
