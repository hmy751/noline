import { z } from 'zod';

import { isoDateTime } from '../primitives/datetime';

/** 값과 함께 저장하며 응답을 잃고 재전송할 때도 같은 표식을 사용한다. */
export const editStamp = z
  .object({
    time: isoDateTime,
    sequence: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    id: z.string().min(1).max(200),
  })
  .strict();
export type EditStamp = z.infer<typeof editStamp>;
export const fieldEdits = z.record(editStamp);
export type FieldEdits = z.infer<typeof fieldEdits>;
const SCHEDULE_EDIT_GROUPS = {
  title: ['title'],
  scheduledAt: ['scheduledAt'],
  location: ['location', 'address', 'latitude', 'longitude'],
} as const;
const EXPENSE_EDIT_GROUPS = {
  title: ['title'],
  amount: ['amount', 'currency'],
  category: ['category'],
  date: ['date'],
  scheduleId: ['scheduleId'],
  hasReceipt: ['hasReceipt'],
  receiptUrl: ['receiptUrl'],
} as const;

export { SCHEDULE_EDIT_GROUPS as scheduleEditGroups, EXPENSE_EDIT_GROUPS as expenseEditGroups };

/** 새 표식이 있는 수정만 그룹 전체를 요구한다. 표식 없는 구버전 요청은 부분 입력을 허용한다. */
export const validateEditedGroups =
  (groups: Record<string, readonly string[]>) =>
  (input: Record<string, unknown> & { edit?: EditStamp }, context: z.RefinementCtx): void => {
    if (!input.edit) {
      return;
    }

    const fieldGroups = Object.values(groups);
    const isPresent = (field: string) => input[field] !== undefined;

    if (!fieldGroups.some((fields) => fields.some(isPresent))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['edit'],
        message: 'An edit must contain a writable field',
      });
    }

    for (const fields of fieldGroups) {
      if (fields.some(isPresent) && !fields.every(isPresent)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Edited groups must include every field',
          path: [fields[0]],
        });
      }
    }
  };

/** 시각과 순번이 같으면 저장 당시의 고정 ID 순서로 승자를 결정한다. */
export const compareEdits = (left: EditStamp, right: EditStamp): number => {
  const timeDifference = Date.parse(left.time) - Date.parse(right.time);

  if (timeDifference) {
    return timeDifference < 0 ? -1 : 1;
  }
  if (left.sequence !== right.sequence) {
    return left.sequence < right.sequence ? -1 : 1;
  }
  if (left.id === right.id) {
    return 0;
  }

  return left.id < right.id ? -1 : 1;
};
