import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateSchedule } from '@/entities/schedule';
import { createScheduleFormSchema, type CreateScheduleFormData } from './schema';
import { combineDateTimeToISO } from '@/shared/lib/datetime';
import { generateId } from '@/shared/services/id/ulid';
import type { Location } from './types';

type UseCreateScheduleFormProps = {
  tripId: string;
  selectedLocation: Location | null;
  onSuccess?: () => void;
};

export const useCreateScheduleForm = ({ tripId, selectedLocation, onSuccess }: UseCreateScheduleFormProps) => {
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

  // 장소 선택 시 폼 값 자동 설정
  useEffect(() => {
    if (selectedLocation) {
      form.setValue('title', selectedLocation.name);
      form.setValue('location', selectedLocation.name);
      form.setValue('address', selectedLocation.address);
    }
  }, [selectedLocation, form]);

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
    // ✅ Echo Protocol: Generate ULID on client
    const id = generateId();

    // ✅ date + time → ISO string with timezone
    const scheduledAt = combineDateTimeToISO(data.date, data.time);

    createSchedule(
      {
        id, // ✅ Echo: client-generated ID
        tripId,
        title: data.title,
        location: data.location,
        address: selectedLocation?.address || null,
        scheduledAt, // ISO string
        latitude: selectedLocation?.latitude || null,
        longitude: selectedLocation?.longitude || null,
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
