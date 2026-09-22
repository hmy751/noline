import type { EntityPolicyTable, ServicePolicyTable } from './types';

/** 일정 CRUD의 화면 가용성. Local/Remote 실행 경로는 Activation Router가 결정한다. */
export const SCHEDULE_POLICIES: EntityPolicyTable = {
  create: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: {
      allowed: true,
      mode: 'manual-only',
      reason: '장소 검색을 사용할 수 없어요. 직접 입력해주세요.',
    },
    offline_inactive: { allowed: false, reason: '여행을 활성화해주세요' },
  },
  read: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'full' },
    offline_inactive: {
      allowed: false,
      reason: '연결을 확인한 뒤 다시 볼 수 있어요. 오프라인에서는 활성 여행을 선택해주세요.',
    },
  },
  update: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: {
      allowed: true,
      mode: 'manual-only',
      reason: '오프라인에서는 장소를 다시 검색할 수 없어요.',
    },
    offline_inactive: { allowed: false, reason: '여행을 활성화해주세요' },
  },
  delete: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'full' },
    offline_inactive: { allowed: false, reason: '여행을 활성화해주세요' },
  },
};

/** 경비 CRUD의 화면 가용성. Local/Remote 실행 경로는 Activation Router가 결정한다. */
export const EXPENSE_POLICIES: EntityPolicyTable = {
  create: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: {
      allowed: true,
      mode: 'manual-only',
      reason: '오프라인에서는 일정을 연결할 수 없어요. 직접 입력해주세요.',
    },
    offline_inactive: { allowed: false, reason: '여행을 활성화해주세요' },
  },
  read: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'full' },
    offline_inactive: {
      allowed: false,
      reason: '연결을 확인한 뒤 다시 볼 수 있어요. 오프라인에서는 활성 여행을 선택해주세요.',
    },
  },
  update: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: {
      allowed: true,
      mode: 'manual-only',
      reason: '오프라인에서는 일정을 연결할 수 없어요.',
    },
    offline_inactive: { allowed: false, reason: '여행을 활성화해주세요' },
  },
  delete: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'full' },
    offline_inactive: { allowed: false, reason: '여행을 활성화해주세요' },
  },
};

/** 지도와 장소 검색처럼 네트워크 상태에 따라 provider가 달라지는 서비스 정책. */
export const SERVICE_POLICIES: ServicePolicyTable = {
  online_active: { mapProvider: 'google', searchMode: 'api' },
  online_inactive: { mapProvider: 'google', searchMode: 'api' },
  offline_active: { mapProvider: 'mapbox', searchMode: 'disabled' },
  offline_inactive: { mapProvider: 'none', searchMode: 'disabled' },
};
