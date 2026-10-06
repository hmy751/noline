import { getUTCDateRange } from '@/shared/lib/datetime';
import { expect, it } from '@jest/globals';
import { makeCreateScheduleFormSchema } from '@/features/schedule/create-schedule/schema';
import { makeScheduleUpdateFormSchema } from '@/features/schedule/update-schedule/schema';

const zone = 'America/Los_Angeles';
const createSchema = makeCreateScheduleFormSchema(zone);
const updateSchema = makeScheduleUpdateFormSchema(zone);

it.each([
  ['2026-02-30', '09:00'],
  ['2026-10-02', '24:00'],
  ['2026-10-02', '09:60'],
  ['2026-10-02T00:00:00Z', '09:00'],
  ['', '09:00'],
])('잘못된 도시 날짜·시간 %s %s는 생성과 수정 폼 모두 거절한다', (date, time) => {
  expect(createSchema.safeParse({ title: '일정', location: '장소', date, time }).success).toBe(false);
  expect(updateSchema.safeParse({ title: '일정', date, time }).success).toBe(false);
});

it('도시의 DST 누락 시각은 생성·수정 폼의 time 오류로 전달한다', () => {
  for (const schema of [createSchema, updateSchema]) {
    const result = schema.safeParse({ title: '일정', location: '장소', date: '2026-03-08', time: '02:30' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === 'time')).toBe(true);
  }
});

it.each([
  ['2026-03-07', '2026-03-10', ['2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10']],
  ['2026-10-31', '2026-11-03', ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03']],
])('DST 전환 기간 %s~%s의 여행 날짜는 중복·누락 없이 생성한다', (start, end, expected) => {
  expect(getUTCDateRange(`${start}T00:00:00Z`, `${end}T00:00:00Z`)).toEqual(expected);
});

it('역전되거나 해석 불가능한 여행 범위는 빈 목록이다', () => {
  expect(getUTCDateRange('2026-10-03', '2026-10-02')).toEqual([]);
  expect(getUTCDateRange('invalid', '2026-10-02')).toEqual([]);
});
