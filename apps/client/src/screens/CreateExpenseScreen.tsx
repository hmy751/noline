import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MobileHeader } from '@/shared/components/Navigation';
import { ExpenseForm, ManualExpenseForm, useCreateExpenseForm } from '@/features/expense/create-expense';
import { ChevronLeft } from 'lucide-react-native';
import { useAppPolicy } from '@/shared/policy';

/**
 * 경비 생성 화면
 *
 * @example
 * router.push(`/create-expense?tripId=${tripId}&scheduleId=${scheduleId}`)
 */
export default function CreateExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId: string; date?: string; scheduleId?: string }>();

  const tripId = params.tripId;
  const date = params.date; // ISO date string (YYYY-MM-DD)
  const scheduleId = params.scheduleId;

  // ✅ Policy 체크: 모든 정책 조회
  const policy = useAppPolicy(tripId);

  const { form, isPending, onSubmit } = useCreateExpenseForm({
    tripId,
    date,
    scheduleId,
  });

  if (!tripId) {
    return (
      <View className='flex-1 bg-background items-center justify-center'>
        <MobileHeader
          title='경비 추가'
          leftIcon={<ChevronLeft size={24} color='hsl(0, 0%, 12%)' />}
          onLeftPress={() => router.back()}
        />
      </View>
    );
  }

  // ✅ Policy 체크: Expense 생성이 허용되지 않는 경우
  if (!policy.expense.create.allowed) {
    return (
      <View className='flex-1 bg-background'>
        <MobileHeader
          title='경비 추가'
          leftIcon={<ChevronLeft size={24} color='hsl(0, 0%, 12%)' />}
          onLeftPress={() => router.back()}
        />
        <View className='flex-1 items-center justify-center px-lg'>
          <Text className='text-h3 text-foreground mb-sm'>경비를 추가할 수 없습니다</Text>
          <Text className='text-body text-muted-foreground text-center'>{policy.expense.create.reason}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-background'>
      <MobileHeader
        title='경비 추가'
        leftIcon={<ChevronLeft size={24} color='hsl(0, 0%, 12%)' />}
        onLeftPress={() => router.back()}
      />

      {/* Manual Input 폼 (manual-only 모드일 때) */}
      {policy.expense.create.mode === 'manual-only' ? (
        <ManualExpenseForm form={form} onSubmit={onSubmit} onCancel={() => router.back()} isPending={isPending} />
      ) : (
        <ExpenseForm
          form={form}
          tripId={tripId}
          onSubmit={onSubmit}
          onCancel={() => router.back()}
          isPending={isPending}
        />
      )}
    </View>
  );
}
