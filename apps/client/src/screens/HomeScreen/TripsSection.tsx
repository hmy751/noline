import { type TripData, selectMainTrip, useGetTrips, useDeleteTrip } from '@/entities/trip';
import { EditTripDrawer, TripMenu } from '@/features/trip/update-trip';
import { MainTripSection } from './MainTripSection';
import { OtherTripsSection } from './OtherTripsSection';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface TripsSectionProps {
  onActivateTrip: (tripId: string, tripName: string) => void;
  onMainTripDataChange?: (mainTrip: TripData | null) => void;
}

export function TripsSection({ onActivateTrip, onMainTripDataChange }: TripsSectionProps) {
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

  const { mutate: deleteTrip } = useDeleteTrip();

  // entities/trip의 selectMainTrip 사용 (진행중 → 가까운 미래 → 최근 과거 순)
  const mainTripData = selectMainTrip(allTrips || []);
  const otherTrips = (allTrips || []).filter((trip: TripData) => trip.id !== mainTripData?.id);

  // mainTripData가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    if (onMainTripDataChange) {
      onMainTripDataChange(mainTripData);
    }
  }, [mainTripData, onMainTripDataChange]);

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
        onActivatePress={onActivateTrip}
      />

      {/* Other Trips Section */}
      <OtherTripsSection
        trips={otherTrips}
        isLoading={isLoading}
        isError={isError}
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
        buttonPosition={buttonPosition}
      />
    </>
  );
}
