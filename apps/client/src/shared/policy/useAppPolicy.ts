/**
 * useAppPolicy Hook
 *
 * 범용 Policy Hook - 모든 Entity의 CRUD 정책을 한 번에 제공
 * 여러 Entity 정책을 동시에 체크해야 할 때 사용
 */

import { useMemo } from 'react';
import { useNetworkStatus } from '@/shared/store/network';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import { TRIP_POLICIES, SCHEDULE_POLICIES, EXPENSE_POLICIES, SERVICE_POLICIES } from './constants';
import type { CRUDPermission, ServiceConfig, PolicyKey, ActivationStatus } from './types';

/**
 * App Policy Context
 *
 * 모든 Entity의 CRUD 정책 + Service 설정
 */
export interface AppPolicyContext {
  trip: {
    create: CRUDPermission;
    read: CRUDPermission;
    update: CRUDPermission;
    delete: CRUDPermission;
  };
  schedule: {
    create: CRUDPermission;
    read: CRUDPermission;
    update: CRUDPermission;
    delete: CRUDPermission;
  };
  expense: {
    create: CRUDPermission;
    read: CRUDPermission;
    update: CRUDPermission;
    delete: CRUDPermission;
  };
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
  const networkStatus = useNetworkStatus();

  // 기존 Hook 재사용 (Single Source of Truth)
  const { data: activation } = useGetTripActivation(tripId ?? '');

  // Activation Status 계산
  const isActivated = activation?.isActivated ?? false;
  const activationStatus: ActivationStatus = tripId && isActivated ? 'active' : 'inactive';

  // PolicyKey 계산: "online_active" | "offline_inactive" 등
  const policyKey: PolicyKey = `${networkStatus}_${activationStatus}`;

  // useMemo로 불필요한 객체 재생성 방지
  return useMemo(
    () => ({
      trip: {
        create: TRIP_POLICIES.create[policyKey],
        read: TRIP_POLICIES.read[policyKey],
        update: TRIP_POLICIES.update[policyKey],
        delete: TRIP_POLICIES.delete[policyKey],
      },
      schedule: {
        create: SCHEDULE_POLICIES.create[policyKey],
        read: SCHEDULE_POLICIES.read[policyKey],
        update: SCHEDULE_POLICIES.update[policyKey],
        delete: SCHEDULE_POLICIES.delete[policyKey],
      },
      expense: {
        create: EXPENSE_POLICIES.create[policyKey],
        read: EXPENSE_POLICIES.read[policyKey],
        update: EXPENSE_POLICIES.update[policyKey],
        delete: EXPENSE_POLICIES.delete[policyKey],
      },
      service: SERVICE_POLICIES[policyKey],
    }),
    [policyKey],
  );
}
