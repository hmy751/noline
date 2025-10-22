import axios from '@/shared/api/fetcher';
import type {
  GetAllTripsResponse,
  CreateTripRequest,
  CreateTripResponse,
  UpdateTripRequest,
  UpdateTripResponse,
  DeleteTripResponse,
} from '../model';

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

/**
 * 여행 정보를 수정합니다.
 * @param id - 여행 ID
 * @param data - 수정할 여행 데이터
 * @returns 수정된 여행 정보
 */
export const fetchUpdateTrip = async (id: number, data: UpdateTripRequest): Promise<UpdateTripResponse> => {
  return axios.patch(`/api/trips/${id}`, data) as Promise<UpdateTripResponse>;
};

/**
 * 여행을 삭제합니다.
 * @param id - 여행 ID
 * @returns 삭제 성공 메시지
 */
export const fetchDeleteTrip = async (id: number): Promise<DeleteTripResponse> => {
  return axios.delete(`/api/trips/${id}`) as Promise<DeleteTripResponse>;
};
