/** @jest-environment node */
import { expect, it } from '@jest/globals';
import {
  addCalendarDays,
  combineDateTimeInTimeZoneToISO,
  formatISOToTimeZoneDate,
  formatISOToTimeZoneTime,
  getTimeZoneDateRange,
  getTimeZoneDayStartISO,
  getTimeZoneToday,
} from '@/shared/lib/datetime';

it.each([
  ['Asia/Seoul', '2026-10-02T00:00:00.000Z'],
  ['Europe/Paris', '2026-10-02T07:00:00.000Z'],
  ['America/Los_Angeles', '2026-10-02T16:00:00.000Z'],
])('%s 도시 입력은 기기 설정과 관계없이 UTC 시점으로 바꾸고 되돌린다', (zone, expected) => {
  const iso = combineDateTimeInTimeZoneToISO('2026-10-02', '09:00', zone);
  expect(iso).toBe(expected);
  expect(formatISOToTimeZoneDate(iso, zone)).toBe('2026-10-02');
  expect(formatISOToTimeZoneTime(iso, zone)).toBe('09:00');
});

it('DST 누락 시각과 잘못된 날짜·시간대는 보정하지 않고 거절한다', () => {
  expect(() => combineDateTimeInTimeZoneToISO('2026-03-08', '02:30', 'America/Los_Angeles')).toThrow('사용할 수 없는');
  expect(() => combineDateTimeInTimeZoneToISO('2026-02-30', '09:00', 'Asia/Seoul')).toThrow();
  expect(() => combineDateTimeInTimeZoneToISO('2026-10-02', '24:00', 'Asia/Seoul')).toThrow();
  expect(() => combineDateTimeInTimeZoneToISO('2026-10-02', '09:60', 'Asia/Seoul')).toThrow();
  expect(() => combineDateTimeInTimeZoneToISO('2026-10-02T00:00:00Z', '09:00', 'Asia/Seoul')).toThrow();
  expect(() => combineDateTimeInTimeZoneToISO('', '09:00', 'Asia/Seoul')).toThrow();
  expect(() => combineDateTimeInTimeZoneToISO('2026-10-02', '09:00', '')).toThrow();
  expect(() => combineDateTimeInTimeZoneToISO('2026-10-02', '09:00', 'Mars/Olympus')).toThrow();
});

it('DST 중복 시각의 새 입력은 첫 시점이고 원본 두 시점의 표시는 같다', () => {
  const zone = 'America/Los_Angeles';
  expect(combineDateTimeInTimeZoneToISO('2026-11-01', '01:30', zone)).toBe('2026-11-01T08:30:00.000Z');
  expect(formatISOToTimeZoneTime('2026-11-01T09:30:47.123Z', zone, 'HH:mm:ss')).toBe('01:30:47');
});

it.each([
  ['2026-03-08', 23],
  ['2026-11-01', 25],
])('도시 날짜 %s의 길이가 %s시간이어도 날짜 목록은 한 번씩 나온다', (date, hours) => {
  const zone = 'America/Los_Angeles';
  const next = addCalendarDays(date, 1);
  const start = getTimeZoneDayStartISO(date, zone);
  const end = getTimeZoneDayStartISO(next, zone);
  expect((Date.parse(end) - Date.parse(start)) / 3_600_000).toBe(hours);
  expect(getTimeZoneDateRange(start, end, zone)).toEqual([date, next]);
});

it('도시의 오늘과 여행 범위는 UTC 날짜가 다른 시점도 현지 날짜로 읽는다', () => {
  expect(getTimeZoneToday('Asia/Seoul', new Date('2026-10-02T16:00:00Z'))).toBe('2026-10-03');
  expect(getTimeZoneDateRange('2026-10-01T15:00:00Z', '2026-10-03T15:00:00Z', 'Asia/Seoul')).toEqual([
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
  ]);
  expect(getTimeZoneDateRange('2026-10-03T15:00:00Z', '2026-10-01T15:00:00Z', 'Asia/Seoul')).toEqual([]);
  expect(() => getTimeZoneDateRange('invalid', '2026-10-01T15:00:00Z', 'Asia/Seoul')).toThrow();
});
