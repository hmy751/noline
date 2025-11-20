/**
 * Policy Layer Types (CRUD-Centric)
 *
 * 동작 중심 구조로 4-state policy matrix 정의
 * - online_active: 온라인 + 활성화 (전체 기능)
 * - online_inactive: 온라인 + 비활성 (서버 직접 접근)
 * - offline_active: 오프라인 + 활성화 (수동 입력 모드)
 * - offline_inactive: 오프라인 + 비활성 (읽기 전용)
 */

export type NetworkStatus = 'online' | 'offline';
export type ActivationStatus = 'active' | 'inactive';
export type PolicyKey = `${NetworkStatus}_${ActivationStatus}`;

/**
 * CRUD Operation Mode
 *
 * - full: 전체 기능 사용 가능
 * - manual-only: 수동 입력만 가능 (API 호출 없이 텍스트만)
 * - limited: 일부 필드만 수정 가능
 */
export type CRUDMode = 'full' | 'manual-only' | 'limited';

/**
 * CRUD Permission
 */
export interface CRUDPermission {
  allowed: boolean;
  mode?: CRUDMode;
  reason?: string; // 비활성화된 경우 사용자에게 보여줄 이유

  // 필드별 검증 규칙 (optional)
  validation?: {
    required?: string[]; // 필수 필드
    optional?: string[]; // 선택 필드
    allowed?: string[]; // 허용된 필드 (limited mode)
    blocked?: string[]; // 차단된 필드 (limited mode)
    enforced?: Record<string, unknown>; // 강제 값 (e.g., latitude: null)
  };
}

/**
 * CRUD Operation Policies
 *
 * 각 CRUD 동작이 4가지 상태에서 어떻게 동작하는지 정의
 */
export interface CRUDOperationPolicies {
  create: Record<PolicyKey, CRUDPermission>;
  read: Record<PolicyKey, CRUDPermission>;
  update: Record<PolicyKey, CRUDPermission>;
  delete: Record<PolicyKey, CRUDPermission>;
}

/**
 * Trip Policies
 */
export interface TripPolicies extends CRUDOperationPolicies {}

/**
 * Schedule Policies
 */
export interface SchedulePolicies extends CRUDOperationPolicies {}

/**
 * Expense Policies
 */
export interface ExpensePolicies extends CRUDOperationPolicies {}

/**
 * Service Layer Configuration
 *
 * 서비스 레이어는 상태별 설정 (기존 구조 유지)
 */
export interface ServiceConfig {
  mapProvider: 'google' | 'mapbox' | 'none';
  searchMode: 'api' | 'cache' | 'disabled';
  syncStrategy: 'immediate' | 'background' | 'manual' | 'disabled';
  uiMode: 'full' | 'limited' | 'readonly';
}

/**
 * Service Layer Policies
 */
export type ServicePolicies = Record<PolicyKey, ServiceConfig>;
