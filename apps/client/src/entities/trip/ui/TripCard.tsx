import { View, Text, type ViewProps, TouchableOpacity } from 'react-native';
import { cn, Pressable } from '@repo/ui';
import { Calendar, Download, Edit3, Trash2 } from 'lucide-react-native';
import { ActivationBadge, type ActivationStatus } from './ActivationBadge';
import { formatCurrencyDisplay } from '@/shared/lib/currency';

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
  baseCurrency?: string; // 여행 기본 통화 (빈 경비 시 표시용)
  // ✅ 활성화 시스템 관련
  activationStatus?: ActivationStatus;
  onActivatePress?: () => void;
  onDeactivatePress?: () => void;
  onEditPress?: () => void;
  className?: string;
}

export function TripCard({
  destination,
  country,
  startDate,
  endDate,
  scheduleCount,
  expensesByCurrency = [],
  baseCurrency = 'EUR',
  activationStatus = 'online',
  onActivatePress,
  onDeactivatePress,
  onEditPress,
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
      {/* Header Section */}
      <View className='mb-md flex-row items-start justify-between'>
        {/* Left: Title and Date */}
        <View className='flex-col gap-2xs flex-1'>
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

        {/* Right: Controls (편집 버튼 + 활성화 배지) */}
        <View className='flex-col items-end gap-xs ml-sm'>
          {onEditPress && (
            <Pressable className='p-2xs' onPress={onEditPress}>
              <Edit3 size={20} color='rgba(245, 251, 245, 0.9)' strokeWidth={1.5} />
            </Pressable>
          )}
          <ActivationBadge status={activationStatus} />
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
            <Text className='text-title-large text-primary-foreground'>{formatCurrencyDisplay(0, baseCurrency)}</Text>
          )}
        </View>
      </View>

      {/* 활성화 버튼 - 비활성 상태일 때만 표시 */}
      {activationStatus === 'online' && onActivatePress && (
        <>
          <View className='my-sm h-px bg-primary-foreground/20' />
          <TouchableOpacity
            onPress={onActivatePress}
            className='flex-row items-center justify-center gap-sm rounded-lg bg-primary-foreground/10 py-sm'
            activeOpacity={0.7}
          >
            <Download size={18} color='rgba(245, 251, 245, 0.9)' strokeWidth={2} />
            <Text className='text-body-bold text-primary-foreground'>오프라인 활성화</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 비활성화 버튼 - 활성 상태(preparing/ready)일 때만 표시 */}
      {(activationStatus === 'preparing' || activationStatus === 'ready') && onDeactivatePress && (
        <>
          <View className='my-sm h-px bg-primary-foreground/20' />
          <TouchableOpacity
            onPress={onDeactivatePress}
            className='flex-row items-center justify-center gap-sm rounded-lg bg-destructive/20 py-sm'
            activeOpacity={0.7}
          >
            <Trash2 size={18} color='rgba(245, 251, 245, 0.9)' strokeWidth={2} />
            <Text className='text-body-bold text-primary-foreground'>오프라인 해제</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
