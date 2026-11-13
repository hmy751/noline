import * as SecureStore from 'expo-secure-store';

import type { z } from 'zod';

import type { EditStamp, FieldEdits } from '@repo/schema/sync/field-edits';

import { generateId } from '@/shared/services/id/ulid';

export type { EditStamp, FieldEdits } from '@repo/schema/sync/field-edits';

/** Repository에서 검증과 표식 준비를 마친 앱 내부 수정 요청. */
export type PreparedEdit<T> = T & { edit: EditStamp };

const EDIT_CLOCK_KEY = 'noline.edit-clock.v1';
let pendingClockWrite: Promise<unknown> = Promise.resolve();
let unpersistedClock: EditStamp | undefined;

/** 관찰과 발급을 접수 순서대로 실행한다. 앞선 저장의 실패는 다음 발급을 막지 않는다. */
const withEditClock = <T>(work: () => Promise<T>): Promise<T> => {
  const result = pendingClockWrite.then(work);
  pendingClockWrite = result.catch(() => undefined);
  return result;
};

const retainAndReadObservedClock = async (marks?: FieldEdits | null): Promise<EditStamp | undefined> => {
  // 읽기·쓰기 실패 뒤에도 이미 받은 표식을 다음 발급에서 다시 보존한다.
  for (const mark of Object.values(marks ?? {})) {
    if (isLaterClock(mark, unpersistedClock)) {
      unpersistedClock = mark;
    }
  }

  const storedClock = await SecureStore.getItemAsync(EDIT_CLOCK_KEY);
  const clock: EditStamp | undefined = storedClock ? JSON.parse(storedClock) : undefined;

  return unpersistedClock && isLaterClock(unpersistedClock, clock) ? unpersistedClock : clock;
};

const isLaterClock = (candidate: EditStamp, current?: EditStamp): boolean =>
  !current ||
  Date.parse(candidate.time) > Date.parse(current.time) ||
  (Date.parse(candidate.time) === Date.parse(current.time) && candidate.sequence > current.sequence);

const persistClock = async (clock: EditStamp): Promise<void> => {
  await SecureStore.setItemAsync(EDIT_CLOCK_KEY, JSON.stringify(clock));
  unpersistedClock = undefined;
};

/** 수신한 표식을 먼저 기록해 이후 오프라인 저장이 이미 관찰한 편집보다 뒤의 순서를 갖게 한다. */
export const observeFieldEdits = (marks?: FieldEdits | null): Promise<void> => {
  if (!marks || Object.keys(marks).length === 0) {
    return Promise.resolve();
  }

  return withEditClock(async () => {
    const clock = await retainAndReadObservedClock(marks);

    if (clock) {
      await persistClock(clock);
    }
  });
};

export const allocateEdit = (marks?: FieldEdits | null): Promise<EditStamp> => {
  const submittedAt = Date.now();

  return withEditClock(async () => {
    const clock = await retainAndReadObservedClock(marks);
    const observedTime = clock ? Date.parse(clock.time) : 0;
    let time = Math.max(submittedAt, observedTime);
    let sequence = clock && time === observedTime ? clock.sequence + 1 : 0;

    if (!Number.isSafeInteger(sequence)) {
      time += 1;
      sequence = 0;
    }

    const edit = { time: new Date(time).toISOString(), sequence, id: generateId() };
    await persistClock(edit);
    return edit;
  });
};

/** 제출 시점에 발급 순서를 확보하고, 이미 발급된 요청은 같은 표식을 유지한다. */
export const prepareEdit = async <T extends { edit?: EditStamp }>(
  schema: z.ZodType<T>,
  request: T,
): Promise<PreparedEdit<T>> => {
  const input = schema.parse(request);

  if (input.edit) {
    return { ...input, edit: input.edit };
  }

  const edit = await allocateEdit();
  return { ...schema.parse({ ...input, edit }), edit };
};
