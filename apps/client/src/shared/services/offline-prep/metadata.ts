import { getDatabase, trips, tripActivations } from '@/shared/db';
import { eq, and } from 'drizzle-orm';
import { selectLocalUserId, useAuthStore } from '@/shared/store/auth';
import { ownedRow } from '@/shared/services/auth/local-access';

/**
 * 특정 여행의 활성화 상태 조회 (boolean)
 * - tripActivations 테이블 확인 (Single Source of Truth)
 * - Schedule/Expense 라우팅에서 사용
 */
export async function getTripActivationStatus(tripId: string): Promise<boolean> {
  const activation = await getDatabase()
    .select()
    .from(tripActivations)
    .where(ownedRow(tripActivations.userId, eq(tripActivations.tripId, tripId)))
    .get();

  // tripActivations에 레코드가 있고 isActivated가 true이면 활성화
  return !!(activation && activation.isActivated);
}

/**
 * 특정 여행의 활성화 상태 상세 조회
 * - UI에서 배지 표시용
 * @returns 'online' | 'preparing' | 'ready'
 */
export async function getTripActivationStatusDetail(tripId: string): Promise<'online' | 'preparing' | 'ready'> {
  const activation = await getDatabase()
    .select()
    .from(tripActivations)
    .where(ownedRow(tripActivations.userId, eq(tripActivations.tripId, tripId)))
    .get();

  if (!activation || !activation.isActivated) {
    return 'online';
  }

  if (activation.mapDownloaded) {
    return 'ready';
  }

  return 'preparing';
}

/**
 * 현재 사용자의 활성화된 여행이 있는지 확인
 * - tripActivations 테이블에서 현재 userId + isActivated = true인 레코드 확인
 * - Trip 자체 라우팅에서 사용
 * - userId 필터링으로 다중 사용자 환경 지원
 */
export async function hasAnyActivatedTrip(): Promise<boolean> {
  const userId = selectLocalUserId(useAuthStore.getState());

  // 인증되지 않은 상태면 활성화된 여행 없음
  if (!userId) {
    console.log('[TripActivation] No authenticated user');
    return false;
  }

  const activation = await getDatabase()
    .select()
    .from(tripActivations)
    .where(and(eq(tripActivations.isActivated, true), eq(tripActivations.userId, userId)))
    .limit(1)
    .all();

  const hasActivated = activation.length > 0;
  console.log(`[TripActivation] userId=${userId}, hasActivated=${hasActivated}`);

  return hasActivated;
}

/**
 * 현재 사용자의 활성화된 여행 정보 조회
 * - 동시에 1개 여행만 활성화 가능하므로 단일 조회
 * - TripSelector 등 UI에서 활성화 뱃지 표시용
 * - userId 필터링으로 다중 사용자 환경 지원
 * @returns { tripId, status } | null
 */
export async function getActivatedTripInfo(): Promise<{
  tripId: string;
  status: 'preparing' | 'ready';
} | null> {
  const userId = selectLocalUserId(useAuthStore.getState());

  // 인증되지 않은 상태면 null 반환
  if (!userId) {
    return null;
  }

  // tripActivations 테이블에서 현재 userId + isActivated = true인 레코드 조회
  const activation = await getDatabase()
    .select()
    .from(tripActivations)
    .where(and(eq(tripActivations.isActivated, true), eq(tripActivations.userId, userId)))
    .get();

  if (!activation) {
    return null;
  }

  return {
    tripId: activation.tripId,
    status: activation.mapDownloaded ? 'ready' : 'preparing',
  };
}

/**
 * 여행 레코드 조회. 활성화 상태는 결합하지 않는다.
 */
export async function getTripMetadata(tripId: string) {
  const trip = await getDatabase()
    .select()
    .from(trips)
    .where(ownedRow(trips.userId, eq(trips.id, tripId)))
    .get();

  if (!trip) {
    throw new Error(`Trip not found: ${tripId}`);
  }

  return trip;
}

/**
 * 지도 다운로드 진행률 조회
 * @returns syncProgress (0-100) or null if not found
 */
export async function getMapDownloadProgress(tripId: string): Promise<number | null> {
  const activation = await getDatabase()
    .select()
    .from(tripActivations)
    .where(ownedRow(tripActivations.userId, eq(tripActivations.tripId, tripId)))
    .get();

  if (!activation) {
    return null;
  }

  return activation.syncProgress ?? 0;
}
