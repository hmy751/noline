import { View, Text, ScrollView } from 'react-native';
import { Container, Stack, ExpenseCard, TripSelector, MobileHeader } from '@/shared/components';
import { Pressable } from '@repo/ui';
import { Camera } from 'lucide-react-native';

export default function ExpensesScreen() {
  // TODO: Replace with real data
  const expensesByDate = [
    {
      date: '2025-03-18',
      dateLabel: '2025-03-18',
      items: [
        {
          title: '공항 택시',
          amount: '55.00',
          currency: 'EUR',
          category: '교통',
          date: '2025-03-18',
          hasReceipt: true,
          isPending: false,
        },
        {
          title: '베르사유 입장권',
          amount: '20.00',
          currency: 'EUR',
          category: '관광',
          date: '2025-03-18',
          hasReceipt: true,
          isPending: false,
        },
        {
          title: '왕복 기차표',
          amount: '14.00',
          currency: 'EUR',
          category: '교통',
          date: '2025-03-18',
          hasReceipt: true,
          isPending: false,
        },
      ],
    },
    {
      date: '2025-03-17',
      dateLabel: '2025-03-17',
      items: [
        {
          title: '초상화 그리기',
          amount: '25.00',
          currency: 'EUR',
          category: '체험',
          date: '2025-03-17',
          hasReceipt: false,
          isPending: false,
        },
        {
          title: '돔 입장료',
          amount: '8.00',
          currency: 'EUR',
          category: '관광',
          date: '2025-03-17',
          hasReceipt: true,
          isPending: false,
        },
      ],
    },
  ];

  const totalExpense = expensesByDate.reduce(
    (acc, group) => acc + group.items.reduce((sum, item) => sum + parseFloat(item.amount), 0),
    0,
  );

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader
        title='경비'
        rightAction={
          <Pressable
            variant='ghost'
            className='h-10 w-10 items-center justify-center'
            onPress={() => {
              // TODO: Open camera
              console.log('Open camera');
            }}
            accessibilityRole='button'
            accessibilityLabel='영수증 스캔 카메라 열기'
          >
            <Camera size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />
          </Pressable>
        }
      />

      {/* Current Trip Selector - Sticky */}
      <TripSelector
        onTripChange={(trip) => {
          console.log('Selected trip:', trip);
        }}
        className='border-b border-card-border bg-background px-md py-sm'
      />

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {/* Total Expense Card */}
            <View className='flex-col gap-3xs'>
              <Text className='text-label text-muted-foreground'>총 경비</Text>
              <Text className='text-display-large text-primary'>EUR {totalExpense.toFixed(2)}</Text>
            </View>

            {/* Expense List by Date */}
            {expensesByDate.map((group) => (
              <View key={group.date} className='flex-col gap-sm'>
                {/* Date Header */}
                <View className='flex-row items-center justify-between'>
                  <View className='flex-row items-center gap-2xs'>
                    <Text className='text-title-large text-foreground'>{group.dateLabel}</Text>
                    <View className='rounded-full bg-muted px-xs py-3xs'>
                      <Text className='text-label text-foreground'>{group.items.length}개</Text>
                    </View>
                  </View>
                  <Pressable
                    variant='outline'
                    className='flex-row items-center gap-3xs rounded-md border border-card-border bg-card px-xs py-3xs active:bg-muted'
                    onPress={() => {
                      // TODO: Open add expense for this date
                      console.log('Add expense for', group.date);
                    }}
                  >
                    <Text className='text-label text-foreground'>추가</Text>
                  </Pressable>
                </View>

                {/* Expense Cards */}
                {group.items.map((expense, index) => (
                  <ExpenseCard
                    key={`${group.date}-${index}`}
                    {...expense}
                    onPress={() => {
                      // TODO: Navigate to expense detail
                      console.log('Navigate to expense detail');
                    }}
                  />
                ))}
              </View>
            ))}
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
