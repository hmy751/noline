import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateSchedule, useGetSchedules, type Schedule } from '@/entities/schedule';
import { useAutoDownloadRoutes } from '@/entities/route';
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
  const { mutate: autoDownloadRoutes } = useAutoDownloadRoutes();
  const { data: schedules = [] } = useGetSchedules(tripId);

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
    // ✅ Client-Side ID: Generate ULID on client
    const id = generateId();

    // ✅ date + time → ISO string with timezone
    const scheduledAt = combineDateTimeToISO(data.date, data.time);

    createSchedule(
      {
        id, // ✅ Echo: client-generated ID
        tripId,
        title: data.title,
        location: data.location,
        address: data.address || selectedLocation?.address || null,
        scheduledAt, // ISO string
        latitude: selectedLocation?.latitude || null,
        longitude: selectedLocation?.longitude || null,
      },
      {
        onSuccess: () => {
          console.log('✅ Schedule created successfully');

          // 경로 자동 다운로드 (새 일정 포함)
          setTimeout(() => {
            const newSchedule = {
              id,
              latitude: selectedLocation?.latitude ? parseFloat(String(selectedLocation.latitude)) : undefined,
              longitude: selectedLocation?.longitude ? parseFloat(String(selectedLocation.longitude)) : undefined,
            };

            // scheduledAt 기준으로 정렬된 전체 일정 목록
            const allSchedules = [
              ...schedules.map((s: Schedule) => ({
                id: s.id,
                latitude: s.latitude ? parseFloat(s.latitude) : undefined,
                longitude: s.longitude ? parseFloat(s.longitude) : undefined,
                scheduledAt: s.scheduledAt,
              })),
              {
                ...newSchedule,
                scheduledAt,
              },
            ]
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .map(({ id: scheduleId, latitude, longitude }) => ({ id: scheduleId, latitude, longitude }));

            autoDownloadRoutes({ tripId, schedules: allSchedules });
          }, 500);

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
