/**
 * Policy Constants (CRUD-Centric)
 *
 * 동작 중심으로 재구성된 Policy 정의
 * - 각 Entity별로 CRUD 동작 정책 정의
 * - 각 동작이 4가지 상태에서 어떻게 다른지 한눈에 파악 가능
 */

import type { TripPolicies, SchedulePolicies, ExpensePolicies, ServicePolicies, CRUDPermission } from './types';

// ============================================================================
// Trip Policies
// ============================================================================

export const TRIP_POLICIES: TripPolicies = {
  /**
   * Trip 생성
   *
   * 오프라인에서는 통화/도시 정보 설정이 불가능하므로 차단
   */
  create: {
    online_active: {
      allowed: true,
      mode: 'full',
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
    },
    offline_active: {
      allowed: false,
      reason: '인터넷 연결이 필요합니다 (통화 및 도시 정보 설정)',
    },
    offline_inactive: {
      allowed: false,
      reason: '인터넷 연결이 필요합니다',
    },
  },

  /**
   * Trip 조회
   *
   * 모든 상태에서 가능 (Router가 로컬/서버 자동 분기)
   */
  read: {
    online_active: {
      allowed: true,
      mode: 'full',
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
    },
    offline_active: {
      allowed: true,
      mode: 'full', // Router가 로컬 DB 읽기 처리
    },
    offline_inactive: {
      allowed: true,
      mode: 'full', // Router가 처리 (로컬 캐시 or 에러)
      reason: '수정하려면 여행을 활성화해주세요',
    },
  },

  /**
   * Trip 수정
   *
   * 오프라인 활성화: 일부 필드만 수정 가능 (통화/도시는 차단)
   */
  update: {
    online_active: {
      allowed: true,
      mode: 'full',
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
    },
    offline_active: {
      allowed: true,
      mode: 'limited',
      validation: {
        allowed: ['name', 'startDate', 'endDate'],
        blocked: ['destination', 'cityId', 'baseCurrency'],
      },
    },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },

  /**
   * Trip 삭제
   */
  delete: {
    online_active: {
      allowed: true,
      mode: 'full',
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
    },
    offline_active: {
      allowed: true,
      mode: 'full',
    },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },
};

// ============================================================================
// Schedule Policies
// ============================================================================

export const SCHEDULE_POLICIES: SchedulePolicies = {
  /**
   * Schedule 생성
   *
   * 오프라인 활성화: Manual Input 모드 (좌표 없이 생성 가능)
   */
  create: {
    online_active: {
      allowed: true,
      mode: 'full',
      validation: {
        required: ['title', 'scheduledAt'],
        optional: ['location', 'latitude', 'longitude'],
      },
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
      validation: {
        required: ['title', 'scheduledAt'],
        optional: ['location', 'latitude', 'longitude'],
      },
    },
    offline_active: {
      allowed: true,
      mode: 'manual-only',
      reason: '장소 검색을 사용할 수 없어요. 직접 입력해주세요.',
      validation: {
        required: ['title', 'scheduledAt'],
        optional: ['location'],
        enforced: {
          latitude: null,
          longitude: null,
        },
      },
    },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },

  /**
   * Schedule 조회
   */
  read: {
    online_active: {
      allowed: true,
      mode: 'full',
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
    },
    offline_active: {
      allowed: true,
      mode: 'full', // Router가 로컬 DB 읽기 처리
    },
    offline_inactive: {
      allowed: true,
      mode: 'full', // Router가 처리
      reason: '수정하려면 여행을 활성화해주세요',
    },
  },

  /**
   * Schedule 수정
   */
  update: {
    online_active: {
      allowed: true,
      mode: 'full',
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
    },
    offline_active: {
      allowed: true,
      mode: 'manual-only',
      validation: {
        allowed: ['title', 'scheduledAt', 'location'],
        blocked: ['latitude', 'longitude'],
      },
    },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },

  /**
   * Schedule 삭제
   */
  delete: {
    online_active: {
      allowed: true,
      mode: 'full',
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
    },
    offline_active: {
      allowed: true,
      mode: 'full',
    },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },
};

