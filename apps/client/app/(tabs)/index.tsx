import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Container, Stack, TripCard, ScheduleCard, MobileHeader } from '@/shared/components';
import { Pressable } from '@repo/ui';
import { ChevronRight, Plus, MoreVertical, Edit3 } from 'lucide-react-native';
import { useGetTrips } from '@/features/trip/current';
import { selectMainTrip } from '@/features/trip/utils/selectMainTrip';

export default function HomeScreen() {
  const { data: allTrips, isLoading, isError } = useGetTrips();

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 메인 여행 선택
  const mainTripData = selectMainTrip(allTrips || []);

  // 메인 여행 데이터 변환
  const mainTrip = mainTripData
    ? {
        destination: mainTripData.destination,
        country: mainTripData.country || '',
        startDate: formatDate(mainTripData.startDate),
        endDate: formatDate(mainTripData.endDate),
        scheduleCount: 0, // TODO: 일정 개수 집계 API 추가 필요
        totalExpense: '0.00', // TODO: 경비 합계 API 추가 필요
        currency: 'EUR',
      }
    : null;

  // 다른 여행들 (메인 여행 제외)
  const otherTrips = (allTrips || []).filter((trip) => trip.id !== mainTripData?.id);

  const upcomingSchedules = [
    {
      time: '14:00',
      title: '에펠탑 방문',
      location: '파리, 프랑스',
      date: '3월 15일',
      expense: '41.50',
      expenseCount: 2,
    },
    {
      time: '10:00',
      title: '루브르 박물관',
      location: '파리, 프랑스',
      date: '3월 16일',
      expense: '17.00',
      expenseCount: 1,
    },
  ];

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader title='Noline' />

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {/* Main Trip Card */}
            {isLoading && (
              <View className='flex-row items-center justify-center rounded-xl bg-card p-lg'>
                <ActivityIndicator size='large' color='#228B22' />
              </View>
            )}
            {isError && (
              <View className='rounded-xl bg-card p-md'>
                <Text className='text-body text-muted-foreground text-center'>여행 정보를 불러올 수 없습니다.</Text>
              </View>
            )}
            {!isLoading && !isError && mainTrip && (
              <View className='relative'>
                <TripCard {...mainTrip} />
                {/* Edit Button */}
                <Pressable
                  className='absolute right-md top-md rounded-full bg-white/20 p-2xs'
                  onPress={() => {
                    // TODO: 메인 여행 편집 모달 열기
                    console.log('Edit main trip');
                  }}
                >
                  <Edit3 size={16} color='white' strokeWidth={2} />
                </Pressable>
              </View>
            )}
            {!isLoading && !isError && !mainTrip && (
              <View className='rounded-xl bg-card p-md'>
                <Text className='text-body text-muted-foreground text-center'>아직 생성된 여행이 없습니다.</Text>
              </View>
            )}

            {/* Other Trips Section */}
            {!isLoading && !isError && otherTrips.length > 0 && (
              <View className='flex-col gap-sm'>
                <Text className='text-title-large text-foreground'>다른 여행</Text>
                {otherTrips.map((trip) => (
                  <View key={trip.id} className='flex-row items-center justify-between rounded-lg bg-card p-md'>
                    <View className='flex-1'>
                      <Text className='text-body font-semibold text-foreground'>
                        {trip.destination}, {trip.country}
                      </Text>
                      <Text className='text-label text-muted-foreground'>
                        {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                      </Text>
                    </View>
                    <Pressable
                      className='rounded-full p-2xs'
                      onPress={() => {
                        // TODO: 다른 여행 드롭다운 메뉴 열기
                        console.log('Open trip menu for:', trip.id);
                      }}
                    >
                      <MoreVertical size={20} color='#666' strokeWidth={2} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Add New Trip Button */}
            <Pressable
              variant='outline'
              className='flex-row items-center justify-center gap-2xs rounded-lg border border-card-border bg-card py-md active:bg-muted'
              onPress={() => {
                router.push('/create-trip');
              }}
            >
              <Plus size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />
              <Text className='text-body text-foreground'>새 여행 추가</Text>
            </Pressable>

            {/* Upcoming Schedule Section */}
            <View className='flex-col gap-sm'>
              <View className='flex-row items-center justify-between'>
                <Text className='text-title-large text-foreground'>다가오는 일정</Text>
                <Pressable variant='ghost' className='flex-row items-center gap-3xs'>
                  <Text className='text-body text-primary'>전체보기</Text>
                  <ChevronRight size={16} color='hsl(120, 61%, 34%)' strokeWidth={2} />
                </Pressable>
              </View>

              {upcomingSchedules.map((schedule, index) => (
                <ScheduleCard
                  key={index}
                  {...schedule}
                  onPress={() => {
                    // TODO: Navigate to schedule detail
                    console.log('Navigate to schedule detail');
                  }}
                />
              ))}
            </View>
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
