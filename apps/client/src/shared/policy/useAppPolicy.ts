/**
 * useAppPolicy Hook
 *
 * 범용 Policy Hook - 모든 Entity의 CRUD 정책을 한 번에 제공
 * 여러 Entity 정책을 동시에 체크해야 할 때 사용
 */

import { useMemo } from 'react';
import { useDisplayNetworkStatus } from '@/shared/store/network';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import { TRIP_POLICIES, SCHEDULE_POLICIES, EXPENSE_POLICIES, SERVICE_POLICIES } from './constants';
import type { CRUDPermission, CRUDOperationPolicies, ServiceConfig, PolicyKey, ActivationStatus } from './types';

interface CRUDPermissions {
  create: CRUDPermission;
  read: CRUDPermission;
  update: CRUDPermission;
  delete: CRUDPermission;
}

/**
 * App Policy Context
 *
 * 모든 Entity의 CRUD 정책 + Service 설정
 */
export interface AppPolicyContext {
  trip: CRUDPermissions;
  schedule: CRUDPermissions;
  expense: CRUDPermissions;
  service: ServiceConfig;
}

/**
 * 앱 전역 Policy Hook
 *
 * @param tripId - Trip ID (optional)
 * @returns 모든 Entity의 CRUD 정책
 *
 * @example
 * ```tsx
 * // 여러 Entity 정책을 동시에 체크
 * const policy = useAppPolicy(tripId);
 *
 * if (!policy.schedule.create.allowed) {
 *   return <DisabledMessage reason={policy.schedule.create.reason} />;
 * }
 *
 * if (policy.expense.create.mode === 'manual-only') {
 *   return <ManualInputForm />;
 * }
 *
 * // Service 설정도 접근 가능
 * if (policy.service.mapProvider === 'mapbox') {
 *   return <OfflineMap />;
 * }
 * ```
 */
export function useAppPolicy(tripId?: string): AppPolicyContext {
  const networkStatus = useDisplayNetworkStatus();

  const { data: activation } = useGetTripActivation(tripId ?? '');

  const isActivated = activation?.isActivated ?? false;
  const activationStatus: ActivationStatus = tripId && isActivated ? 'active' : 'inactive';

  // unknown도 Remote 기능을 열지 않는다. 현재 4-state 권한 표의 제한 모드를 재사용한다.
  const policyNetworkStatus = networkStatus === 'online' ? 'online' : 'offline';
  const policyKey: PolicyKey = `${policyNetworkStatus}_${activationStatus}`;

  return useMemo(
    () => ({
      trip: selectCRUDPermissions(TRIP_POLICIES, policyKey),
      schedule: selectCRUDPermissions(SCHEDULE_POLICIES, policyKey),
      expense: selectCRUDPermissions(EXPENSE_POLICIES, policyKey),
      service: SERVICE_POLICIES[policyKey],
    }),
    [policyKey],
  );
}

function selectCRUDPermissions(policies: CRUDOperationPolicies, key: PolicyKey): CRUDPermissions {
  return {
    create: policies.create[key],
    read: policies.read[key],
    update: policies.update[key],
    delete: policies.delete[key],
  };
}
