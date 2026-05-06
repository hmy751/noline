/**
 * Activation Router
 * - 활성화 상태에 따라 Local/Remote 데이터 경로 분기
 * - tripActivations 테이블의 활성화 메타데이터 기반 라우팅
 */

export { OfflineError, isOfflineError, type OfflineErrorOptions } from './errors';
export { getTripActivationStatus, getTripMetadata } from './metadata';
export { routeTripQuery, routeChildQuery, routeTripMutation, routeChildMutation } from './router';
