import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCreateExpense } from '@/entities/expense';
import { generateId } from '@/shared/services/id/ulid';
import { createExpenseFormSchema, type CreateExpenseFormData } from './schema';

interface UseCreateExpenseFormProps {
  tripId: string;
  date?: string; // 경비 날짜 (ISO date string, YYYY-MM-DD)
  scheduleId?: string;
  onSuccess?: () => void;
}

export const useCreateExpenseForm = ({ tripId, date, scheduleId, onSuccess }: UseCreateExpenseFormProps) => {
  const router = useRouter();

  const form = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseFormSchema),
    defaultValues: {
      title: '',
      amount: '',
      currency: 'EUR',
      category: '',
      scheduleId: scheduleId || undefined,
    },
    mode: 'onChange',
  });

  const { mutate: createExpense, isPending } = useCreateExpense();

  const onValid = (data: CreateExpenseFormData) => {
    // 날짜: 전달받은 날짜 또는 오늘 날짜
    const expenseDate = date || new Date().toISOString().split('T')[0];

    createExpense(
      {
        id: generateId(), // ✅ 외부에서 ID 생성
        tripId,
        title: data.title,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        date: expenseDate, // ✅ 지정된 날짜 또는 오늘 날짜
        scheduleId: data.scheduleId || null,
        hasReceipt: false,
        receiptUrl: null,
      },
      {
        onSuccess: () => {
          console.log('✅ Expense created successfully');
          onSuccess?.();
          router.back();
        },
      },
    );
  };

  const onInvalid = () => {
    console.log('Form validation failed');
  };

  return {
    form,
    isPending,
    onSubmit: form.handleSubmit(onValid, onInvalid),
  };
};
