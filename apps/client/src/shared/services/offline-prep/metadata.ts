import { db, trips, tripActivations } from '@/shared/db';
import { eq } from 'drizzle-orm';

/**
 * 특정 여행의 활성화 상태 조회
 * - tripActivations 테이블 확인 (Single Source of Truth)
 * - Schedule/Expense 라우팅에서 사용
 */
export async function getTripActivationStatus(tripId: string): Promise<boolean> {
  const activation = await db.select().from(tripActivations).where(eq(tripActivations.tripId, tripId)).get();

  // tripActivations에 레코드가 있으면 활성화
  return !!activation;
}

/**
 * 활성화된 여행이 하나라도 있는지 확인
 * - tripActivations 테이블 확인
 * - Trip 자체 라우팅에서 사용
 */
export async function hasAnyActivatedTrip(): Promise<boolean> {
  const activation = await db.select().from(tripActivations).limit(1).all();

  // tripActivations에 레코드가 하나라도 있으면 true
  return activation.length > 0;
}

/**
 * 여행 메타데이터 조회 (activated 포함)
 * - 전체 Trip 정보가 필요한 경우 사용
 */
export async function getTripMetadata(tripId: string) {
  const trip = await db.select().from(trips).where(eq(trips.id, tripId)).get();

  if (!trip) {
    throw new Error(`Trip not found: ${tripId}`);
  }

  return trip;
}
