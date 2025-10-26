import { View, Text, type ViewProps } from 'react-native';
import { cn } from '@repo/ui';
import { Calendar } from 'lucide-react-native';

/**
 * ✅ CURRENCY_POLICY: 통화별 경비 그룹
 */
export interface CurrencyGroup {
  currency: string;
  amount: number;
}

interface TripCardProps extends ViewProps {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  scheduleCount?: number;
  // ✅ CURRENCY_POLICY: 통화별 경비 그룹 (주 통화 + 추가 통화)
  expensesByCurrency?: CurrencyGroup[];
  className?: string;
}

export function TripCard({
  destination,
  country,
  startDate,
  endDate,
  scheduleCount,
  expensesByCurrency = [],
  className,
  ...props
}: TripCardProps) {
  // ✅ CURRENCY_POLICY: 주 통화 (가장 많이 사용된 통화)
  const primaryCurrency = expensesByCurrency.length > 0 ? expensesByCurrency[0] : null;
  // ✅ 추가 통화 개수
  const additionalCurrencyCount = Math.max(0, expensesByCurrency.length - 1);

  return (
    <View
      className={cn('rounded-xl bg-primary p-md', className)}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
      {...props}
    >
      {/* Title and Date */}
      <View className='mb-md flex-col gap-2xs'>
        <Text className='text-display-medium text-primary-foreground'>
          {destination}, {country}
        </Text>
        <View className='flex-row items-center gap-xs'>
          <Calendar size={16} color='rgba(245, 251, 245, 0.9)' strokeWidth={2} />
          <Text className='text-body text-primary-foreground/90'>
            {startDate} - {endDate}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View className='mb-sm h-px bg-primary-foreground/20' />

      {/* Stats */}
      <View className='flex-row items-center justify-between'>
        {scheduleCount !== undefined && (
          <View className='flex-col gap-3xs'>
            <Text className='text-label text-primary-foreground/70'>일정</Text>
            <Text className='text-title-large text-primary-foreground'>{scheduleCount}개</Text>
          </View>
        )}
        {/* ✅ CURRENCY_POLICY: 주 통화 + 추가 통화 개수 표시 */}
        <View className='flex-col items-end gap-3xs'>
          <Text className='text-label text-primary-foreground/70'>경비</Text>
          {primaryCurrency ? (
            <View className='flex-col items-end gap-3xs'>
              {/* 주 통화 (큰 글씨) */}
              <Text className='text-title-large text-primary-foreground'>
                {primaryCurrency.currency} {primaryCurrency.amount.toFixed(2)}
              </Text>
              {/* 추가 통화 개수 (작은 글씨) */}
              {additionalCurrencyCount > 0 && (
                <Text className='text-label text-primary-foreground/70'>+{additionalCurrencyCount}개 통화</Text>
              )}
            </View>
          ) : (
            <Text className='text-title-large text-primary-foreground'>EUR 0.00</Text>
          )}
        </View>
      </View>
    </View>
  );
}
