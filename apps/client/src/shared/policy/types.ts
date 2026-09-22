import type { NetworkStatus } from '@/shared/store/network';

export type { NetworkStatus } from '@/shared/store/network';

export type ActivationStatus = 'active' | 'inactive';

/** 네트워크 상태와 여행 활성 상태로 정책표의 한 칸을 선택한다. */
export type PolicyKey = `${Exclude<NetworkStatus, 'unknown'>}_${ActivationStatus}`;

export type Operation = 'create' | 'read' | 'update' | 'delete';
export type OperationMode = 'full' | 'manual-only';

export interface OperationPolicy {
  allowed: boolean;
  mode?: OperationMode;
  reason?: string;
}

export type EntityPolicy = Record<Operation, OperationPolicy>;

export type EntityPolicyTable = Record<Operation, Record<PolicyKey, OperationPolicy>>;

export interface ServicePolicy {
  mapProvider: 'google' | 'mapbox' | 'none';
  searchMode: 'api' | 'cache' | 'disabled';
}

export type ServicePolicyTable = Record<PolicyKey, ServicePolicy>;
