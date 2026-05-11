/**
 * Trip 및 데이터 lifecycle 상수
 *
 * 의미가 다른 두 종류의 7일을 명시적으로 분리한다.
 */

/**
 * 여행 활성화 grace 기간 (일).
 *
 * trip.endDate 기준으로 이 기간이 지난 뒤 활성화 만료 및 오프라인 지도
 * cleanup 대상이 된다.
 */
export const TRIP_ACTIVATION_GRACE_DAYS = 7;

/**
 * Soft delete vacuum 기간 (일).
 *
 * deletedAt 이 설정된 뒤 이 기간이 지난 schedule/expense 레코드는
 * cleanup-job 의 vacuum 단계에서 hard delete 된다.
 */
export const SOFT_DELETE_VACUUM_DAYS = 7;
