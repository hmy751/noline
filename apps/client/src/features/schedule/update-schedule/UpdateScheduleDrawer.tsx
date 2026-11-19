import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';

import { Drawer, Pressable } from '@repo/ui';

import { useAutoDownloadRoutes } from '@/entities/route';
import { useUpdateSchedule } from '@/entities/schedule';
import { APIError } from '@/shared/api/errors';
import { DatePicker, PolicyErrorDisplay } from '@/shared/components';
import { Field, TimeField } from '@/shared/components/Form';
import { combineDateTimeInTimeZoneToISO } from '@/shared/lib/datetime';
import { buildChangedGroupPatch } from '@/shared/lib/edit-fields';
import { useAppPolicy } from '@/shared/policy';
import { ConfirmedUpdateError } from '@/shared/services/edit-stamp/errors';

import { LocationSearchModal } from './LocationSearchModal';
import type { UpdateLocationSelection } from './place-search-compatibility';
import { makeScheduleUpdateFormSchema, type ScheduleUpdateFormData } from './schema';

export type UpdateScheduleDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  timeZone?: string | null;
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
export const UpdateScheduleDrawer = ({ isOpen, onClose, scheduleData, timeZone }: UpdateScheduleDrawerProps) => {
  return isOpen && scheduleData ? (
    <ScheduleEditForm key={scheduleData.id} scheduleData={scheduleData} timeZone={timeZone} onClose={onClose} />
  ) : null;
};

type ScheduleEditFormProps = {
  scheduleData: NonNullable<UpdateScheduleDrawerProps['scheduleData']>;
  timeZone: UpdateScheduleDrawerProps['timeZone'];
  onClose: () => void;
};

const ScheduleEditForm = ({
  scheduleData: currentSchedule,
  timeZone: currentTimeZone,
  onClose,
}: ScheduleEditFormProps) => {
  // 데이터와 시간대는 하나의 편집 회차에서 함께 해석한다. 배경 조회로 재해석하지 않는다.
  const [{ scheduleData, timeZone }] = useState({
    scheduleData: currentSchedule,
    timeZone: currentTimeZone,
  });
  const form = useForm<ScheduleUpdateFormData>({
    resolver: zodResolver(makeScheduleUpdateFormSchema(timeZone, scheduleData)),
    defaultValues: {
      title: scheduleData.title,
      date: scheduleData.date,
      time: scheduleData.time,
    },
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = form;

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isLocationSearchVisible, setLocationSearchVisible] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<UpdateLocationSelection | null>(null);

  const { mutateAsync: updateSchedule } = useUpdateSchedule();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const { mutate: autoDownloadRoutes } = useAutoDownloadRoutes();

  const policy = useAppPolicy(scheduleData.tripId);

  const handleDateSelect = (selectedDate: string) => {
    setValue('date', selectedDate, { shouldValidate: true });
    setDatePickerVisible(false);
  };

  const handleLocationSelect = (location: UpdateLocationSelection) => {
    setSelectedLocation(location);
    setLocationSearchVisible(false);
  };

  const handleValidSubmit = async (data: ScheduleUpdateFormData) => {
    if (!isMounted.current) {
      return;
    }

    // 바꾸지 않은 시각은 재조합하지 않아 초·밀리초와 DST 중복 시각의 원본을 보존한다.
    const hasTimeChanged = data.date !== scheduleData.date || data.time !== scheduleData.time;

    if (hasTimeChanged && !timeZone) {
      return;
    }

    const scheduledAt =
      hasTimeChanged && timeZone ? combineDateTimeInTimeZoneToISO(data.date, data.time, timeZone) : undefined;

    const locationData = selectedLocation
      ? {
          location: selectedLocation.name,
          address: selectedLocation.address,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }
      : {};

    const patch = buildChangedGroupPatch('schedules', scheduleData, { title: data.title, ...locationData });

    if (scheduledAt !== undefined) {
      patch.scheduledAt = scheduledAt;
    }

    if (!Object.keys(patch).length) {
      onClose();
      return;
    }

    await updateSchedule({
      id: scheduleData.id,
      tripId: scheduleData.tripId,
      data: patch,
    });

    if ('scheduledAt' in patch || 'latitude' in patch || 'longitude' in patch) {
      autoDownloadRoutes({ tripId: scheduleData.tripId });
    }

    // 폼이 해제되어도 요청은 끝날 수 있다. 그 뒤에는 성공 안내나 닫기를 실행하지 않는다.
    if (!isMounted.current) {
      return;
    }

    Alert.alert('성공', '일정이 수정되었습니다.');

    onClose();
  };

  const handleInvalidSubmit = () => {
    if (!isMounted.current) {
      return;
    }

    Alert.alert('오류', '입력한 정보를 확인해주세요.');
  };

  const handleSave = async () => {
    try {
      await handleSubmit(handleValidSubmit, handleInvalidSubmit)();
    } catch (error) {
      if (isMounted.current) {
        Alert.alert(
          '수정 확인',
          error instanceof APIError || error instanceof ConfirmedUpdateError
            ? error.message
            : '일정 수정에 실패했습니다. 입력은 유지되어 있어요.',
        );
      }
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      Alert.alert('저장 중입니다', '저장이 끝난 뒤 닫을 수 있어요.');
      return;
    }

    onClose();
  };

  if (!policy.schedule.update.allowed) {
    return (
      <Drawer isOpen onClose={handleClose} title='일정 수정'>
        <PolicyErrorDisplay policy={policy.schedule.update} variant='block' />
      </Drawer>
    );
  }

  return (
    <Drawer isOpen onClose={handleClose} title='일정 수정'>
      <View className='gap-md'>
        {policy.schedule.update.mode === 'manual-only' && policy.schedule.update.reason && (
          <PolicyErrorDisplay policy={policy.schedule.update} variant='banner' />
        )}

        <Text className='text-label text-muted-foreground'>
          {timeZone
            ? `여행 현지 시간 (${timeZone})`
            : '시간대 확인 필요 · UTC 기준 · 날짜·시간 변경은 여행 편집에서 시간대를 확인한 뒤 가능합니다.'}
        </Text>

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
                        onPress: (text?: string) => {
                          if (text) {
                            onChange(text);
                          }
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
        <TimeField
          form={form}
          name='time'
          title='시간'
          renderTrigger={(value, open) => (
            <TouchableOpacity
              className='h-11 flex-row items-center rounded-md border border-input bg-background px-sm'
              onPress={open}
            >
              <Clock size={16} color='#808080' />
              <Text className='text-body text-foreground ml-xs'>{value}</Text>
            </TouchableOpacity>
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
            <Pressable variant='default' onPress={handleSave} disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Pressable>
          </View>
          <View className='flex-1'>
            <Pressable variant='outline' onPress={handleClose}>
              취소
            </Pressable>
          </View>
        </View>
      </View>

      {/* DatePicker Modal */}
      {isDatePickerVisible && (
        <DatePicker
          visible={isDatePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          onSelectDate={handleDateSelect}
          selectedDate={watch('date')}
        />
      )}

      {/* LocationSearch Modal */}
      {isLocationSearchVisible && (
        <LocationSearchModal
          isOpen={isLocationSearchVisible}
          onClose={() => setLocationSearchVisible(false)}
          onSelectLocation={handleLocationSelect}
          tripId={scheduleData.tripId}
          initialQuery={scheduleData.location || ''}
        />
      )}
    </Drawer>
  );
};
