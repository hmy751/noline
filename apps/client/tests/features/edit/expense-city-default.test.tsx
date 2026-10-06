import { act, renderHook } from '@testing-library/react-native';
import { useCreateExpenseForm } from '@/features/expense/create-expense/useCreateExpenseForm';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('@/entities/trip', () => ({ useGetTrips: () => ({ data: mockTrips }) }));
jest.mock('@/entities/expense', () => ({ useCreateExpense: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('@/features/schedule/read-schedules', () => ({
  useTripSchedulesReadQuery: () => ({ view: mockScheduleView }),
}));

let mockTrips: { id: string; timeZone: string | null; baseCurrency: string }[] = [];
let mockScheduleView: { kind: string; data: { id: string; scheduledAt: string }[] };
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-01T15:30:00Z'));
  mockTrips = [];
  mockScheduleView = { kind: 'loading', data: [] };
});
afterEach(() => jest.useRealTimers());

it('여행 시간대가 늦게 조회되면 그 도시의 오늘을 기본값으로 채운다', () => {
  const hook = renderHook(() => useCreateExpenseForm({ tripId: 'trip' }));
  expect(hook.result.current.form.getValues('date')).toBe('');
  mockTrips = [{ id: 'trip', timeZone: 'Asia/Tokyo', baseCurrency: 'JPY' }];
  hook.rerender({});
  expect(hook.result.current.form.getValues('date')).toBe('2026-10-02');
});

it('작성 중 날짜는 시간대가 늦게 조회돼도 덮어쓰지 않는다', () => {
  const hook = renderHook(() => useCreateExpenseForm({ tripId: 'trip' }));
  act(() => hook.result.current.form.setValue('date', '2026-10-09', { shouldDirty: true }));
  mockTrips = [{ id: 'trip', timeZone: 'Asia/Tokyo', baseCurrency: 'JPY' }];
  hook.rerender({});
  expect(hook.result.current.form.getValues('date')).toBe('2026-10-09');
});

it('연결 일정이 뒤늦게 조회되면 그 일정의 도시 날짜를 기본값으로 사용한다', () => {
  mockTrips = [{ id: 'trip', timeZone: 'America/New_York', baseCurrency: 'USD' }];
  const hook = renderHook(() => useCreateExpenseForm({ tripId: 'trip', scheduleId: 'schedule' }));
  expect(hook.result.current.form.getValues('date')).toBe('');
  mockScheduleView = { kind: 'ready', data: [{ id: 'schedule', scheduledAt: '2026-10-08T01:30:00Z' }] };
  hook.rerender({});
  expect(hook.result.current.form.getValues('date')).toBe('2026-10-07');
});
