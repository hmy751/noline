import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Container, Stack, ScheduleCard, MobileHeader } from '@/shared/components';
import { Pressable } from '@repo/ui';
import { ChevronRight, Plus, MoreVertical, Edit3 } from 'lucide-react-native';
import { useGetTrips, selectMainTrip, useDeleteTrip, TripCard, type TripData } from '@/entities/trip';
import { EditTripDrawer, TripMenu } from '@/features/trip/update-trip';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function HomeScreen() {
  const { data: allTrips, isLoading, isError } = useGetTrips();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);
  const [isTripMenuOpen, setIsTripMenuOpen] = useState(false);
  const [editingOtherTrip, setEditingOtherTrip] = useState<TripData | null>(null);
  const [buttonPosition, setButtonPosition] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);

  const { mutate: deleteTrip } = useDeleteTrip();

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

  // 다른 여행 편집 핸들러
  const handleEditOtherTrip = (trip: TripData) => {
    setEditingOtherTrip(trip);
    setIsEditDrawerOpen(true);
  };

  // 다른 여행 삭제 핸들러
  const handleDeleteOtherTrip = (trip: TripData) => {
    Alert.alert('여행 삭제', `"${trip.name}" 여행을 삭제하시겠습니까?\n모든 일정과 경비도 함께 삭제됩니다.`, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deleteTrip(trip.id, {
            onSuccess: () => {
              Alert.alert('성공', '여행이 삭제되었습니다.');
            },
            onError: () => {
              Alert.alert('오류', '여행 삭제에 실패했습니다.');
            },
          });
        },
      },
    ]);
  };

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
                  className='absolute right-sm top-sm rounded-full p-2xs'
                  onPress={() => {
                    setEditingOtherTrip(null); // 메인 여행 편집 시 다른 여행 초기화
                    setIsEditDrawerOpen(true);
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
                  <View
                    key={trip.id}
                    className='flex-row items-center justify-between rounded-lg bg-card p-md border border-card-border'
                  >
                    <View className='flex-1'>
                      <Text className='text-body font-semibold text-foreground'>
                        {trip.destination}, {trip.country}
                      </Text>
                      <Text className='text-label text-muted-foreground'>
                        {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                      </Text>
                    </View>
                    <Pressable
                      variant='ghost'
                      className='rounded-full p-2xs'
                      onPress={(event) => {
                        setSelectedTrip(trip);
                        // 버튼 위치 측정
                        event.currentTarget.measure((x, y, width, height, pageX, pageY) => {
                          setButtonPosition({ x: pageX, y: pageY, width, height });
                        });
                        setIsTripMenuOpen(true);
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

      {/* Edit Trip Drawer */}
      <EditTripDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => {
          setIsEditDrawerOpen(false);
          setEditingOtherTrip(null);
        }}
        trip={editingOtherTrip ? editingOtherTrip : mainTripData}
      />

      {/* Trip Menu for Other Trips */}
      <TripMenu
        isOpen={isTripMenuOpen}
        onClose={() => {
          setIsTripMenuOpen(false);
          setSelectedTrip(null);
          setButtonPosition(undefined);
        }}
        onEdit={() => selectedTrip && handleEditOtherTrip(selectedTrip)}
        onDelete={() => selectedTrip && handleDeleteOtherTrip(selectedTrip)}
        buttonPosition={buttonPosition}
      />
    </View>
  );
}
