import { useMemo } from 'react';
import { useAuthStore, hasLocalSession } from '@/shared/store/auth';
import { useDisplayNetworkStatus } from '@/shared/store/network';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import { EXPENSE_POLICIES, SCHEDULE_POLICIES, SERVICE_POLICIES } from './constants';
import type {
  ActivationStatus,
  EntityPolicy,
  EntityPolicyTable,
  OperationPolicy,
  PolicyKey,
  ServicePolicy,
} from './types';

/** 현재 앱 상태에 맞게 선택된 Schedule·Expense·Service 정책이다. */
export interface AppPolicy {
  schedule: EntityPolicy;
  expense: EntityPolicy;
  service: ServicePolicy;
}

export function useAppPolicy(tripId?: string): AppPolicy {
  const displayNetworkStatus = useDisplayNetworkStatus();
  const authStatus = useAuthStore((state) => state.status);
  const { data: activation } = useGetTripActivation(tripId ?? '');

  const isTripActivated = activation?.isActivated ?? false;
  const activationStatus: ActivationStatus = tripId && isTripActivated ? 'active' : 'inactive';

  // unknown도 Remote 기능을 열지 않도록 offline 정책을 사용한다.
  const policyNetworkStatus = displayNetworkStatus === 'online' ? 'online' : 'offline';
  const policyKey: PolicyKey = `${policyNetworkStatus}_${activationStatus}`;

  return useMemo(() => {
    const needsReauthentication = authStatus === 'reauth-required';
    const isDataAccessBlockedByAuth =
      !hasLocalSession({ status: authStatus }) || (needsReauthentication && !isTripActivated);

    if (isDataAccessBlockedByAuth) {
      const authRequiredPolicy: OperationPolicy = {
        allowed: false,
        reason: '다시 로그인한 뒤 사용할 수 있습니다',
      };
      const blockedEntityPolicy: EntityPolicy = {
        create: authRequiredPolicy,
        read: authRequiredPolicy,
        update: authRequiredPolicy,
        delete: authRequiredPolicy,
      };

      return {
        schedule: blockedEntityPolicy,
        expense: blockedEntityPolicy,
        service: SERVICE_POLICIES[policyKey],
      };
    }

    return {
      schedule: selectEntityPolicy(SCHEDULE_POLICIES, policyKey),
      expense: selectEntityPolicy(EXPENSE_POLICIES, policyKey),
      service: SERVICE_POLICIES[policyKey],
    };
  }, [policyKey, authStatus, isTripActivated]);
}

function selectEntityPolicy(policyTable: EntityPolicyTable, policyKey: PolicyKey): EntityPolicy {
  return {
    create: policyTable.create[policyKey],
    read: policyTable.read[policyKey],
    update: policyTable.update[policyKey],
    delete: policyTable.delete[policyKey],
  };
}
