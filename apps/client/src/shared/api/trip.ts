import axios from './fetcher';

// ========================================
// Trip API Types
// ========================================

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
 * 새로운 여행을 생성합니다.
 * @param data - 여행 생성 요청 데이터
 * @returns 생성된 여행 정보
 */
export const fetchCreateTrip = async (data: CreateTripRequest): Promise<CreateTripResponse> => {
  return axios.post('/api/trips', data) as Promise<CreateTripResponse>;
};
