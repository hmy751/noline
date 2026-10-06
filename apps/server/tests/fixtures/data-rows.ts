export const TEST_USER_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAA';
export const SCHEDULE_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAB';
export const TRIP_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAC';
export const EXPENSE_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAD';

export const START_DATE = '2026-09-19T00:00:00.000Z';
export const END_DATE = '2026-09-22T00:00:00.000Z';
export const EXPENSE_DATE = '2026-09-20';
export const CREATED_AT = '2026-09-13T02:00:00.000Z';
export const UPDATED_AT = '2026-09-13T03:00:00.000Z';

export const tripRow = {
  id: TRIP_ID,
  userId: TEST_USER_ID,
  name: 'Seoul trip',
  destination: 'Seoul',
  country: 'KR',
  baseCurrency: 'KRW',
  latitude: null,
  longitude: null,
  cityId: null,
  timeZone: 'Asia/Seoul',
  startDate: new Date(START_DATE),
  endDate: new Date(END_DATE),
  createdAt: new Date(CREATED_AT),
  updatedAt: new Date(UPDATED_AT),
  deletedAt: null,
  version: 1,
};

export const serializedTrip = {
  ...tripRow,
  startDate: START_DATE,
  endDate: END_DATE,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  deletedAt: null,
};

export const expenseRow = {
  id: EXPENSE_ID,
  userId: TEST_USER_ID,
  tripId: TRIP_ID,
  scheduleId: SCHEDULE_ID,
  title: 'Lunch',
  amount: '12000.00',
  currency: 'KRW',
  category: 'food',
  date: new Date(`${EXPENSE_DATE}T00:00:00.000Z`),
  hasReceipt: 1,
  receiptUrl: null,
  createdAt: new Date(CREATED_AT),
  updatedAt: new Date(UPDATED_AT),
  deletedAt: null,
  version: 1,
};

export const serializedExpense = {
  ...expenseRow,
  date: EXPENSE_DATE,
  hasReceipt: true,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  deletedAt: null,
};
