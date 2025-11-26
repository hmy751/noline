import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { Drawer, Pressable } from '@repo/ui';
import { DatePicker, TimePicker } from '@/shared/components';
import { Field } from '@/shared/components/Form';
import { useUpdateSchedule, useGetSchedules } from '@/entities/schedule';
import { useAutoDownloadRoutes } from '@/entities/route';
import { useAppPolicy } from '@/shared/policy';
import { scheduleUpdateFormSchema, type ScheduleUpdateFormData } from './schema';
import { combineDateTimeToISO } from '@/shared/lib/datetime';
import { LocationSearchModal } from './LocationSearchModal';
import type { Location } from '@/features/schedule/create-schedule';
import type { Schedule } from '@/shared/db/schema';

export type UpdateScheduleDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  scheduleData?: {
    id: string;
    tripId: string;
    title: string;
    date: string;
    time: string;
    location?: string;
    address?: string | null;
    latitude?: string | null;
    longitude?: string | null;
  } | null;
};

/**
 * 일정 수정 드로어 컴포넌트
 * 제목, 날짜와 시간을 수정할 수 있는 UI
 */
export const UpdateScheduleDrawer = ({ isOpen, onClose, scheduleData }: UpdateScheduleDrawerProps) => {
  // react-hook-form 설정
  const { control, handleSubmit, setValue } = useForm<ScheduleUpdateFormData>({
    resolver: zodResolver(scheduleUpdateFormSchema),
    defaultValues: {
      title: scheduleData?.title || '',
      date: scheduleData?.date || '',
      time: scheduleData?.time || '',
    },
    mode: 'onChange',
  });

  // Picker visibility state
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [locationSearchVisible, setLocationSearchVisible] = useState(false);

  // 선택된 장소 (재검색 시)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Mutations and queries
  const { mutate: updateSchedule, isPending } = useUpdateSchedule();
  const { mutate: autoDownloadRoutes } = useAutoDownloadRoutes();
  const { data: schedules = [] } = useGetSchedules(scheduleData?.tripId || '');

  // Policy 체크
  const policy = useAppPolicy(scheduleData?.tripId);

  // scheduleData가 변경되면 폼 값 및 상태 초기화
  useEffect(() => {
    if (scheduleData) {
      setValue('title', scheduleData.title);
      setValue('date', scheduleData.date);
      setValue('time', scheduleData.time);
      setSelectedLocation(null); // 장소 재검색 결과 초기화
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleData?.id]);

  // Handlers
  const handleDateSelect = (selectedDate: string) => {
    setValue('date', selectedDate, { shouldValidate: true });
    setDatePickerVisible(false);
  };

  const handleTimeSelect = (selectedTime: string) => {
    setValue('time', selectedTime, { shouldValidate: true });
    setTimePickerVisible(false);
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setLocationSearchVisible(false);
  };

  // 저장 핸들러 (유효성 검사는 zodResolver가 처리)
  const onValid = (data: ScheduleUpdateFormData) => {
    if (!scheduleData) return;

    // ✅ TIME_ARCHITECTURE_GUIDE: UI → Logic 변환
    // "2024-03-15" + "14:30" → "2024-03-15T14:30:00.000Z"
    const scheduledAt = combineDateTimeToISO(data.date, data.time);

    // 장소 재검색한 경우 location 정보 추가
    const locationData = selectedLocation
      ? {
          location: selectedLocation.name,
          address: selectedLocation.address,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }
      : {};

    updateSchedule(
      {
        id: scheduleData.id,
        data: {
          title: data.title,
          scheduledAt, // ISO 8601 format
          ...locationData,
        },
      },
      {
        onSuccess: () => {
          Alert.alert('성공', '일정이 수정되었습니다.');

          // 경로 재다운로드 (날짜/시간 변경으로 순서가 바뀔 수 있음)
          setTimeout(() => {
            const allSchedules = schedules
              .map((s: Schedule) => ({
                id: s.id,
                latitude: s.latitude ? parseFloat(s.latitude) : undefined,
                longitude: s.longitude ? parseFloat(s.longitude) : undefined,
                scheduledAt: s.id === scheduleData.id ? scheduledAt : s.scheduledAt,
              }))
              .sort(
                (a: { scheduledAt: string }, b: { scheduledAt: string }) =>
                  new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
              )
              .map(
                ({
                  id: scheduleId,
                  latitude,
                  longitude,
                }: {
                  id: string;
                  latitude: number | undefined;
                  longitude: number | undefined;
                }) => ({ id: scheduleId, latitude, longitude }),
              );

            autoDownloadRoutes({ tripId: scheduleData.tripId, schedules: allSchedules });
          }, 500);

          onClose();
        },
        onError: () => {
          Alert.alert('오류', '일정 수정에 실패했습니다.');
        },
      },
    );
  };

  const onInvalid = () => {
    Alert.alert('오류', '입력한 정보를 확인해주세요.');
  };

  if (!scheduleData) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title='일정 수정'>
      <View className='gap-md'>
        {/* 설명 */}
        <Text className='text-body text-muted-foreground'>{scheduleData.title}의 날짜와 시간을 수정합니다</Text>

        {/* 제목 필드 */}
        <Controller
          control={control}
          name='title'
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Field>
              <Field.Title>제목</Field.Title>
              <Field.ElementsBox>
                <TouchableOpacity
                  className='h-11 rounded-md border border-input bg-background px-sm justify-center'
                  onPress={() => {
                    // TextInput으로 변경하거나 모달로 수정
                    Alert.prompt('제목 수정', '새로운 제목을 입력하세요', [
                      { text: '취소', style: 'cancel' },
                      {
                        text: '확인',
                        onPress: (text) => {
                          if (text) onChange(text);
                        },
                      },
                    ]);
                  }}
                >
                  <Text className='text-body text-foreground'>{value || '제목을 입력하세요'}</Text>
                </TouchableOpacity>
              </Field.ElementsBox>
              {error && <Field.Message>{error.message}</Field.Message>}
            </Field>
          )}
        />

        {/* 날짜 필드 */}
        <Controller
          control={control}
          name='date'
          render={({ field: { value }, fieldState: { error } }) => (
            <Field>
              <Field.Title>날짜</Field.Title>
              <Field.ElementsBox>
                <TouchableOpacity
                  className='h-11 flex-row items-center rounded-md border border-input bg-background px-sm'
                  onPress={() => setDatePickerVisible(true)}
                >
                  <Calendar size={16} color='#808080' />
                  <Text className='text-body text-foreground ml-xs'>{value}</Text>
                </TouchableOpacity>
              </Field.ElementsBox>
              {error && <Field.Message>{error.message}</Field.Message>}
            </Field>
          )}
        />

        {/* 시간 필드 */}
        <Controller
          control={control}
          name='time'
          render={({ field: { value }, fieldState: { error } }) => (
            <Field>
              <Field.Title>시간</Field.Title>
              <Field.ElementsBox>
                <TouchableOpacity
                  className='h-11 flex-row items-center rounded-md border border-input bg-background px-sm'
                  onPress={() => setTimePickerVisible(true)}
                >
                  <Clock size={16} color='#808080' />
                  <Text className='text-body text-foreground ml-xs'>{value}</Text>
                </TouchableOpacity>
              </Field.ElementsBox>
              {error && <Field.Message>{error.message}</Field.Message>}
            </Field>
          )}
        />

        {/* 장소 재검색 (좌표 없을 때만 표시) */}
        {!scheduleData.latitude && scheduleData.location && (
          <View className='bg-yellow-50 px-sm py-sm rounded-md border border-yellow-200'>
            <View className='flex-row items-center justify-between'>
              <View className='flex-1'>
                <Text className='text-small font-medium text-yellow-800 mb-3xs'>⚠️ 좌표가 없습니다</Text>
                <Text className='text-small text-yellow-700'>{scheduleData.location}</Text>
              </View>
              {policy.service.searchMode === 'api' && (
                <TouchableOpacity
                  className='ml-sm px-sm py-xs rounded-md bg-yellow-200'
                  onPress={() => setLocationSearchVisible(true)}
                >
                  <View className='flex-row items-center gap-xs'>
                    <MapPin size={14} color='#D97706' />
                    <Text className='text-small font-medium text-yellow-800'>검색</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* 장소 재검색 결과 (선택한 경우) */}
        {selectedLocation && (
          <View className='bg-green-50 px-sm py-sm rounded-md border border-green-200'>
            <View className='flex-row items-center'>
              <MapPin size={16} color='#22C55E' />
              <View className='flex-1 ml-xs'>
                <Text className='text-small font-medium text-green-800'>{selectedLocation.name}</Text>
                <Text className='text-small text-green-600'>{selectedLocation.address}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 버튼 영역 */}
        <View className='flex-row gap-sm mt-md'>
          <View className='flex-1'>
            <Pressable variant='default' onPress={handleSubmit(onValid, onInvalid)} disabled={isPending}>
              {isPending ? '저장 중...' : '저장'}
            </Pressable>
          </View>
          <View className='flex-1'>
            <Pressable variant='outline' onPress={onClose} disabled={isPending}>
              취소
            </Pressable>
          </View>
        </View>
      </View>

      {/* DatePicker Modal */}
      {datePickerVisible && (
        <DatePicker
          visible={datePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          onSelectDate={handleDateSelect}
        />
      )}

      {/* TimePicker Modal */}
      {timePickerVisible && (
        <TimePicker
          visible={timePickerVisible}
          onClose={() => setTimePickerVisible(false)}
          onSelectTime={handleTimeSelect}
          initialTime={scheduleData.time}
        />
      )}

      {/* LocationSearch Modal */}
      {locationSearchVisible && scheduleData && (
        <LocationSearchModal
          isOpen={locationSearchVisible}
          onClose={() => setLocationSearchVisible(false)}
          onSelectLocation={handleLocationSelect}
          tripId={scheduleData.tripId}
          initialQuery={scheduleData.location || ''}
        />
      )}
    </Drawer>
  );
};
