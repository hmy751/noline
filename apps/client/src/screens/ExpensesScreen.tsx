import { View, Text, ScrollView, Alert } from 'react-native';
import { Container, Stack, ExpenseCard, MobileHeader } from '@/shared/components';
import { TripSelector } from '@/entities/trip';
import { useGetExpenses } from '@/entities/expense';
import { useGetTrips } from '@/entities/trip';
import { Pressable } from '@repo/ui';
import { Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTripStore } from '@/shared/store';
import { useMemo, useState } from 'react';
import { ExpenseMenu } from '@/features/expense/expense-menu';

export default function ExpensesScreen() {
  const router = useRouter();
  const { selectedTripId } = useTripStore();
  const [isExpenseMenuOpen, setIsExpenseMenuOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<{
    id: string;
    title: string;
    [key: string]: unknown;
  } | null>(null);
  const [buttonPosition, setButtonPosition] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);

  // 여행 데이터 조회
  const { data: trips = [] } = useGetTrips();
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);

  // 실제 경비 데이터 조회
  const { data: expenses = [], isLoading } = useGetExpenses(selectedTripId ? { tripId: selectedTripId } : undefined);

  // 여행 날짜 범위에서 모든 날짜 생성
  const generateDateRange = (): string[] => {
    if (!selectedTrip?.startDate || !selectedTrip?.endDate) return [];

    const dates: string[] = [];
    const start = new Date(selectedTrip.startDate);
    const end = new Date(selectedTrip.endDate);

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const dateRange = generateDateRange();

  // 날짜별로 경비 매칭 (여행 기간 밖 경비도 포함)
  const expensesByDate = useMemo(() => {
    // 모든 경비의 날짜 수집
    const allDates = new Set([...dateRange, ...expenses.map((e) => e.date)]);
    const sortedDates = Array.from(allDates).sort();

    return sortedDates
      .map((date) => {
        const dayExpenses = expenses.filter((expense) => expense.date === date);
        const isInTripRange = dateRange.includes(date);

        return {
          date,
          dateLabel: date,
          items: dayExpenses,
          isInTripRange, // 여행 기간 내 날짜인지 표시
        };
      })
      .reverse(); // 최신 날짜가 위로 오도록 역순
  }, [dateRange, expenses]);

  // 총 경비 계산
  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  }, [expenses]);

  // 경비 메뉴 핸들러
  const handleExpenseMenuPress = (
    expense: { id: string; title: string; [key: string]: unknown },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
  ) => {
    setSelectedExpense(expense);
    // 버튼 위치 측정
    event.currentTarget.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setButtonPosition({ x: pageX, y: pageY, width, height });
    });
    setIsExpenseMenuOpen(true);
  };

  const handleEditExpense = () => {
    Alert.alert('경비 수정', `"${selectedExpense?.title}" 경비를 수정합니다. (구현 예정)`);
  };

  const handleDeleteExpense = () => {
    Alert.alert('경비 삭제', `"${selectedExpense?.title}" 경비를 삭제하시겠습니까?`, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          Alert.alert('성공', '경비가 삭제되었습니다. (구현 예정)');
        },
      },
    ]);
  };

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader
        title='경비'
        // rightAction={
        //   <Pressable
        //     variant='ghost'
        //     className='h-10 w-10 items-center justify-center'
        //     onPress={() => {
        //       // TODO: Open camera
        //       console.log('Open camera');
        //     }}
        //     accessibilityRole='button'
        //     accessibilityLabel='영수증 스캔 카메라 열기'
        //   >
        //     <Camera size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />
        //   </Pressable>
        // }
      />

      {/* Current Trip Selector - Sticky */}
      <TripSelector className='border-b border-card-border bg-background px-md py-sm' />

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {/* Total Expense Card */}
            <View className='flex-col gap-3xs'>
              <Text className='text-label text-muted-foreground'>총 경비</Text>
              <Text className='text-display-large text-primary'>
                {expenses.length > 0 ? `${expenses[0].currency} ${totalExpense.toFixed(2)}` : 'EUR 0.00'}
              </Text>
            </View>

            {/* Loading State */}
            {isLoading && (
              <View className='flex-1 items-center justify-center py-xl'>
                <Text className='text-body text-muted-foreground'>경비를 불러오는 중...</Text>
              </View>
            )}

            {/* Empty State - 여행이 없거나 날짜가 없을 때 */}
            {!isLoading && !selectedTrip && (
              <View className='flex-1 items-center justify-center py-xl'>
                <Text className='text-body text-muted-foreground'>여행을 선택해주세요</Text>
              </View>
            )}

            {!isLoading && selectedTrip && expenses.length === 0 && (
              <View className='flex-1 items-center justify-center py-xl'>
                <Text className='text-body text-muted-foreground'>경비를 추가해보세요</Text>
              </View>
            )}

            {/* Expense List by Date - 경비가 있는 모든 날짜 표시 */}
            {!isLoading &&
              expensesByDate.length > 0 &&
              expensesByDate.map((group) => (
                <View key={group.date} className='flex-col gap-sm'>
                  {/* Date Header */}
                  <View className='flex-row items-center justify-between'>
                    <View className='flex-row items-center gap-2xs'>
                      <Text className='text-title-large text-foreground'>{group.dateLabel}</Text>
                      <View className='rounded-full bg-muted px-xs py-3xs'>
                        <Text className='text-label text-foreground'>{group.items.length}개</Text>
                      </View>
                      {!group.isInTripRange && (
                        <View className='rounded-full bg-destructive/10 px-xs py-3xs'>
                          <Text className='text-label text-destructive'>여행 기간 외</Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      variant='outline'
                      className='flex-row items-center gap-3xs rounded-md border border-card-border bg-card px-xs py-3xs active:bg-muted'
                      onPress={() => {
                        if (selectedTripId) {
                          router.push(`/create-expense?tripId=${selectedTripId}&date=${group.date}`);
                        } else {
                          console.log('여행을 먼저 선택해주세요');
                        }
                      }}
                    >
                      <Text className='text-label text-foreground'>추가</Text>
                    </Pressable>
                  </View>

                  {/* Expense Cards or Empty State */}
                  {group.items.length > 0 ? (
                    group.items.map((expense) => (
                      <ExpenseCard
                        key={expense.id}
                        title={expense.title}
                        amount={expense.amount}
                        currency={expense.currency}
                        category={expense.category}
                        date={expense.date}
                        hasReceipt={expense.hasReceipt}
                        isPending={false}
                        onPress={() => {
                          // TODO: Navigate to expense detail
                          console.log('Navigate to expense detail:', expense.id);
                        }}
                        onMenuPress={(event) => handleExpenseMenuPress(expense, event)}
                      />
                    ))
                  ) : (
                    <View className='rounded-lg border border-dashed border-card-border bg-muted/30 px-md py-lg'>
                      <Text className='text-body text-center text-muted-foreground'>이 날의 경비를 추가해보세요</Text>
                    </View>
                  )}
                </View>
              ))}
          </Stack>
        </Container>
      </ScrollView>

      {/* Expense Menu */}
      <ExpenseMenu
        isOpen={isExpenseMenuOpen}
        onClose={() => {
          setIsExpenseMenuOpen(false);
          setSelectedExpense(null);
          setButtonPosition(undefined);
        }}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
        buttonPosition={buttonPosition}
      />
    </View>
  );
}
