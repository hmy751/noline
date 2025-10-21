import axios from '@/shared/api/fetcher';

// ========================================
// Trip API Types
// ========================================

export type TripData = {
  id: number;
  name: string;
  destination: string;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GetAllTripsResponse = {
  success: boolean;
  data: TripData[];
};

export type CreateTripRequest = {
  userId?: number;
  name: string;
  destination: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  cityId?: number;
  startDate: string;
  endDate: string;
};

export type CreateTripResponse = {
  success: boolean;
  data: {
    id: number;
    userId: number | null;
    name: string;
    destination: string;
    country: string | null;
    latitude: string | null;
    longitude: string | null;
    cityId: number | null;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  };
};

// ========================================
// Trip API Functions
// ========================================

/**
 * 전체 여행을 조회합니다.
 * @returns 모든 여행 정보
 */
export const fetchAllTrips = async (): Promise<GetAllTripsResponse> => {
  return axios.get('/api/trips') as Promise<GetAllTripsResponse>;
};

/**
 * 새로운 여행을 생성합니다.
 * @param data - 여행 생성 요청 데이터
 * @returns 생성된 여행 정보
 */
export const fetchCreateTrip = async (data: CreateTripRequest): Promise<CreateTripResponse> => {
  return axios.post('/api/trips', data) as Promise<CreateTripResponse>;
};
