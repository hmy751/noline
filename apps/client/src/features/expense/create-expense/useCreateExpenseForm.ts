import { expenseDateInput } from '@repo/schema/requests/expense';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCreateExpense } from '@/entities/expense';
import { useGetTrips } from '@/entities/trip';
import { generateId } from '@/shared/services/id/ulid';
import { getTimeZoneToday, formatISOToTimeZoneDate } from '@/shared/lib/datetime';
import { useTripSchedulesReadQuery } from '@/features/schedule/read-schedules';
import { expenseSubmitError } from '../expense-form/submit-error';
import { createExpenseFormSchema, type CreateExpenseFormData } from './schema';

interface UseCreateExpenseFormProps {
  tripId: string;
  date?: string; // 경비 날짜 (YYYY-MM-DD 또는 ISO datetime)
  scheduleId?: string;
  onSuccess?: () => void;
}

export const useCreateExpenseForm = ({ tripId, date, scheduleId, onSuccess }: UseCreateExpenseFormProps) => {
  const router = useRouter();

  const { data: trips = [] } = useGetTrips();
  const selectedTrip = trips.find((trip) => trip.id === tripId);
  const schedulesRead = useTripSchedulesReadQuery(tripId, { enabled: !!scheduleId });
  const linkedSchedule =
    schedulesRead.view.kind === 'ready'
      ? schedulesRead.view.data.find((schedule) => schedule.id === scheduleId)
      : undefined;
  const defaultCurrency = selectedTrip?.baseCurrency || 'USD';

  // Navigation 입력만 호환 처리한다. 잘못된 입력은 폼에서 날짜를 다시 선택하게 한다.
  const initialDate = date ? expenseDateInput.safeParse(date) : undefined;
  const defaultDate = date
    ? initialDate?.success
      ? initialDate.data
      : ''
    : !selectedTrip?.timeZone
      ? ''
      : linkedSchedule
        ? formatISOToTimeZoneDate(linkedSchedule.scheduledAt, selectedTrip.timeZone)
        : scheduleId && schedulesRead.view.kind !== 'ready'
          ? ''
          : getTimeZoneToday(selectedTrip.timeZone);

  const form = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseFormSchema),
    defaultValues: {
      title: '',
      amount: '',
      currency: defaultCurrency,
      category: '',
      date: defaultDate,
      scheduleId: scheduleId || undefined,
    },
    mode: 'onChange',
  });

  // 여행 조회가 늦게 도착해도 사용자가 편집한 날짜는 덮어쓰지 않는다.
  useEffect(() => {
    if (!date && defaultDate && !form.getFieldState('date').isDirty && !form.getValues('date')) {
      form.setValue('date', defaultDate);
    }
  }, [date, defaultDate, form]);

  // React가 다시 렌더링되기 전의 연속 탭도 차단한다. 표시 상태는 form이 관리한다.
  const submitting = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync: createExpense } = useCreateExpense();

  const onValid = async (data: CreateExpenseFormData) => {
    setSubmitError(null);
    await createExpense({
      id: generateId(),
      tripId,
      title: data.title,
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      date: data.date,
      scheduleId: data.scheduleId || null,
      hasReceipt: false,
      receiptUrl: null,
    });
    onSuccess?.();
    router.back();
  };

  const handleSubmit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await form.handleSubmit(onValid)();
    } catch (error) {
      setSubmitError(expenseSubmitError(error));
    } finally {
      submitting.current = false;
    }
  };

  return {
    form,
    isPending: form.formState.isSubmitting,
    submitError,
    canLeave: () => !submitting.current,
    onSubmit: handleSubmit,
  };
};
