import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tripQueryKeys } from '@/entities/trip/data/keys';
import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';
import { useNetworkStore } from '@/shared/store/network';
import { useAuthStore } from '@/shared/store/auth';

/** 로그인한 앱에서 한 번 연결한다. 실행 조건 변화만 알리고 조회 경로는 Router에 맡긴다. */
export function useTripListRefresh() {
  const client = useQueryClient();

  useEffect(() => {
    const refresh = () => cancelAndInvalidateQueries(client, { queryKey: tripQueryKeys.all() });
    const unsubscribeNetwork = useNetworkStore.subscribe((state, previous) => {
      if (state.realStatus !== previous.realStatus) refresh();
    });
    const unsubscribeAuth = useAuthStore.subscribe((state, previous) => {
      if (state.status !== previous.status) refresh();
    });

    return () => {
      unsubscribeNetwork();
      unsubscribeAuth();
    };
  }, [client]);
}
