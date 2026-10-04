import React from 'react';
import { afterEach, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, within } from '@testing-library/react-native';
import { TripCard } from '@/entities/trip/ui/TripCard';
import type { TripSummaryProps } from '@/entities/trip/ui/TripSummary';
import type { OperationPolicy } from '@/shared/policy/types';

jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('@repo/ui', () => ({
  ...jest.requireActual<Pick<typeof import('@repo/ui'), 'Pressable'>>(
    '../../../../../packages/ui/src/components/Pressable',
  ),
  ...jest.requireActual<Pick<typeof import('@repo/ui'), 'cn'>>('../../../../../packages/ui/src/lib/utils'),
}));

afterEach(cleanup);

const ready = <T,>(data: T, refreshFailed = false) => ({
  view: { kind: 'ready' as const, data, refreshFailed },
  isRetrying: false,
});
const blocked = (policy: OperationPolicy) => ({ view: { kind: 'blocked' as const, policy }, isRetrying: false });
const unavailablePolicy: OperationPolicy = {
  allowed: false,
  reason: '인터넷 연결을 확인할 수 없어요.',
  recoveryAction: 'recheck-network',
};

function setup(overrides: Partial<TripSummaryProps> = {}) {
  const onRecheckNetwork = jest.fn();
  const summary: TripSummaryProps = {
    schedule: ready(2),
    expense: ready([{ currency: 'USD', amount: 12 }]),
    baseCurrency: 'USD',
    onRecheckNetwork,
    isRecheckingNetwork: false,
    ...overrides,
  };
  const view = render(
    <TripCard
      destination='파리'
      country='프랑스'
      startDate='9월 21일'
      endDate='9월 23일'
      summary={summary}
      testID='card'
    />,
  );
  return { ...view, card: within(view.getByTestId('card')), onRecheckNetwork };
}

it('성공한 빈 결과는 일정 0개와 기본 통화 0원으로 표시한다', () => {
  const { card } = setup({ schedule: ready(0), expense: ready([]) });
  expect(card.getByText('0개')).toBeTruthy();
  expect(card.getByText('USD 0.00')).toBeTruthy();
  expect(card.queryByText('불러오는 중')).toBeNull();
});

it('정상 요약은 주 통화와 추가 통화 개수를 유지한다', () => {
  const { card } = setup({
    expense: ready([
      { currency: 'EUR', amount: 15 },
      { currency: 'USD', amount: 12 },
    ]),
  });
  expect(card.getByText('2개')).toBeTruthy();
  expect(card.getByText('EUR 15.00')).toBeTruthy();
  expect(card.getByText('+1개 통화')).toBeTruthy();
});

it('최초 로딩은 성공한 0값으로 표시하지 않는다', () => {
  const { card } = setup({
    schedule: { view: { kind: 'loading' }, isRetrying: false },
    expense: { view: { kind: 'loading' }, isRetrying: false },
  });
  expect(card.getAllByText('불러오는 중')).toHaveLength(2);
  expect(card.queryByText('0개')).toBeNull();
  expect(card.queryByText('USD 0.00')).toBeNull();
});

it('같은 여행의 두 read 제한은 별도 객체여도 공동 안내와 재확인 버튼 하나로 표시한다', () => {
  const { card, onRecheckNetwork } = setup({
    schedule: blocked(unavailablePolicy),
    expense: blocked({ ...unavailablePolicy }),
  });
  expect(card.getByText('일정 · 경비')).toBeTruthy();
  expect(card.getAllByText('인터넷 연결을 확인할 수 없어요.')).toHaveLength(1);
  expect(card.getAllByRole('button', { name: '다시 확인' })).toHaveLength(1);
  fireEvent.press(card.getByRole('button', { name: '다시 확인' }));
  expect(onRecheckNetwork).toHaveBeenCalledTimes(1);
  expect(card.queryByText('2개')).toBeNull();
  expect(card.queryByText('USD 12.00')).toBeNull();
});

it('확인 중에는 공동 진행 안내를 표시하고 재확인 버튼을 만들지 않는다', () => {
  const checking = blocked({ allowed: false, reason: '인터넷 연결을 확인하고 있어요.', pending: true });
  const { card } = setup({ schedule: checking, expense: checking });
  expect(card.getAllByText('인터넷 연결을 확인하고 있어요.')).toHaveLength(1);
  expect(card.getByText('일정 · 경비')).toBeTruthy();
  expect(card.queryByRole('button')).toBeNull();
});

