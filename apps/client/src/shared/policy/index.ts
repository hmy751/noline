/**
 * Policy Layer (CRUD-Centric)
 *
 * 동작 중심 Policy Layer - Entity별 CRUD 정책 제공
 */

// Types
export type {
  NetworkStatus,
  ActivationStatus,
  PolicyKey,
  CRUDMode,
  CRUDPermission,
  CRUDOperationPolicies,
  TripPolicies,
  SchedulePolicies,
  ExpensePolicies,
  ServiceConfig,
  ServicePolicies,
} from './types';

// Constants (Entity-specific)
export { TRIP_POLICIES, SCHEDULE_POLICIES, EXPENSE_POLICIES, SERVICE_POLICIES } from './constants';

// Helpers
export { getCRUDPolicyByOperation } from './constants';

// Hooks
export { useAppPolicy, type AppPolicyContext } from './useAppPolicy';

// Errors
export { PolicyError, createPolicyError } from './errors';
