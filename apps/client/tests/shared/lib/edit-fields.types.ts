import { buildChangedGroupPatch } from '@/shared/lib/edit-fields';

// client test:typecheck에서 호출부의 table·필드·반환 계약을 확인한다.
export const checkEditFieldTypes = (): void => {
  const expense = buildChangedGroupPatch('expenses', { amount: '25.00' }, { amount: '25', currency: 'USD' });
  const schedule = buildChangedGroupPatch('schedules', { latitude: '1' }, { latitude: 1 });

  expense.amount?.toUpperCase();
  schedule.latitude?.toFixed();

  // @ts-expect-error 경비에는 장소 필드가 없다.
  buildChangedGroupPatch('expenses', {}, { location: '역' });
  // @ts-expect-error 일정에는 금액 필드가 없다.
  buildChangedGroupPatch('schedules', {}, { amount: '25' });
  // @ts-expect-error baseline의 오탈자도 허용하지 않는다.
  buildChangedGroupPatch('expenses', { amout: '25' }, {});
  // @ts-expect-error 좌표 입력은 공유 request처럼 number다.
  buildChangedGroupPatch('schedules', {}, { latitude: '1' });
  // @ts-expect-error 반환 필드도 table별로 제한한다.
  expense.location;
};
