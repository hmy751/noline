import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDeleteTrip } from '../api';
import { tripQueryKeys } from './useGetTrips';

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetchDeleteTrip(id);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('Failed to delete trip:', error);
    },
  });
};
