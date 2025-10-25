import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MobileHeader } from '@/shared/components/Navigation';
import { ExpenseForm, useCreateExpenseForm } from '@/features/expense/create-expense';

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

  if (!tripId) {
    return (
      <View className='flex-1 bg-background items-center justify-center'>
        <MobileHeader title='경비 추가' onBackPress={() => router.back()} />
      </View>
    );
  }

  const { form, isPending, onSubmit } = useCreateExpenseForm({
    tripId,
    date,
    scheduleId,
  });

  return (
    <View className='flex-1 bg-background'>
      <MobileHeader title='경비 추가' onBackPress={() => router.back()} />
      <ExpenseForm form={form} onSubmit={onSubmit} onCancel={() => router.back()} isPending={isPending} />
    </View>
  );
}
