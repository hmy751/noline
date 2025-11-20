/**
 * Policy Error
 *
 * Policy 규칙 위반 시 발생하는 에러
 */

import type { CRUDPermission } from './types';

export class PolicyError extends Error {
  public readonly code: string;
  public readonly permission: CRUDPermission;
  public readonly action?: string;

  constructor(
    message: string,
    options?: {
      permission?: CRUDPermission;
      action?: string;
      code?: string;
    },
  ) {
    super(message);
    this.name = 'PolicyError';
    this.code = options?.code || 'POLICY_VIOLATION';
    this.permission = options?.permission || { allowed: false };
    this.action = options?.action;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PolicyError);
    }
  }
}

/**
 * Policy Error 생성 헬퍼
 */
export function createPolicyError(operation: string, permission: CRUDPermission): PolicyError {
  return new PolicyError(permission.reason || `${operation} is not allowed`, {
    permission,
    code: `POLICY_${operation.toUpperCase()}_DENIED`,
  });
}