// ============================================================================
// Expense Policies
// ============================================================================

export const EXPENSE_POLICIES: ExpensePolicies = {
  /**
   * Expense 생성
   *
   * 오프라인 활성화: Manual Input 모드 (영수증 업로드 불가)
   */
  create: {
    online_active: {
      allowed: true,
      mode: 'full',
      validation: {
        required: ['title', 'amount', 'currency', 'category', 'date'],
        optional: ['scheduleId', 'receiptUrl'],
      },
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
      validation: {
        required: ['title', 'amount', 'currency', 'category', 'date'],
        optional: ['scheduleId', 'receiptUrl'],
      },
    },
    offline_active: {
      allowed: true,
      mode: 'manual-only',
      validation: {
        required: ['title', 'amount', 'currency', 'category', 'date'],
        optional: ['scheduleId'],
        enforced: {
          receiptUrl: null,
        },
      },
    },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },

  /**
   * Expense 조회
   */
  read: {
    online_active: {
      allowed: true,
      mode: 'full',
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
    },
    offline_active: {
      allowed: true,
      mode: 'full', // Router가 로컬 DB 읽기 처리
    },
    offline_inactive: {
      allowed: true,
      mode: 'full', // Router가 처리
    },
  },

  /**
   * Expense 수정
   */
  update: {
    online_active: {
      allowed: true,
      mode: 'full',
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
    },
    offline_active: {
      allowed: true,
      mode: 'manual-only',
      validation: {
        allowed: ['title', 'amount', 'currency', 'category', 'date'],
        blocked: ['receiptUrl'],
      },
    },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },

  /**
   * Expense 삭제
   */
  delete: {
    online_active: {
      allowed: true,
      mode: 'full',
    },
    online_inactive: {
      allowed: true,
      mode: 'full',
    },
    offline_active: {
      allowed: true,
      mode: 'full',
    },
    offline_inactive: {
      allowed: false,
      reason: '여행을 활성화해주세요',
    },
  },
};

// ============================================================================
// Service Layer Policies
// ============================================================================

export const SERVICE_POLICIES: ServicePolicies = {
  online_active: {
    mapProvider: 'google',
    searchMode: 'api',
    syncStrategy: 'immediate',
    uiMode: 'full',
  },
  online_inactive: {
    mapProvider: 'google',
    searchMode: 'api',
    syncStrategy: 'immediate',
    uiMode: 'full',
  },
  offline_active: {
    mapProvider: 'mapbox',
    searchMode: 'disabled',
    syncStrategy: 'background',
    uiMode: 'limited',
  },
  offline_inactive: {
    mapProvider: 'none',
    searchMode: 'disabled',
    syncStrategy: 'disabled',
    uiMode: 'readonly',
  },
};

// ============================================================================
// Debugging Helper
// ============================================================================

/**
 * CRUD 중심 뷰 Helper
 *
 * 특정 entity의 operation이 4가지 state에서 어떻게 동작하는지 확인
 *
 * @example
 * ```ts
 * console.table(getCRUDPolicyByOperation('schedule', 'create'));
 * // ┌─────────────────┬─────────┬──────────────┬────────────────┐
 * // │     State       │ allowed │     mode     │     reason     │
 * // ├─────────────────┼─────────┼──────────────┼────────────────┤
 * // │ online_active   │  true   │    full      │       -        │
 * // │ offline_active  │  true   │ manual-only  │  장소 검색...  │
 * // └─────────────────┴─────────┴──────────────┴────────────────┘
 * ```
 */
export function getCRUDPolicyByOperation(
  entity: 'trip' | 'schedule' | 'expense',
  operation: 'create' | 'read' | 'update' | 'delete',
): Record<string, CRUDPermission> {
  const policyMap = {
    trip: TRIP_POLICIES,
    schedule: SCHEDULE_POLICIES,
    expense: EXPENSE_POLICIES,
  };

  return policyMap[entity][operation];
}
