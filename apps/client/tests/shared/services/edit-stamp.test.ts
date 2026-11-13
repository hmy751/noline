import * as SecureStore from 'expo-secure-store';

import { allocateEdit, observeFieldEdits } from '@/shared/services/edit-stamp';
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock('@/shared/services/id/ulid', () => ({ generateId: () => 'saved-id' }));
let saved: string | null;
beforeEach(() => {
  saved = null;
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-10T09:00:00Z'));
  (SecureStore.getItemAsync as jest.Mock).mockImplementation(async () => saved);
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (_key, value) => {
    saved = value;
  });
});

afterEach(() => jest.restoreAllMocks());
it('keeps concurrent saves monotone and follows observed remote edits after a backwards clock', async () => {
  const observed = { time: '2026-11-10T12:00:00Z', sequence: 9, id: 'remote' };
  await observeFieldEdits({ amount: observed });
  const [first, second] = await Promise.all([allocateEdit(), allocateEdit()]);
  expect(first).toEqual({ time: '2026-11-10T12:00:00.000Z', sequence: 10, id: 'saved-id' });
  expect(second.sequence).toBe(11);
  expect(JSON.parse(saved!).sequence).toBe(11);
});

it.each(['read', 'write'])(
  'retains a received clock after storage %s fails and persists it before the next edit',
  async (stage) => {
    const observed = { time: '2026-11-10T12:00:00Z', sequence: 9, id: 'remote' };
    const failure = new Error('storage unavailable');

    if (stage === 'read') {
      jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(failure);
    } else {
      jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(failure);
    }

    await expect(observeFieldEdits({ amount: observed })).rejects.toBe(failure);

    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(failure);
    await expect(allocateEdit()).rejects.toBe(failure);

    const recovered = await allocateEdit();
    expect(recovered.time).toBe('2026-11-10T12:00:00.000Z');
    expect(recovered.sequence).toBe(10);
    expect(JSON.parse(saved!)).toEqual(recovered);
  },
);

it('does not apply a later observation to a save already waiting for its clock read', async () => {
  let finishRead!: (value: string | null) => void;
  jest.mocked(SecureStore.getItemAsync).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishRead = resolve;
      }),
  );

  const firstSave = allocateEdit();
  await Promise.resolve();
  const observation = observeFieldEdits({ amount: { time: '2026-11-10T12:00:00Z', sequence: 9, id: 'later' } });
  finishRead(null);

  expect((await firstSave).time).toBe('2026-11-10T09:00:00.000Z');

  await observation;
  expect((await allocateEdit()).sequence).toBe(10);
});
