import { expect, it } from '@jest/globals';
import {
  combineDateTimeToISO,
  formatISOToLocalDate,
  formatISOToLocalTime,
  getUTCDateRange,
  getUserTimezone,
} from '@/shared/lib/datetime';
import { createScheduleFormSchema } from '@/features/schedule/create-schedule/schema';
import { scheduleUpdateFormSchema } from '@/features/schedule/update-schedule/schema';

it.each(['2026-10-02', '2026-03-08', '2026-11-01'])(
  '기기 시간대에서 선택한 %s 09:00을 같은 현지 날짜·시간으로 되돌린다',
  (date) => {
    const saved = combineDateTimeToISO(date, '09:00');
    expect(saved.endsWith('Z')).toBe(true);
    expect(formatISOToLocalDate(saved)).toBe(date);
    expect(formatISOToLocalTime(saved)).toBe('09:00');
  },
);

it('Date 입력은 원본을 변경하지 않는다', () => {
  const original = new Date('2026-10-02T20:12:34.567Z');
  const before = original.toISOString();
  const result = combineDateTimeToISO(original, '09:00');
  expect(original.toISOString()).toBe(before);
  expect(formatISOToLocalDate(result)).toBe(formatISOToLocalDate(before));
});

it.each([
  ['2026-02-30', '09:00'],
  ['2026-10-02', '24:00'],
  ['2026-10-02', '09:60'],
  ['2026-10-02T00:00:00Z', '09:00'],
  ['', '09:00'],
])('잘못된 날짜·시간 %s %s는 생성과 수정 폼 모두 거절한다', (date, time) => {
  expect(() => combineDateTimeToISO(date, time)).toThrow();
  expect(createScheduleFormSchema.safeParse({ title: '일정', location: '장소', date, time }).success).toBe(false);
  expect(scheduleUpdateFormSchema.safeParse({ title: '일정', date, time }).success).toBe(false);
});

(getUserTimezone() === 'America/Los_Angeles' ? it : it.skip)(
  'DST 시작으로 존재하지 않는 02:30을 03:30으로 보정하지 않고 폼 오류로 남긴다',
  () => {
    expect(() => combineDateTimeToISO('2026-03-08', '02:30')).toThrow('사용할 수 없는');
    const result = createScheduleFormSchema.safeParse({
      title: '일정',
      location: '장소',
      date: '2026-03-08',
      time: '02:30',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === 'time')).toBe(true);
  },
);

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
