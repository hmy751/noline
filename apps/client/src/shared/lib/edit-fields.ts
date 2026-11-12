import type { z } from 'zod';

import type { scheduleEntity } from '@repo/schema/entities/schedule';
import type { updateExpenseRequest } from '@repo/schema/requests/expense';
import type { updateScheduleRequest } from '@repo/schema/requests/schedule';
import { expenseEditGroups, scheduleEditGroups } from '@repo/schema/sync/field-edits';

const EDITABLE_GROUPS: Record<'schedules' | 'expenses', Record<string, readonly string[]>> = {
  schedules: scheduleEditGroups,
  expenses: expenseEditGroups,
};

export { EDITABLE_GROUPS as editableGroups };

/** 변경 필드에 해당하는 그룹만 표식을 교체한다. 큐를 투영할 때에도 이 함수가 입력을 검증하거나 폐기하지 않는다. */
export const editedMarks = <Mark>(
  table: keyof typeof EDITABLE_GROUPS,
  patch: object,
  edit: Mark,
  current: Record<string, Mark> = {},
): Record<string, Mark> => {
  const marks = { ...current };

  for (const [group, fields] of Object.entries(EDITABLE_GROUPS[table])) {
    if (fields.some((field) => Object.prototype.hasOwnProperty.call(patch, field))) {
      marks[group] = edit;
    }
  }

  return marks;
};

type ExpenseFields = Omit<z.infer<typeof updateExpenseRequest>, 'edit'>;
type ScheduleFields = Omit<z.infer<typeof updateScheduleRequest>, 'edit'>;
type ScheduleBaseline = Partial<Pick<z.infer<typeof scheduleEntity>, keyof ScheduleFields>> | ScheduleFields;

/** 폼을 열 때의 값과 비교해 변경된 그룹 전체를 보낸다. 명시적으로 지운 값은 null로 남긴다. */
export function changedFields(table: 'expenses', baseline: ExpenseFields, values: ExpenseFields): ExpenseFields;
export function changedFields(table: 'schedules', baseline: ScheduleBaseline, values: ScheduleFields): ScheduleFields;
export function changedFields(
  table: keyof typeof EDITABLE_GROUPS,
  baseline: Record<string, unknown>,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  for (const fields of Object.values(EDITABLE_GROUPS[table])) {
    const present = fields.filter((field) => Object.prototype.hasOwnProperty.call(values, field));
    const isUnchanged = (field: string) => {
      const left = values[field] ?? null;
      const right = baseline[field] ?? null;

      if (['amount', 'latitude', 'longitude'].includes(field) && left !== null && right !== null) {
        return Number.isFinite(Number(left)) && Number(left) === Number(right);
      }

      return left === right;
    };

    if (present.some((field) => !isUnchanged(field))) {
      for (const field of fields) {
        patch[field] = values[field] ?? null;
      }
    }
  }

  return patch;
}
