import { create } from 'zustand';

interface TripStore {
  selectedTripId: string | null;
  setSelectedTripId: (tripId: string | null) => void;
}

/**
 * 전역 여행 선택 상태 관리 Store
 *
 * - 현재 선택된 여행 ID 저장
 * - TripSelector와 연동
 * - 기본값은 메인 여행 (TripSelector에서 자동 설정)
 *
 * @example
 * ```tsx
 * const { selectedTripId, setSelectedTripId } = useTripStore();
 *
 * // 여행 선택
 * setSelectedTripId('trip-id');
 *
 * // 현재 선택된 여행 사용
 * router.push(`/create-expense?tripId=${selectedTripId}`);
 * ```
 */
export const useTripStore = create<TripStore>((set) => ({
  selectedTripId: null,
  setSelectedTripId: (tripId) => set({ selectedTripId: tripId }),
}));
