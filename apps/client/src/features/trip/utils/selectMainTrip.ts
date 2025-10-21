import { TripData } from '../api';

/**
 * 메인 여행 선택 로직
 * 1. 진행 중인 여행 (오늘이 여행 기간 안에 포함)
 * 2. 가장 가까운 미래 여행
 * 3. 가장 최근 과거 여행
 * 4. 날짜가 없는 여행만 있으면 첫 번째 여행
 */
export const selectMainTrip = (trips: TripData[]): TripData | null => {
  if (!trips || trips.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. 진행 중인 여행 찾기
  const ongoingTrips = trips.filter((trip) => {
    if (!trip.startDate || !trip.endDate) return false;
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    return startDate <= today && endDate >= today;
  });

  if (ongoingTrips.length > 0) {
    // 진행 중인 여행이 여러 개면 시작일이 가장 빠른 것
    return ongoingTrips.sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())[0];
  }

  // 2. 가장 가까운 미래 여행 찾기
  const futureTrips = trips.filter((trip) => {
    if (!trip.startDate) return false;
    return new Date(trip.startDate) > today;
  });

  if (futureTrips.length > 0) {
    return futureTrips.sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())[0];
  }

  // 3. 가장 최근 과거 여행 찾기
  const pastTrips = trips.filter((trip) => {
    if (!trip.endDate) return false;
    return new Date(trip.endDate) < today;
  });

  if (pastTrips.length > 0) {
    return pastTrips.sort((a, b) => new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime())[0];
  }

  // 4. 날짜가 없는 여행만 있으면 첫 번째 여행
  const noDateTrips = trips.filter((trip) => !trip.startDate && !trip.endDate);
  if (noDateTrips.length > 0) {
    return noDateTrips[0];
  }

  return null;
};
