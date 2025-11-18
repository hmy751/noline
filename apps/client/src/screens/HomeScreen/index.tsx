import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Container, Stack, ScheduleCard, MobileHeader } from '@/shared/components';
import { Pressable } from '@repo/ui';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useActivateTrip, ActivationProgressDrawer, type ProgressItem } from '@/entities/trip';
import { TripsSection } from './TripsSection';
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export default function HomeScreen() {
  // 활성화 관련 상태
  const [isActivationProgressOpen, setIsActivationProgressOpen] = useState(false);
  const [activationProgress, setActivationProgress] = useState<ProgressItem[]>([]);
  const [activatingTripName, setActivatingTripName] = useState('');

  const { mutate: activateTrip } = useActivateTrip();

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
            {/* Trips Section (Main + Other) */}
            <TripsSection onActivateTrip={handleActivateTrip} />

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
