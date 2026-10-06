import type { EntityPolicyTable, NetworkStatus, OperationPolicy, PolicyKey, ServicePolicyTable } from './types';

/** 새 여행은 서버에서 생성하므로 다른 여행의 활성 여부와 무관하다. */
export const TRIP_CREATE_POLICIES: Record<Exclude<NetworkStatus, 'unknown'>, OperationPolicy> = {
  online: { allowed: true },
  offline: { allowed: false, reason: '여행을 만들려면 인터넷 연결이 필요해요' },
};

/** 기존 여행 수정은 대상 여행의 활성 여부를 따른다. */
export const TRIP_UPDATE_POLICIES: Record<PolicyKey, OperationPolicy> = {
  online_active: { allowed: true },
  online_inactive: { allowed: true },
  offline_active: { allowed: true },
  offline_inactive: { allowed: false, reason: '오프라인에서는 활성화된 여행만 수정할 수 있어요.' },
};

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
    offline_inactive: {
      allowed: false,
      reason: '인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.',
    },
  },
  read: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'full' },
    offline_inactive: {
      allowed: false,
      reasonCode: 'offline-inactive',
      reason: '인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.',
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
    offline_inactive: {
      allowed: false,
      reason: '인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.',
    },
  },
  delete: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'full' },
    offline_inactive: {
      allowed: false,
      reason: '인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.',
    },
  },
};

/** 경비 CRUD의 화면 가용성. Local/Remote 실행 경로는 Activation Router가 결정한다. */
export const EXPENSE_POLICIES: EntityPolicyTable = {
  create: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: {
      allowed: true,
      mode: 'full',
    },
    offline_inactive: {
      allowed: false,
      reason: '인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.',
    },
  },
  read: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'full' },
    offline_inactive: {
      allowed: false,
      reasonCode: 'offline-inactive',
      reason: '인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.',
    },
  },
  update: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: {
      allowed: true,
      mode: 'full',
    },
    offline_inactive: {
      allowed: false,
      reason: '인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.',
    },
  },
  delete: {
    online_active: { allowed: true, mode: 'full' },
    online_inactive: { allowed: true, mode: 'full' },
    offline_active: { allowed: true, mode: 'full' },
    offline_inactive: {
      allowed: false,
      reason: '인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.',
    },
  },
};

/** 지도와 장소 검색처럼 네트워크 상태에 따라 provider가 달라지는 서비스 정책. */
export const SERVICE_POLICIES: ServicePolicyTable = {
  online_active: { mapProvider: 'google', searchMode: 'api' },
  online_inactive: { mapProvider: 'google', searchMode: 'api' },
  offline_active: { mapProvider: 'mapbox', searchMode: 'disabled' },
  offline_inactive: { mapProvider: 'none', searchMode: 'disabled' },
};
