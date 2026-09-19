import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MapPin, Clock, Wallet, ChevronLeft } from 'lucide-react-native';
import { Card, Pressable, Separator } from '@repo/ui';
import { Container, Stack, MobileHeader } from '@/shared/components';
import { ScheduleExpenseList } from '@/features/schedule/schedule-expense-list';
import { formatISOToLocalDate, formatISOToLocalTime } from '@/shared/lib/datetime';
import { groupExpensesByCurrency, formatCurrencyDisplay } from '@/shared/lib/currency';
import { useRouter } from 'expo-router';
import { useGetScheduleById } from '@/entities/schedule/data';
import { useGetScheduleExpenses } from '@/entities/expense';

export interface ScheduleDetailScreenProps {
  scheduleId: string;
  tripId: string;
  scheduledAt: string;
  onBack: () => void;
}

export default function ScheduleDetailScreen({ scheduleId, tripId, scheduledAt, onBack }: ScheduleDetailScreenProps) {
  const router = useRouter();

  const { data: schedule, isLoading: isLoadingSchedule } = useGetScheduleById(scheduleId, tripId);

  const { data: expenses = [], isLoading: isLoadingExpenses } = useGetScheduleExpenses(scheduleId, tripId);

  const expensesByCurrency = groupExpensesByCurrency(expenses);

  const isLoading = isLoadingSchedule || isLoadingExpenses;

  const handleExpensePress = (expenseId: string) => {
    router.push({
      pathname: '/expense-detail/[id]',
      params: { id: expenseId, tripId },
    });
  };

  const handleAddExpense = () => {
    const expenseDate = formatISOToLocalDate(scheduledAt);

    router.push(`/create-expense?tripId=${tripId}&scheduleId=${scheduleId}&date=${expenseDate}`);
  };

  const handleShowOnMap = () => {
    // TODO: 지도 화면으로 이동
    console.log('Show on map:', scheduleId);
  };

  if (isLoading) {
    return (
      <View className='flex-1 bg-background'>
        <MobileHeader
          title='일정 상세'
          leftIcon={<ChevronLeft size={24} color='hsl(0, 0%, 12%)' strokeWidth={2} />}
          onLeftPress={onBack}
        />
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='hsl(120, 61%, 34%)' />
        </View>
      </View>
    );
  }

  if (!schedule) {
    return (
      <View className='flex-1 bg-background'>
        <MobileHeader
          title='일정 상세'
          leftIcon={<ChevronLeft size={24} color='hsl(0, 0%, 12%)' strokeWidth={2} />}
          onLeftPress={onBack}
        />
        <View className='flex-1 items-center justify-center p-md'>
          <Text className='text-body text-muted-foreground'>일정을 찾을 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  const scheduleDate = formatISOToLocalDate(schedule.scheduledAt);
  const scheduleTime = formatISOToLocalTime(schedule.scheduledAt);

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader
        title='일정 상세'
        leftIcon={<ChevronLeft size={24} color='hsl(0, 0%, 12%)' strokeWidth={2} />}
        onLeftPress={onBack}
      />

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {/* Schedule Info Card */}
            <Card className='gap-sm border border-card-border'>
              {/* Title */}
              <Text className='text-title-large text-foreground'>{schedule.title}</Text>

              {/* Location */}
              <View className='flex-row items-start gap-xs'>
                <MapPin size={16} color='hsl(120, 8%, 35%)' strokeWidth={2} className='mt-1' />
                <View className='flex-1'>
                  <Text className='text-body text-foreground'>{schedule.location}</Text>
                  {schedule.address && <Text className='text-label text-muted-foreground'>{schedule.address}</Text>}
                </View>
              </View>

              {/* Date & Time */}
              <View className='flex-row items-center gap-xs'>
                <Clock size={16} color='hsl(120, 8%, 35%)' strokeWidth={2} />
                <View className='flex-row items-center gap-2xs'>
                  <View className='rounded bg-muted px-xs py-3xs'>
                    <Text className='text-label text-foreground'>{scheduleDate}</Text>
                  </View>
                  <View className='rounded bg-muted px-xs py-3xs'>
                    <Text className='text-label text-foreground'>{scheduleTime}</Text>
                  </View>
                </View>
              </View>

              {/* Separator */}
              <Separator className='my-2xs' />

              {/* Total Expense - 통화별 표시 */}
              <View className='flex-row items-center justify-between py-3xs'>
                <View className='flex-row items-center gap-xs'>
                  <Wallet size={16} color='hsl(120, 61%, 34%)' strokeWidth={2} />
                  <Text className='text-label text-muted-foreground'>총 경비</Text>
                </View>
                <View className='flex-col items-end gap-3xs'>
                  {expensesByCurrency.length > 0 ? (
                    expensesByCurrency.map(({ currency, amount }) => (
                      <Text key={currency} className='text-display-medium text-primary'>
                        {formatCurrencyDisplay(amount, currency)}
                      </Text>
                    ))
                  ) : (
                    <Text className='text-display-medium text-muted-foreground'>USD 0.00</Text>
                  )}
                  <Text className='text-label text-muted-foreground'>({expenses.length}개)</Text>
                </View>
              </View>

              {/* Separator */}
              <Separator className='my-2xs' />

              {/* Action Buttons */}
              <View className='flex-row gap-xs'>
                <Pressable
                  variant='outline'
                  onPress={handleShowOnMap}
                  className='flex-1 flex-row items-center justify-center gap-2xs rounded-md border border-input bg-background px-sm py-xs active:bg-muted'
                >
                  <MapPin size={16} color='hsl(0, 0%, 12%)' strokeWidth={2} />
                  <Text className='text-body text-foreground'>지도에서 보기</Text>
                </Pressable>

                <Pressable
                  onPress={handleAddExpense}
                  className='flex-1 flex-row items-center justify-center gap-2xs rounded-md bg-primary px-sm py-xs active:opacity-90'
                >
                  <Wallet size={16} color='hsl(120, 61%, 98%)' strokeWidth={2} />
                  <Text className='text-body text-primary-foreground'>경비 추가</Text>
                </Pressable>
              </View>
            </Card>

            {/* Expense List Section */}
            <View className='gap-xs'>
              <View className='flex-row items-center justify-between'>
                <Text className='text-title-large text-foreground'>경비 내역</Text>
                <View className='rounded-full bg-muted px-xs py-3xs'>
                  <Text className='text-label text-foreground'>{expenses.length}개</Text>
                </View>
              </View>

              <ScheduleExpenseList expenses={expenses} onExpensePress={handleExpensePress} />
            </View>
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
