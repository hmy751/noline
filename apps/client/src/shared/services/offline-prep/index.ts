/**
 * 오프라인 활성화 시스템 (Offline Preparation System)
 * - 선택적 오프라인 지원을 위한 라우팅 레이어
 * - trips 테이블의 activated 필드 기반 라우팅
 */

export { OfflineError, isOfflineError, type OfflineErrorOptions } from './errors';
export { getTripActivationStatus, getTripMetadata } from './metadata';
export { routeTripQuery, routeChildQuery, routeTripMutation, routeChildMutation } from './router';
