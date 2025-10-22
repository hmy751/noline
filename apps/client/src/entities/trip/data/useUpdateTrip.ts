import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUpdateTrip } from '../api';
import type { UpdateTripRequest } from '../model';
import { tripQueryKeys } from './useGetTrips';

export const useUpdateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTripRequest }) => {
      const response = await fetchUpdateTrip(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('Failed to update trip:', error);
    },
  });
};
