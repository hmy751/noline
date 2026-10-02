import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createScheduleFormSchema, type CreateScheduleFormData } from './schema';
import type { Location } from './types';

/** 초안 값·장소 좌표·검증과 입력 보조 UI만 소유한다. 네트워크 변화로 초기화하지 않는다. */
export function useCreateScheduleForm({ initialDate = '' }: { initialDate?: string } = {}) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const form = useForm<CreateScheduleFormData>({
    resolver: zodResolver(createScheduleFormSchema),
    defaultValues: { title: '', location: '', address: '', date: initialDate, time: '09:00' },
    mode: 'onChange',
  });

  const selectLocation = (place: Location) => {
    setSelectedLocation(place);
    if (!form.getFieldState('title').isDirty) form.setValue('title', place.name);
    form.setValue('location', place.name, { shouldValidate: true });
    form.setValue('address', place.address);
  };
  const editLocationManually = () => setSelectedLocation(null);

  return {
    form,
    selectedLocation,
    selectLocation,
    editLocationManually,
    datePickerVisible,
    timePickerVisible,
    handleShowDatePicker: () => setDatePickerVisible(true),
    handleShowTimePicker: () => setTimePickerVisible(true),
    handleSelectDate: (date: string) => {
      form.setValue('date', date, { shouldValidate: true });
      setDatePickerVisible(false);
    },
    handleSelectTime: (time: string) => {
      form.setValue('time', time, { shouldValidate: true });
      setTimePickerVisible(false);
    },
  };
}
