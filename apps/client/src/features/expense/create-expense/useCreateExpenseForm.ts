import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCreateExpense } from '@/entities/expense';
import { generateId } from '@/shared/services/id/ulid';
import { dateToISODateTime } from '@/shared/lib/datetime';
import { createExpenseFormSchema, type CreateExpenseFormData } from './schema';

interface UseCreateExpenseFormProps {
  tripId: string;
  date?: string; // 경비 날짜 (YYYY-MM-DD 또는 ISO datetime)
  scheduleId?: string;
  onSuccess?: () => void;
}

export const useCreateExpenseForm = ({ tripId, date, scheduleId, onSuccess }: UseCreateExpenseFormProps) => {
  const router = useRouter();

  // ✅ TIME_ARCHITECTURE_GUIDE Pattern 2: Date → ISO datetime
  // "2024-03-15" → "2024-03-15T00:00:00.000Z"
  const defaultDate = date ? dateToISODateTime(date) : dateToISODateTime(new Date().toISOString().split('T')[0]);

  const form = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseFormSchema),
    defaultValues: {
      title: '',
      amount: '',
      currency: 'EUR',
      category: '',
      date: defaultDate, // ✅ ISO datetime string
      scheduleId: scheduleId || undefined,
    },
    mode: 'onChange',
  });

  const { mutate: createExpense, isPending } = useCreateExpense();

  const onValid = (data: CreateExpenseFormData) => {
    createExpense(
      {
        id: generateId(), // ✅ 외부에서 ID 생성
        tripId,
        title: data.title,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        date: data.date, // ✅ 폼에서 선택한 날짜
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

  const handleSubmit = () => {
    void form.handleSubmit(onValid, onInvalid)();
  };

  return {
    form,
    isPending,
    onSubmit: handleSubmit,
  };
};