it('기존 공유 재확인이 진행 중이면 버튼을 비활성화한다', () => {
  const { card, onRecheckNetwork } = setup({
    schedule: blocked(unavailablePolicy),
    expense: blocked(unavailablePolicy),
    isRecheckingNetwork: true,
  });
  const button = card.getByRole('button', { name: '확인 중' });
  expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  fireEvent.press(button);
  expect(onRecheckNetwork).not.toHaveBeenCalled();
});

it.each<OperationPolicy>([
  { allowed: false, reason: '다시 로그인한 뒤 사용할 수 있습니다' },
  { allowed: false, reason: '여행 활성 상태를 확인하고 있어요.', pending: true },
  { allowed: false, reason: '여행 활성 상태를 확인하지 못했어요.' },
  { allowed: false, reason: '오프라인에서는 활성 여행을 선택해주세요.', reasonCode: 'offline-inactive' },
])('복구 권한 없는 제한은 원래 의미를 보존하고 재확인 버튼을 만들지 않는다: $reason', (policy) => {
  const { card } = setup({ schedule: blocked(policy), expense: blocked(policy) });
  expect(
    card.getAllByText(
      policy.reasonCode === 'offline-inactive'
        ? '이 여행의 일정과 경비는 인터넷에 연결하면 볼 수 있어요.'
        : (policy.reason ?? ''),
    ),
  ).toHaveLength(1);
  expect(card.queryByRole('button')).toBeNull();
});

it('한쪽만 읽기 제한이면 해당 안내와 정상 요약을 유지한다', () => {
  const { card } = setup({ schedule: blocked(unavailablePolicy) });
  expect(card.getByText('인터넷 연결을 확인할 수 없어요.')).toBeTruthy();
  expect(card.getByText('USD 12.00')).toBeTruthy();
  expect(card.queryByText('일정 · 경비')).toBeNull();
});

it('개별 offline 제한은 해당 요약만 설명하고 정상 값을 유지한다', () => {
  const { card } = setup({
    schedule: blocked({
      allowed: false,
      reasonCode: 'offline-inactive',
      reason: '오프라인에서는 활성 여행을 선택해주세요.',
    }),
  });
  expect(card.getByText('이 여행의 일정은 인터넷에 연결하면 볼 수 있어요.')).toBeTruthy();
  expect(card.queryByText('오프라인에서는 활성 여행을 선택해주세요.')).toBeNull();
  expect(card.getByText('USD 12.00')).toBeTruthy();
});

it.each([
  { item: 'schedule' as const, error: '일정을 불러오지 못했어요.', retained: 'USD 12.00', absent: '0개' },
  { item: 'expense' as const, error: '경비를 불러오지 못했어요.', retained: '2개', absent: 'USD 0.00' },
])(
  '한쪽 $item 최초 실패에서도 정상 숫자와 해당 안내·재시도를 카드 안에 유지한다',
  ({ item, error, retained, absent }) => {
    const onRetry = jest.fn();
    const { card } = setup({ [item]: { view: { kind: 'error' }, onRetry, isRetrying: false } });
    expect(card.getByText(retained)).toBeTruthy();
    expect(card.getByText(error)).toBeTruthy();
    expect(card.queryByText(absent)).toBeNull();
    fireEvent.press(card.getByRole('button', { name: '다시 불러오기' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  },
);

it.each([true, false])('갱신 실패는 기존 숫자를 유지하며 재조회 허용 %s에 따라 버튼을 표시한다', (canRetry) => {
  const onRetry = jest.fn();
  const { card } = setup({ schedule: { ...ready(2, true), onRetry: canRetry ? onRetry : undefined } });
  expect(card.getByText('2개')).toBeTruthy();
  expect(card.getByText('USD 12.00')).toBeTruthy();
  expect(card.getByText('일정을 갱신하지 못했어요. 이전 내용을 표시하고 있어요.')).toBeTruthy();
  if (canRetry) {
    fireEvent.press(card.getByRole('button', { name: '다시 불러오기' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  } else {
    expect(card.queryByRole('button', { name: '다시 불러오기' })).toBeNull();
  }
});

it.each(['error', 'ready'] as const)('%s의 재조회가 진행 중이면 callback을 중복 실행하지 않는다', (kind) => {
  const onRetry = jest.fn();
  const { card } = setup({
    schedule: {
      view: kind === 'ready' ? { kind, data: 2, refreshFailed: true } : { kind },
      onRetry,
      isRetrying: true,
    },
  });
  const button = card.getByRole('button', { name: '불러오는 중' });
  expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  fireEvent.press(button);
  expect(onRetry).not.toHaveBeenCalled();
});
