import { useAppPolicy } from '@/shared/policy';
import type { OperationPolicy } from '@/shared/policy/types';

export type ReadBlock = { reason: 'unselected' | 'disabled' } | { reason: 'policy'; policy: OperationPolicy };

export interface TripReadAccess {
  hasTrip: boolean;
  consumerEnabled: boolean;
  displayPolicy: OperationPolicy;
  actualPolicy: OperationPolicy;
  block: ReadBlock | undefined;
  canFetch: boolean;
}

export interface TripReadOptions {
  enabled?: boolean;
}

export function useTripReadAccess(
  tripId: string | null | undefined,
  entity: 'schedule' | 'expense',
  { enabled = true }: TripReadOptions,
): TripReadAccess {
  const displayPolicy = useAppPolicy(tripId ?? undefined)[entity].read;
  const actualPolicy = useAppPolicy(tripId ?? undefined, { network: 'real' })[entity].read;
  const block: ReadBlock | undefined = !tripId
    ? { reason: 'unselected' }
    : !enabled
      ? { reason: 'disabled' }
      : !displayPolicy.allowed
        ? { reason: 'policy', policy: displayPolicy }
        : !actualPolicy.allowed
          ? { reason: 'policy', policy: actualPolicy }
          : undefined;
  return { hasTrip: !!tripId, consumerEnabled: enabled, displayPolicy, actualPolicy, block, canFetch: !block };
}
