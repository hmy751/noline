import { useNetworkStore, type NetworkStatus } from '@/shared/store/network';
import type { OperationPolicy } from './types';
import { SERVICE_POLICIES } from './constants';

/** Public Places는 여행 데이터 소유권과 무관하다. 화면 강제값이 실제 연결을 열지는 않는다. */
export function getPlaceSearchPolicy(): OperationPolicy {
  return selectPlaceSearchPolicy(useNetworkStore.getState());
}

function selectPlaceSearchPolicy({
  realStatus,
  overrideStatus,
  checkStatus,
}: {
  realStatus: NetworkStatus;
  overrideStatus: NetworkStatus | null;
  checkStatus: string;
}): OperationPolicy {
  const displayStatus = overrideStatus ?? realStatus;
  const status = displayStatus === 'online' ? realStatus : displayStatus;
  // Places의 searchMode는 활성/비활성 여행에 동일하다. 지도와 달리 활성 기록이 필요하지 않다.
  const service = SERVICE_POLICIES[status === 'online' ? 'online_inactive' : 'offline_inactive'];
  if (service.searchMode === 'api') return { allowed: true };
  if (status === 'unknown') {
    return checkStatus === 'checking'
      ? { allowed: false, pending: true, reason: '연결을 확인하는 동안 장소 검색을 사용할 수 없어요.' }
      : {
          allowed: false,
          reason: '연결을 확인할 수 없어 장소 검색을 사용할 수 없어요.',
          recoveryAction: 'recheck-network',
        };
  }
  return { allowed: false, reason: '오프라인에서는 장소를 검색할 수 없어요. 직접 입력할 수 있습니다.' };
}

export function usePlaceSearchPolicy(): OperationPolicy {
  const realStatus = useNetworkStore((state) => state.realStatus);
  const overrideStatus = useNetworkStore((state) => state.overrideStatus);
  const checkStatus = useNetworkStore((state) => state.checkStatus);
  return selectPlaceSearchPolicy({ realStatus, overrideStatus, checkStatus });
}
