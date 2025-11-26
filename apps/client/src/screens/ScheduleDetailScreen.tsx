import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MapPin, Clock, Wallet, ChevronLeft } from 'lucide-react-native';
import { Card, Pressable, Separator } from '@repo/ui';
import { Container, Stack, MobileHeader } from '@/shared/components';
import { ScheduleExpenseList } from '@/features/schedule/schedule-expense-list';
import { formatISOToLocalDate, formatISOToLocalTime } from '@/shared/lib/datetime';
import { useRouter } from 'expo-router';
import { useGetScheduleById } from '@/entities/schedule/data';
import { useGetScheduleExpenses, type Expense } from '@/entities/expense';

export interface ScheduleDetailScreenProps {
  scheduleId: string;
  tripId: string;
  scheduledAt: string; // ISO datetime string
  onBack: () => void;
}

export default function ScheduleDetailScreen({ scheduleId, tripId, scheduledAt, onBack }: ScheduleDetailScreenProps) {
  const router = useRouter();

  // ✅ 로컬 DB에서 일정 상세 정보 조회
  const { data: schedule, isLoading: isLoadingSchedule } = useGetScheduleById(scheduleId, tripId);

  // ✅ 일정의 경비 목록 조회 (라우팅 레이어 적용)
  const { data: expenses = [], isLoading: isLoadingExpenses } = useGetScheduleExpenses(scheduleId);

  // ✅ 총 경비 계산
  const totalExpense = expenses.reduce((sum: number, expense: Expense) => {
    return sum + parseFloat(expense.amount || '0');
  }, 0);

  const isLoading = isLoadingSchedule || isLoadingExpenses;

  const handleExpensePress = (expenseId: string) => {
    // ✅ 경비 상세 화면으로 이동
    router.push(`/expense-detail/${expenseId}`);
  };

  /**
   * 일정에 경비 추가
   * - 일정의 날짜를 자동으로 경비 날짜로 설정
   * - tripId, scheduleId를 함께 전달
   */
  const handleAddExpense = () => {
    // ✅ scheduledAt (ISO datetime)에서 날짜 부분만 추출 (YYYY-MM-DD)
    const expenseDate = formatISOToLocalDate(scheduledAt);

    router.push(`/create-expense?tripId=${tripId}&scheduleId=${scheduleId}&date=${expenseDate}`);
  };

  const handleShowOnMap = () => {
    // TODO: 지도 화면으로 이동
    console.log('Show on map:', scheduleId);
  };

  // ✅ 로딩 중일 때
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

  // ✅ 일정을 찾을 수 없을 때
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

  // ✅ scheduledAt에서 날짜와 시간 추출
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

              {/* Total Expense */}
              <View className='flex-row items-center justify-between py-3xs'>
                <View className='flex-row items-center gap-xs'>
                  <Wallet size={16} color='hsl(120, 61%, 34%)' strokeWidth={2} />
                  <Text className='text-label text-muted-foreground'>총 경비</Text>
                </View>
                <View className='flex-row items-center gap-2xs'>
                  <Text className='text-display-medium text-primary'>EUR {totalExpense.toFixed(2)}</Text>
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
