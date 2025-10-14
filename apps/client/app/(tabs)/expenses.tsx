import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Container, Stack, ExpenseCard } from '@/shared/components';

type TabType = 'all' | 'schedule' | 'unlinked';

export default function ExpensesScreen() {
  const [selectedTab, setSelectedTab] = useState<TabType>('all');

  // TODO: Replace with real data
  const expenses = [
    {
      id: '1',
      date: '3월 15일',
      items: [
        {
          title: '에펠탑 입장권',
          amount: '26.00',
          currency: 'EUR',
          category: '관광',
          schedule: '에펠탑 방문',
          hasReceipt: true,
          isSynced: true,
          icon: '🎫',
        },
        {
          title: '기념품',
          amount: '15.50',
          currency: 'EUR',
          category: '쇼핑',
          schedule: '에펠탑 방문',
          hasReceipt: false,
          isSynced: true,
          icon: '🎁',
        },
        {
          title: '택시',
          amount: '18.00',
          currency: 'EUR',
          category: '교통',
          schedule: undefined,
          hasReceipt: false,
          isSynced: true,
          icon: '🚕',
        },
      ],
    },
    {
      id: '2',
      date: '3월 16일',
      items: [
        {
          title: '루브르 입장권',
          amount: '17.00',
          currency: 'EUR',
          category: '관광',
          schedule: '루브르 박물관',
          hasReceipt: true,
          isSynced: true,
          icon: '🎫',
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
          <Text className='text-body'>📷</Text>
        </Pressable>
      </View>

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {/* Total Expense Card */}
            <View className='rounded-lg bg-muted p-sm'>
              <Text className='text-label text-muted-foreground'>💰 총 경비</Text>
              <Text className='text-display-medium text-primary'>EUR 156.50</Text>
            </View>

            {/* Tabs */}
            <View className='flex-row gap-2xs rounded-md bg-muted p-3xs'>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  className={`flex-1 items-center rounded-md py-2xs ${
                    selectedTab === tab.key ? 'bg-primary' : 'bg-transparent'
                  }`}
                  onPress={() => setSelectedTab(tab.key)}
                >
                  <Text
                    className={`text-body ${selectedTab === tab.key ? 'text-primary-foreground' : 'text-foreground'}`}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Expense List */}
            {expenses.map((group) => (
              <View key={group.id} className='flex-col gap-sm'>
                <Text className='text-title-medium text-foreground'>📅 {group.date}</Text>
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
        <Text className='text-display-medium text-primary-foreground'>+</Text>
      </Pressable>
    </View>
  );
}
