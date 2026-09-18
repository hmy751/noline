import { create } from 'zustand';

interface TripStore {
  selectedTripId: string | null;
  setSelectedTripId: (tripId: string | null) => void;
}

// 기본 선택과 선택 보존은 여행 기능의 useTripSelection이 담당한다.
export const useTripStore = create<TripStore>((set) => ({
  selectedTripId: null,
  setSelectedTripId: (tripId) => set({ selectedTripId: tripId }),
}));
