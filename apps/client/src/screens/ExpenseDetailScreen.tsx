import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Container, Stack, MobileHeader } from '@/shared/components';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetExpenses } from '@/entities/expense';
import { useGetSchedules } from '@/entities/schedule';
import { MapPin, Tag, Calendar, Receipt, ChevronLeft } from 'lucide-react-native';
import { Badge } from '@repo/ui';
import { formatISOToLocalDate } from '@/shared/lib/datetime';

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // 경비 데이터 조회
  const { data: expenses = [], isLoading } = useGetExpenses();
  const expense = expenses.find((e) => e.id === id);

  // 연결된 일정 조회 (scheduleId가 있는 경우)
  const { data: schedules = [] } = useGetSchedules(expense?.tripId || '');
  const linkedSchedule = expense?.scheduleId ? schedules.find((s) => s.id === expense.scheduleId) : null;

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

  if (isLoading) {
    return (
      <View className='flex-1 bg-background'>
        <MobileHeader
          title='경비 상세'
          leftIcon={<ChevronLeft size={24} color='hsl(0, 0%, 12%)' />}
          onLeftPress={() => router.back()}
        />
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='hsl(120, 61%, 34%)' />
        </View>
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
                <View className='rounded-lg border border-card-border bg-muted/30 p-md'>
                  <View className='flex-col gap-2xs'>
                    <Text className='text-title-medium text-foreground'>{linkedSchedule.title}</Text>
                    <View className='flex-row items-center gap-2xs'>
                      <MapPin size={14} color='hsl(120, 8%, 35%)' strokeWidth={2} />
                      <Text className='text-body text-muted-foreground'>{linkedSchedule.location}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
