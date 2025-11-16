import { db, trips } from '@/shared/db';
import { eq } from 'drizzle-orm';

/**
 * 여행의 활성화 상태 조회
 * - trips 테이블의 activated 필드 확인
 * - 라우팅 레이어에서 사용
 */
export async function getTripActivationStatus(tripId: string): Promise<boolean> {
  const trip = await db.select({ activated: trips.activated }).from(trips).where(eq(trips.id, tripId)).get();

  if (!trip) {
    throw new Error(`Trip not found: ${tripId}`);
  }

  return trip.activated;
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
