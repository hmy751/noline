import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Container, Stack, ExpenseCard } from '@/shared/components';
import { Camera, Plus } from 'lucide-react-native';

type TabType = 'all' | 'schedule' | 'unlinked';

export default function ExpensesScreen() {
  const [selectedTab, setSelectedTab] = useState<TabType>('all');

  // TODO: Replace with real data
  const expenses = [
    {
      id: '1',
      date: undefined,
      items: [
        {
          title: '에펠탑 입장권',
          amount: '26.00',
          currency: 'EUR',
          category: '관광',
          location: '에펠탑 방문 · 파리',
          date: '3월 15일',
          hasReceipt: true,
          isPending: false,
        },
        {
          title: '기념품',
          amount: '15.50',
          currency: 'EUR',
          category: '쇼핑',
          location: '에펠탑 방문 · 파리',
          date: '3월 15일',
          hasReceipt: false,
          isPending: false,
        },
        {
          title: '루브르 입장권',
          amount: '17.00',
          currency: 'EUR',
          category: '관광',
          location: '루브르 박물관 · 파리',
          date: '3월 16일',
          hasReceipt: true,
          isPending: false,
        },
        {
          title: '택시',
          amount: '18.00',
          currency: 'EUR',
          category: '교통',
          location: undefined,
          date: '3월 15일',
          hasReceipt: false,
          isPending: true,
        },
      ],
    },
  ];

  const tabs = [
    { key: 'all' as const, label: '전체' },
    { key: 'schedule' as const, label: '일정별' },
    { key: 'unlinked' as const, label: '미연결' },
  ];

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <View className='h-14 flex-row items-center justify-between border-b border-card-border bg-background px-sm'>
        <Text className='text-title-large text-foreground'>경비</Text>
        <Pressable
          className='h-10 w-10 items-center justify-center'
          onPress={() => {
            // TODO: Open camera
            console.log('Open camera');
          }}
        >
          <Camera size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {/* Total Expense Card */}
            <View className='flex-col gap-3xs'>
              <Text className='text-label text-muted-foreground'>총 경비</Text>
              <Text className='text-display-large text-primary'>EUR 76.50</Text>
            </View>

            {/* Tabs */}
            <View className='flex-row gap-2xs rounded-lg bg-card p-3xs'>
              {tabs.map((tab, index) => (
                <Pressable
                  key={tab.key}
                  className={`flex-1 items-center rounded-md py-xs ${
                    selectedTab === tab.key ? 'bg-background' : 'bg-transparent'
                  }`}
                  onPress={() => setSelectedTab(tab.key)}
                >
                  <Text
                    className={`text-body ${selectedTab === tab.key ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {tab.label} ({index === 0 ? '4' : index === 1 ? '3' : '1'})
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Expense List */}
            {expenses.map((group) => (
              <View key={group.id} className='flex-col gap-sm'>
                {group.items.map((expense, index) => (
                  <ExpenseCard
                    key={`${group.id}-${index}`}
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

      {/* FAB (Floating Action Button) */}
      <Pressable
        className='absolute bottom-20 right-4 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg'
        onPress={() => {
          // TODO: Open add expense drawer
          console.log('Open add expense drawer');
        }}
      >
        <Plus size={28} color='hsl(120, 61%, 98%)' strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
