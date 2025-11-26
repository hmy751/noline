import {
  type TripData,
  selectMainTrip,
  useGetTrips,
  useDeleteTrip,
  useActivateTrip,
  ActivationProgressDrawer,
  type ProgressItem,
} from '@/entities/trip';
import { EditTripDrawer, TripMenu } from '@/features/trip/update-trip';
import { MainTripSection } from './MainTripSection';
import { OtherTripsSection } from './OtherTripsSection';
import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { getTripActivationStatusDetail } from '@/shared/services/offline-prep/metadata';
import { useDeactivateTrip } from '@/entities/trip/data/useDeactivateTrip';

interface TripsSectionProps {
  onMainTripDataChange?: (mainTrip: TripData | null) => void;
}

export function TripsSection({ onMainTripDataChange }: TripsSectionProps) {
  // 여행 데이터 조회
  const { data: allTrips, isLoading, isError } = useGetTrips();

  // Drawer 및 Menu 상태 관리
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingOtherTrip, setEditingOtherTrip] = useState<TripData | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);
  const [isTripMenuOpen, setIsTripMenuOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);

  // 활성화 상태 관리
  const [activatedTripId, setActivatedTripId] = useState<string | null>(null);

  // 활성화 진행 상태 관리
  const [isActivationProgressOpen, setIsActivationProgressOpen] = useState(false);
  const [activationProgress, setActivationProgress] = useState<ProgressItem[]>([]);
  const [activatingTripName, setActivatingTripName] = useState('');

  const { mutate: deleteTrip } = useDeleteTrip();
  const { mutate: deactivateTrip } = useDeactivateTrip();
  const { mutate: activateTrip } = useActivateTrip();

  // entities/trip의 selectMainTrip 사용 (진행중 → 가까운 미래 → 최근 과거 순)
  const mainTripData = selectMainTrip(allTrips || []);
  const otherTrips = (allTrips || []).filter((trip: TripData) => trip.id !== mainTripData?.id);

  // mainTripData가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    if (onMainTripDataChange) {
      onMainTripDataChange(mainTripData);
    }
  }, [mainTripData, onMainTripDataChange]);

  // 활성화된 여행 확인
  useEffect(() => {
    const checkActivatedTrip = async () => {
      if (!allTrips) return;

      for (const trip of allTrips) {
        const status = await getTripActivationStatusDetail(trip.id);
        if (status === 'ready' || status === 'preparing') {
          setActivatedTripId(trip.id);
          break;
        }
      }
    };

    checkActivatedTrip();
  }, [allTrips]);

  // 선택된 여행이 활성화된 상태인지 확인
  const isSelectedTripActivated = selectedTrip?.id === activatedTripId;

  // 활성화 실행 함수 (공통)
  const proceedWithActivation = useCallback(
    (tripId: string, tripName: string) => {
      setActivatingTripName(tripName);

      // 초기 진행 상태 설정
      const initialProgress: ProgressItem[] = [
        { id: 'activate', label: '여행 활성화 중...', status: 'loading' },
        { id: 'schedules', label: '일정 다운로드', status: 'pending' },
        { id: 'expenses', label: '경비 다운로드', status: 'pending' },
        { id: 'routes', label: '경로 다운로드', status: 'pending' },
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
                item.id === 'schedules' ? { ...item, status: 'success' as const, label: '일정 다운로드 완료!' } : item,
              ),
            );
            setActivationProgress((prev) =>
              prev.map((item) => (item.id === 'expenses' ? { ...item, status: 'loading' as const } : item)),
            );
          }, 2000);

          setTimeout(() => {
            setActivationProgress((prev) =>
              prev.map((item) =>
                item.id === 'expenses' ? { ...item, status: 'success' as const, label: '경비 다운로드 완료!' } : item,
              ),
            );
            setActivationProgress((prev) =>
              prev.map((item) => (item.id === 'routes' ? { ...item, status: 'loading' as const } : item)),
            );
          }, 3000);

          setTimeout(() => {
            setActivationProgress((prev) =>
              prev.map((item) =>
                item.id === 'routes' ? { ...item, status: 'success' as const, label: '경로 다운로드 완료!' } : item,
              ),
            );
            setActivationProgress((prev) =>
              prev.map((item) => (item.id === 'map' ? { ...item, status: 'loading' as const } : item)),
            );
          }, 4000);

          setTimeout(() => {
            setActivationProgress((prev) =>
              prev.map((item) =>
                item.id === 'map' ? { ...item, status: 'success' as const, label: '오프라인 지도 준비 완료!' } : item,
              ),
            );
            // 활성화 완료 후 상태 업데이트
            setActivatedTripId(tripId);
          }, 5500);
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
    [activateTrip],
  );

  // 여행 활성화 핸들러
  const handleActivateTrip = useCallback(
    (tripId: string, tripName: string) => {
      // 이미 활성화된 여행이 있는지 확인
      if (activatedTripId && activatedTripId !== tripId) {
        // 기존 활성화된 여행 찾기
        const activatedTrip = allTrips?.find((t: TripData) => t.id === activatedTripId);
        const activatedTripName = activatedTrip
          ? `${activatedTrip.destination}, ${activatedTrip.country}`
          : '다른 여행';

        Alert.alert(
          '여행 활성화',
          `현재 "${activatedTripName}"이(가) 활성화되어 있습니다.\n\n"${tripName}"을(를) 활성화하면 기존 여행의 오프라인 데이터가 삭제됩니다.\n\n계속하시겠습니까?`,
          [
            {
              text: '취소',
              style: 'cancel',
            },
            {
              text: '활성화',
              style: 'destructive',
              onPress: () => {
                // 기존 여행 비활성화 후 새 여행 활성화
                deactivateTrip(
                  { tripId: activatedTripId },
                  {
                    onSuccess: () => {
                      // 비활성화 성공 후 새 여행 활성화
                      proceedWithActivation(tripId, tripName);
                    },
                    onError: () => {
                      Alert.alert('오류', '기존 여행 비활성화에 실패했습니다.');
                    },
                  },
                );
              },
            },
          ],
        );
        return;
      }

      // 활성화된 여행이 없거나 같은 여행이면 바로 진행
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
              proceedWithActivation(tripId, tripName);
            },
          },
        ],
      );
    },
    [activatedTripId, allTrips, deactivateTrip, proceedWithActivation],
  );

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

  // 다른 여행 활성화 핸들러
  const handleActivateOtherTrip = (trip: TripData) => {
    // 이미 이 여행이 활성화되어 있는지 확인
    if (activatedTripId === trip.id) {
      Alert.alert('알림', '이미 활성화된 여행입니다.', [{ text: '확인', style: 'default' }]);
      return;
    }

    // 활성화 핸들러 호출
    handleActivateTrip(trip.id, trip.destination);
  };

  // 다른 여행 비활성화 핸들러
  const handleDeactivateOtherTrip = (trip: TripData) => {
    Alert.alert('오프라인 해제', `"${trip.name}" 여행의 오프라인 데이터를 삭제하시겠습니까?`, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '해제',
        style: 'destructive',
        onPress: () => {
          deactivateTrip(
            { tripId: trip.id },
            {
              onSuccess: () => {
                setActivatedTripId(null);
                Alert.alert('성공', '오프라인 데이터가 삭제되었습니다.');
              },
              onError: () => {
                Alert.alert('오류', '오프라인 해제에 실패했습니다.');
              },
            },
          );
        },
      },
    ]);
  };

  return (
    <>
      {/* Main Trip Card */}
      <MainTripSection
        mainTripData={mainTripData}
        isLoading={isLoading}
        isError={isError}
        onEditPress={() => {
          setEditingOtherTrip(null); // 메인 여행 편집 시 다른 여행 초기화
          setIsEditDrawerOpen(true);
        }}
        onActivatePress={handleActivateTrip}
      />

      {/* Other Trips Section */}
      <OtherTripsSection
        trips={otherTrips}
        isLoading={isLoading}
        isError={isError}
        activatedTripId={activatedTripId}
        onTripMenuPress={(trip, position) => {
          setSelectedTrip(trip);
          setButtonPosition(position);
          setIsTripMenuOpen(true);
        }}
      />

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
        onActivate={selectedTrip && !isSelectedTripActivated ? () => handleActivateOtherTrip(selectedTrip) : undefined}
        onDeactivate={
          selectedTrip && isSelectedTripActivated ? () => handleDeactivateOtherTrip(selectedTrip) : undefined
        }
        isActivated={isSelectedTripActivated}
        buttonPosition={buttonPosition}
      />

      {/* Activation Progress Drawer */}
      <ActivationProgressDrawer
        isOpen={isActivationProgressOpen}
        onClose={() => setIsActivationProgressOpen(false)}
        title={`${activatingTripName} 오프라인 준비`}
        items={activationProgress}
      />
    </>
  );
}
