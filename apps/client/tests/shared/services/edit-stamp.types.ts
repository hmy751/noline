import { fetchUpdateExpense } from '@/entities/expense/api/expenses';
import { updateExpenseLocal } from '@/entities/expense/lib/expense-local';
import { fetchUpdateSchedule } from '@/entities/schedule/api/schedules';
import { updateScheduleLocal } from '@/entities/schedule/lib/schedule-local';

// 하위 저장 경계는 Repository가 준비한 표식을 요구한다. 실행하지 않는 타입 검사다.
export const checkPreparedInput = (): void => {
  // @ts-expect-error 표식 없는 입력은 Repository에서 준비해야 한다.
  updateExpenseLocal('expense', { title: 'changed' });
  // @ts-expect-error 표식 없는 입력은 Repository에서 준비해야 한다.
  fetchUpdateExpense('expense', { title: 'changed' });
  // @ts-expect-error 표식 없는 입력은 Repository에서 준비해야 한다.
  updateScheduleLocal('schedule', { title: 'changed' });
  // @ts-expect-error 표식 없는 입력은 Repository에서 준비해야 한다.
  fetchUpdateSchedule('schedule', { title: 'changed' });
};
