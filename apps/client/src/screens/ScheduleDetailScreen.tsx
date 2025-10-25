import { View, Text, ScrollView } from 'react-native';
import { MapPin, Clock, Wallet, ChevronLeft } from 'lucide-react-native';
import { Card, Pressable, Separator } from '@repo/ui';
import { Container, Stack, MobileHeader } from '@/shared/components';
import { ScheduleExpenseList } from '@/features/schedule/schedule-expense-list';
import type { Expense } from '@/entities/expense';

export interface ScheduleDetailScreenProps {
  scheduleId: string;
  onBack: () => void;
}

// TODO: API 연동 시 useGetScheduleById, useGetExpensesByScheduleId 등으로 대체
const MOCK_SCHEDULE = {
  id: '1',
  title: '에펠탑 방문',
  location: '에펠탑',
  address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
  date: '2025-03-15',
  time: '09:00',
  totalExpense: '41.50',
  expenseCount: 2,
};

const MOCK_EXPENSES: Expense[] = [
  {
    id: '1',
    userId: 'user-1',
    tripId: 'trip-1',
    scheduleId: 'schedule-1',
    title: '에펠탑 입장권',
    amount: '26.00',
    currency: 'EUR',
    category: '관광',
    date: '2025-03-15',
    hasReceipt: true,
    receiptUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user-1',
    tripId: 'trip-1',
    scheduleId: 'schedule-1',
    title: '기념품',
    amount: '15.50',
    currency: 'EUR',
    category: '쇼핑',
    date: '2025-03-15',
    hasReceipt: false,
    receiptUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function ScheduleDetailScreen({ scheduleId, onBack }: ScheduleDetailScreenProps) {
  // TODO: API 연동
  // const { data: schedule } = useGetScheduleById(scheduleId);
  // const { data: expenses = [] } = useGetExpensesByScheduleId(scheduleId);

  const schedule = MOCK_SCHEDULE;
  const expenses = MOCK_EXPENSES;

  const handleExpensePress = (expenseId: string) => {
    // TODO: 경비 상세 화면으로 이동
    console.log('Expense pressed:', expenseId);
  };

  const handleAddExpense = () => {
    // TODO: 경비 추가 화면으로 이동
    console.log('Add expense for schedule:', scheduleId);
  };

  const handleShowOnMap = () => {
    // TODO: 지도 화면으로 이동
    console.log('Show on map:', scheduleId);
  };

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
                  <Text className='text-label text-muted-foreground'>{schedule.address}</Text>
                </View>
              </View>

              {/* Date & Time */}
              <View className='flex-row items-center gap-xs'>
                <Clock size={16} color='hsl(120, 8%, 35%)' strokeWidth={2} />
                <View className='flex-row items-center gap-2xs'>
                  <View className='rounded bg-muted px-xs py-3xs'>
                    <Text className='text-label text-foreground'>{schedule.date}</Text>
                  </View>
                  <View className='rounded bg-muted px-xs py-3xs'>
                    <Text className='text-label text-foreground'>{schedule.time}</Text>
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
                  <Text className='text-display-medium text-primary'>EUR {schedule.totalExpense}</Text>
                  <Text className='text-label text-muted-foreground'>({schedule.expenseCount}개)</Text>
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
