import { buildChangedGroupPatch, editedMarks } from '@/shared/lib/edit-fields';

jest.mock('expo-secure-store', () => {
  throw new Error('순수 변경 계산은 SecureStore를 불러오면 안 됩니다');
});

it('uses original form values and emits only changed atomic groups, retaining explicit clears', () => {
  expect(
    buildChangedGroupPatch(
      'expenses',
      { title: '택시', amount: '25.00', currency: 'USD', category: '기타', scheduleId: 'old' },
      { title: '택시', amount: '25', currency: 'USD', category: '교통', scheduleId: null },
    ),
  ).toEqual({ category: '교통', scheduleId: null });
  expect(
    buildChangedGroupPatch('expenses', { amount: '25', currency: 'USD' }, { amount: '30', currency: 'USD' }),
  ).toEqual({
    amount: '30',
    currency: 'USD',
  });
  expect(
    buildChangedGroupPatch(
      'schedules',
      { location: '역', address: '주소', latitude: '1', longitude: '2' },
      { location: '역', address: '주소', latitude: 1, longitude: 2 },
    ),
  ).toEqual({});
});

it('sends the whole location group and preserves explicit null clears', () => {
  expect(
    buildChangedGroupPatch(
      'schedules',
      { location: '역', address: '이전 주소', latitude: '1', longitude: '2' },
      { location: '역', address: null, latitude: null, longitude: null },
    ),
  ).toEqual({ location: '역', address: null, latitude: null, longitude: null });
});

it('keeps unknown raw queue marks and replaces only groups touched by the patch', () => {
  const unknownMark: unknown = { future: 'raw queue value' };
  const current = { title: 'legacy', category: 'keep', futureGroup: 'keep future' };

  expect(editedMarks('expenses', { title: '새 제목', futureField: 'raw' }, unknownMark, current)).toEqual({
    title: unknownMark,
    category: 'keep',
    futureGroup: 'keep future',
  });
  expect(current).toEqual({ title: 'legacy', category: 'keep', futureGroup: 'keep future' });
});
