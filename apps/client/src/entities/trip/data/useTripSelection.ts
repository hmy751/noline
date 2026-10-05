import { useEffect } from 'react';
import { useTripStore } from '@/shared/store/useTripStore';
import { networkStore } from '@/shared/store/network';
import { useGetTrips } from './useGetTrips';
import { selectMainTrip } from '../utils';

/** 사용자 선택을 유지하며, 선택이 없거나 서버 목록에서 제거된 경우에만 기본 여행을 선택한다. */
export function useTripSelection() {
  const { selectedTripId, setSelectedTripId } = useTripStore();
  const { data: trips, dataSource, isSuccess, isFetching } = useGetTrips();

  useEffect(() => {
    if (!isSuccess || isFetching || !trips) {
      return;
    }

    if (selectedTripId !== null) {
      if (trips.some((trip) => trip.id === selectedTripId)) {
        return;
      }

      // 로컬 목록이나 연결이 끊긴 동안 남은 캐시만으로 삭제를 판정하지 않는다.
      if ((dataSource !== 'remote' && dataSource !== 'mixed') || networkStore.realStatus !== 'online') {
        return;
      }
    }

    const nextTripId = (selectMainTrip(trips) ?? trips[0])?.id ?? null;
    if (nextTripId !== selectedTripId) {
      setSelectedTripId(nextTripId);
    }
  }, [trips, dataSource, isSuccess, isFetching, selectedTripId, setSelectedTripId]);
}
