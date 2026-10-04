import { View, Text, ActivityIndicator } from 'react-native';
import { Pressable } from '@repo/ui';
import type { OperationPolicy } from '@/shared/policy/types';
import type { ReadQueryView } from '@/shared/services/policy-query';
import { formatCurrencyDisplay, type CurrencyGroup } from '@/shared/lib/currency';

type SummaryRead<T> = { view: ReadQueryView<T>; onRetry?: () => void; isRetrying: boolean };

export interface TripSummaryProps {
  schedule: SummaryRead<number>;
  expense: SummaryRead<CurrencyGroup[]>;
  baseCurrency: string;
  onRecheckNetwork: () => void;
  isRecheckingNetwork: boolean;
}

export function TripSummary({
  schedule,
  expense,
  baseCurrency,
  onRecheckNetwork,
  isRecheckingNetwork,
}: TripSummaryProps) {
  // 실제 연결이 제한되어도 캐시가 있는 항목만 ready일 수 있다. 긴 안내는 전체 폭에 둔다.
  const stackItems = [schedule.view.kind, expense.view.kind].some((kind) => kind === 'blocked' || kind === 'error');
  const primaryCurrency = expense.view.kind === 'ready' ? expense.view.data[0] : undefined;
  const additionalCurrencyCount = expense.view.kind === 'ready' ? Math.max(0, expense.view.data.length - 1) : 0;

  // 같은 여행의 일정·경비 read 정책은 같다. 둘 다 제한되면 공동 안내를 표시한다.
  if (schedule.view.kind === 'blocked' && expense.view.kind === 'blocked') {
    return (
      <View className='gap-xs'>
        <Text className='text-label text-primary-foreground/70'>일정 · 경비</Text>
        <RestrictionFeedback
          policy={schedule.view.policy}
          subject='일정과 경비'
          onRecheck={onRecheckNetwork}
          isRechecking={isRecheckingNetwork}
        />
      </View>
    );
  }

  return (
    <View className='gap-sm'>
      <View className={stackItems ? 'gap-sm' : 'flex-row items-start justify-between gap-sm'}>
        <View className={stackItems ? 'gap-3xs' : 'flex-1 gap-3xs'}>
          <Text className='text-label text-primary-foreground/70'>일정</Text>
          {schedule.view.kind === 'ready' ? (
            <Text className='text-title-large text-primary-foreground'>{schedule.view.data}개</Text>
          ) : (
            <ReadFeedback {...schedule} label='일정' onRecheck={onRecheckNetwork} isRechecking={isRecheckingNetwork} />
          )}
        </View>
        <View className={stackItems ? 'gap-3xs' : 'flex-1 items-end gap-3xs'}>
          <Text className='text-label text-primary-foreground/70'>경비</Text>
          {expense.view.kind === 'ready' ? (
            <View className={stackItems ? 'gap-3xs' : 'items-end gap-3xs'}>
              <Text className='text-title-large text-primary-foreground'>
                {primaryCurrency
                  ? `${primaryCurrency.currency} ${primaryCurrency.amount.toFixed(2)}`
                  : formatCurrencyDisplay(0, baseCurrency)}
              </Text>
              {additionalCurrencyCount > 0 && (
                <Text className='text-label text-primary-foreground/70'>+{additionalCurrencyCount}개 통화</Text>
              )}
            </View>
          ) : (
            <ReadFeedback {...expense} label='경비' onRecheck={onRecheckNetwork} isRechecking={isRecheckingNetwork} />
          )}
        </View>
      </View>
      {schedule.view.kind === 'ready' && schedule.view.refreshFailed && (
        <RetryFeedback message='일정을 갱신하지 못했어요. 이전 내용을 표시하고 있어요.' {...schedule} />
      )}
      {expense.view.kind === 'ready' && expense.view.refreshFailed && (
        <RetryFeedback message='경비를 갱신하지 못했어요. 이전 내용을 표시하고 있어요.' {...expense} />
      )}
    </View>
  );
}

function ReadFeedback({
  view,
  label,
  onRetry,
  isRetrying,
  onRecheck,
  isRechecking,
}: SummaryRead<unknown> & {
  label: '일정' | '경비';
  onRecheck: () => void;
  isRechecking: boolean;
}) {
  if (view.kind === 'blocked') {
    return (
      <RestrictionFeedback policy={view.policy} subject={label} onRecheck={onRecheck} isRechecking={isRechecking} />
    );
  }

  if (view.kind === 'error') {
    return (
      <RetryFeedback
        message={label === '일정' ? '일정을 불러오지 못했어요.' : '경비를 불러오지 못했어요.'}
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    );
  }

  return (
    <View accessibilityState={{ busy: view.kind === 'loading' }}>
      <Text className='text-body text-primary-foreground'>{view.kind === 'loading' ? '불러오는 중' : '—'}</Text>
    </View>
  );
}

function RestrictionFeedback({
  policy,
  subject,
  onRecheck,
  isRechecking,
}: {
  policy: OperationPolicy;
  subject: '일정' | '경비' | '일정과 경비';
  onRecheck: () => void;
  isRechecking: boolean;
}) {
  const message =
    policy.reasonCode === 'offline-inactive'
      ? `이 여행의 ${subject}${subject === '일정' ? '은' : '는'} 인터넷에 연결하면 볼 수 있어요.`
      : (policy.reason ?? '현재 요약을 볼 수 없어요.');

  return (
    <View className='gap-sm' accessibilityState={{ busy: Boolean(policy.pending) }}>
      {policy.pending && <ActivityIndicator color='rgba(245, 251, 245, 0.9)' />}
      <Text className='text-body text-primary-foreground'>{message}</Text>
      {!policy.pending && policy.recoveryAction === 'recheck-network' && (
        <Pressable
          variant='outline'
          size='md'
          accessibilityRole='button'
          accessibilityState={{ disabled: isRechecking, busy: isRechecking }}
          disabled={isRechecking}
          onPress={onRecheck}
        >
          {isRechecking ? '확인 중' : '다시 확인'}
        </Pressable>
      )}
    </View>
  );
}

function RetryFeedback({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry?: () => void;
  isRetrying: boolean;
}) {
  return (
    <View className='gap-sm'>
      <Text className='text-body text-primary-foreground'>{message}</Text>
      {onRetry && (
        <Pressable
          variant='outline'
          size='md'
          accessibilityRole='button'
          accessibilityState={{ disabled: isRetrying, busy: isRetrying }}
          disabled={isRetrying}
          onPress={onRetry}
        >
          {isRetrying ? '불러오는 중' : '다시 불러오기'}
        </Pressable>
      )}
    </View>
  );
}
