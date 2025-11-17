import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Container, Stack, ScheduleCard, MobileHeader } from '@/shared/components';
import { Pressable } from '@repo/ui';
import { ChevronRight, Plus, MoreVertical, Edit3 } from 'lucide-react-native';
import {
  useGetTrips,
  selectMainTrip,
  useDeleteTrip,
  TripCard,
  type TripData,
  useActivateTrip,
  ActivationProgressDrawer,
  type ProgressItem,
  type ActivationStatus,
} from '@/entities/trip';
import { useGetAllExpenses } from '@/entities/expense';
import { groupExpensesByCurrency } from '@/shared/lib/currency';
import { EditTripDrawer, TripMenu } from '@/features/trip/update-trip';
import { useState, useMemo, useCallback, useEffect } from 'react';
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

  // 활성화 관련 상태
  const [isActivationProgressOpen, setIsActivationProgressOpen] = useState(false);
  const [activationProgress, setActivationProgress] = useState<ProgressItem[]>([]);
  const [activatingTripName, setActivatingTripName] = useState('');

  const { mutate: deleteTrip } = useDeleteTrip();
  const { mutate: activateTrip } = useActivateTrip();

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 메인 여행 선택
  const mainTripData = selectMainTrip(allTrips || []);

  // ✅ CURRENCY_POLICY: 메인 여행의 경비 조회
  const { data: mainTripExpenses = [] } = useGetAllExpenses(mainTripData?.id ? { tripId: mainTripData.id } : undefined);

  // ✅ CURRENCY_POLICY: 통화별 경비 그룹핑 (금액 기준 내림차순)
  const expensesByCurrency = useMemo(() => groupExpensesByCurrency(mainTripExpenses), [mainTripExpenses]);

  // 메인 여행 데이터 변환
  const mainTrip = mainTripData
    ? {
        destination: mainTripData.destination,
        country: mainTripData.country || '',
        startDate: formatDate(mainTripData.startDate),
        endDate: formatDate(mainTripData.endDate),
        scheduleCount: 0, // TODO: 일정 개수 집계 API 추가 필요
        expensesByCurrency, // ✅ 통화별 경비 데이터 전달
      }
    : null;

  // 다른 여행들 (메인 여행 제외)
  const otherTrips = (allTrips || []).filter((trip) => trip.id !== mainTripData?.id);

  // 다른 여행 편집 핸들러
  const handleEditOtherTrip = (trip: TripData) => {
    setEditingOtherTrip(trip);
    setIsEditDrawerOpen(true);
  };

  // 활성화 상태 가져오기
  const getActivationStatus = (trip: TripData | null): ActivationStatus => {
    if (!trip) return 'online';

    // tripActivations에서 확인해야 하지만, 일단 activated 필드로 판단
    if (trip.activated) {
      // mapDownloaded 필드가 있다면 'ready', 없으면 'preparing'
      // 여기서는 단순화를 위해 activated면 ready로 표시
      return 'ready';
    }
    return 'online';
  };

  // 여행 활성화 핸들러
  const handleActivateTrip = useCallback(
    (tripId: string, tripName: string) => {
      Alert.alert(
        '오프라인 준비',
        `"${tripName}" 여행을 오프라인에서 사용할 수 있도록 준비하시겠습니까?\n\n일정, 경비, 오프라인 지도를 다운로드합니다.`,
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '준비하기',
            onPress: () => {
              setActivatingTripName(tripName);

              // 초기 진행 상태 설정
              const initialProgress: ProgressItem[] = [
                { id: 'activate', label: '여행 활성화 중...', status: 'loading' },
                { id: 'schedules', label: '일정 다운로드', status: 'pending' },
                { id: 'expenses', label: '경비 다운로드', status: 'pending' },
                { id: 'map', label: '오프라인 지도 준비', status: 'pending' },
              ];

              setActivationProgress(initialProgress);
              setIsActivationProgressOpen(true);

              // 활성화 실행
              activateTrip(tripId, {
                onSuccess: () => {
                  // 순차적으로 상태 업데이트 시뮬레이션
                  setTimeout(() => {
                    setActivationProgress((prev) =>
                      prev.map((item) => {
                        console.log('🔥', prev);

                        return item.id === 'activate'
                          ? { ...item, status: 'success' as const, label: '여행 활성화 완료!' }
                          : item;
                      }),
                    );
                  }, 500);

                  setTimeout(() => {
                    setActivationProgress((prev) =>
                      prev.map((item) => (item.id === 'schedules' ? { ...item, status: 'loading' as const } : item)),
                    );
                  }, 1000);

                  setTimeout(() => {
                    setActivationProgress((prev) =>
                      prev.map((item) =>
                        item.id === 'schedules'
                          ? { ...item, status: 'success' as const, label: '일정 다운로드 완료!' }
                          : item,
                      ),
                    );
                    setActivationProgress((prev) =>
                      prev.map((item) => (item.id === 'expenses' ? { ...item, status: 'loading' as const } : item)),
                    );
                  }, 2000);

                  setTimeout(() => {
                    setActivationProgress((prev) =>
                      prev.map((item) =>
                        item.id === 'expenses'
                          ? { ...item, status: 'success' as const, label: '경비 다운로드 완료!' }
                          : item,
                      ),
                    );
                    setActivationProgress((prev) =>
                      prev.map((item) => (item.id === 'map' ? { ...item, status: 'loading' as const } : item)),
                    );
                  }, 3000);

                  setTimeout(() => {
                    setActivationProgress((prev) =>
                      prev.map((item) =>
                        item.id === 'map'
                          ? { ...item, status: 'success' as const, label: '오프라인 지도 준비 완료!' }
                          : item,
                      ),
                    );
                  }, 4500);
                },
                onError: (error) => {
                  console.error('활성화 실패:', error);
                  setActivationProgress((prev) =>
                    prev.map((item) => {
                      if (item.status === 'loading') {
                        return { ...item, status: 'error' as const, error: '활성화에 실패했습니다.' };
                      }
                      return item;
                    }),
                  );
                },
              });
            },
          },
        ],
      );
    },
    [activateTrip],
  );

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
            {!isLoading && !isError && mainTrip && mainTripData && (
              <View className='relative'>
                <TripCard
                  {...mainTrip}
                  activationStatus={getActivationStatus(mainTripData)}
                  onActivatePress={
                    mainTripData.activated ? undefined : () => handleActivateTrip(mainTripData.id, mainTrip.destination)
                  }
                />
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
              <Plus size={20} color='#1F1F1F' strokeWidth={2} />
              <Text className='text-body' style={{ color: '#1F1F1F' }}>
                새 여행 추가
              </Text>
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

      {/* Activation Progress Drawer */}
      <ActivationProgressDrawer
        isOpen={isActivationProgressOpen}
        onClose={() => setIsActivationProgressOpen(false)}
        title={`${activatingTripName} 오프라인 준비`}
        items={activationProgress}
      />
    </View>
  );
}
