/**
 * Offline City Entity
 * 오프라인 지도 관리 엔티티
 *
 * 역할:
 * - Mapbox 오프라인 지도 다운로드/삭제
 * - 참조 카운트 기반 자동 삭제
 * - 다운로드 진행률 표시
 */

// Data Layer
export { offlineCityKeys, useOfflineCity, useDownloadOfflineMap, useDecrementOfflineCityReference } from './data';

// UI Layer
export { OfflineMapDownloadProgress } from './ui';
