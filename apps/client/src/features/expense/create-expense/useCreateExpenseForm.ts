import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCreateExpense } from '@/entities/expense';
import { generateId } from '@/shared/services/id/ulid';
import { createExpenseFormSchema, type CreateExpenseFormData } from './schema';

interface UseCreateExpenseFormProps {
  tripId: string;
  scheduleId?: string;
  onSuccess?: () => void;
}

export const useCreateExpenseForm = ({ tripId, scheduleId, onSuccess }: UseCreateExpenseFormProps) => {
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
    // 현재 날짜를 ISO date string으로 (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    createExpense(
      {
        id: generateId(), // ✅ 외부에서 ID 생성
        tripId,
        title: data.title,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        date: today, // ✅ ISO date string
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
