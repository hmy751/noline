import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCreateTrip, type CreateTripRequest } from '../api';
import { tripQueryKeys } from '../current/useGetTrips';
import { useRouter } from 'expo-router';

/**
 * 여행 생성 Custom Hook
 * - API 호출 및 비즈니스 로직 처리
 * - 성공 시 홈 화면으로 이동
 */
export const useCreateTrip = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTripRequest) => {
      const response = await fetchCreateTrip(data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Trip created successfully:', data);
      // 캐시 무효화 - 새 여행이 생성되었으므로 전체 여행 다시 조회
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
      // 성공 시 홈 화면으로 이동
      router.push('/(tabs)');
    },
    onError: (error) => {
      console.error('Failed to create trip:', error);
      // TODO: 에러 토스트 메시지 추가
    },
  });
};
