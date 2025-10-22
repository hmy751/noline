import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateSchedule } from '@/entities/schedule';
import { createScheduleFormSchema, type CreateScheduleFormData } from './schema';

type UseCreateScheduleFormProps = {
  tripId: string;
  onSuccess?: () => void;
};

export const useCreateScheduleForm = ({ tripId, onSuccess }: UseCreateScheduleFormProps) => {
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const form = useForm<CreateScheduleFormData>({
    resolver: zodResolver(createScheduleFormSchema),
    defaultValues: {
      title: '',
      location: '',
      address: '',
      date: '',
      time: '09:00',
    },
    mode: 'onChange',
  });

  const { mutate: createSchedule, isPending } = useCreateSchedule();

  const handleShowDatePicker = () => {
    setDatePickerVisible(true);
  };

  const handleShowTimePicker = () => {
    setTimePickerVisible(true);
  };

  const handleSelectDate = (date: string) => {
    form.setValue('date', date, { shouldValidate: true });
    setDatePickerVisible(false);
  };

  const handleSelectTime = (time: string) => {
    form.setValue('time', time, { shouldValidate: true });
    setTimePickerVisible(false);
  };

  const onValid = (data: CreateScheduleFormData) => {
    // 날짜와 시간을 ISO 8601 timestamp로 변환
    const startTime = new Date(`${data.date}T${data.time}:00.000Z`).toISOString();

    createSchedule(
      {
        tripId,
        title: data.title,
        location: data.location,
        startTime,
        order: 0, // TODO: order 계산 로직 추가
      },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
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
    datePickerVisible,
    timePickerVisible,
    handleShowDatePicker,
    handleShowTimePicker,
    handleSelectDate,
    handleSelectTime,
    onSubmit: form.handleSubmit(onValid, onInvalid),
  };
};
