import { expenseDateInput } from '@repo/schema/requests/expense';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCreateExpense } from '@/entities/expense';
import { useGetTrips } from '@/entities/trip';
import { generateId } from '@/shared/services/id/ulid';
import { formatISOToLocalDate } from '@/shared/lib/datetime';
import { createExpenseFormSchema, type CreateExpenseFormData } from './schema';

interface UseCreateExpenseFormProps {
  tripId: string;
  date?: string; // 경비 날짜 (YYYY-MM-DD 또는 ISO datetime)
  scheduleId?: string;
  onSuccess?: () => void;
}

export const useCreateExpenseForm = ({ tripId, date, scheduleId, onSuccess }: UseCreateExpenseFormProps) => {
  const router = useRouter();

  // ✅ CURRENCY_POLICY: 여행의 baseCurrency를 경비 기본 통화로 사용
  const { data: trips = [] } = useGetTrips();
  const selectedTrip = trips.find((trip) => trip.id === tripId);
  const defaultCurrency = selectedTrip?.baseCurrency || 'USD';

  // Navigation 입력만 호환 처리한다. 잘못된 입력은 폼에서 날짜를 다시 선택하게 한다.
  const initialDate = date ? expenseDateInput.safeParse(date) : undefined;
  const defaultDate = date
    ? (initialDate?.success ? initialDate.data : '')
    : formatISOToLocalDate(new Date().toISOString());

  const form = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseFormSchema),
    defaultValues: {
      title: '',
      amount: '',
      currency: defaultCurrency, // ✅ 여행의 기본 통화 사용
      category: '',
      date: defaultDate, // YYYY-MM-DD
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
        hasReceipt: false, // TODO: 영수증 업로드 기능 구현 예정
        receiptUrl: null, // TODO: 영수증 업로드 기능 구현 예정
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
