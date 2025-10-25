import React, { useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar } from 'lucide-react-native';
import { Drawer, Pressable } from '@repo/ui';
import DatePicker from '@/shared/components/DatePicker';
import { Field } from '@/shared/components/Form';
import { type TripData, useUpdateTrip, useDeleteTrip } from '@/entities/trip';
import { tripEditFormSchema, type TripEditFormData } from './schema';
import { formatISOToLocalDate, dateToISODateTime } from '@/shared/lib/datetime';

export type EditTripDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  trip: TripData | null;
};

/**
 * 메인 여행 편집 Drawer
 * 날짜 수정 및 삭제 기능 제공
 */
export const EditTripDrawer = ({ isOpen, onClose, trip }: EditTripDrawerProps) => {
  const { control, handleSubmit, setValue } = useForm<TripEditFormData>({
    resolver: zodResolver(tripEditFormSchema),
    defaultValues: {
      startDate: trip?.startDate ? formatISOToLocalDate(trip.startDate) : '', // ✅ ISO string → 날짜만
      endDate: trip?.endDate ? formatISOToLocalDate(trip.endDate) : '',
    },
    mode: 'onChange',
  });

  const [currentPicker, setCurrentPicker] = React.useState<'start' | 'end' | null>(null);
  const [pickerVisible, setPickerVisible] = React.useState(false);

  const { mutate: updateTrip, isPending: isUpdating } = useUpdateTrip();
  const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip();

  // trip이 변경되면 폼 값 업데이트
  useEffect(() => {
    if (trip) {
      setValue('startDate', trip.startDate || '');
      setValue('endDate', trip.endDate || '');
    }
  }, [trip, setValue]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  };

  // 날짜 선택 핸들러
  const handleShowPicker = (pickerType: 'start' | 'end') => {
    setCurrentPicker(pickerType);
    setPickerVisible(true);
  };

  const handleSelectDate = (date: string) => {
    if (currentPicker === 'start') {
      setValue('startDate', date, { shouldValidate: true });
    } else {
      setValue('endDate', date, { shouldValidate: true });
    }
    setPickerVisible(false);
  };

  // 저장 핸들러 (유효성 검사는 zodResolver가 처리)
  const onValid = (data: TripEditFormData) => {
    if (!trip) return;

    updateTrip(
      {
        id: trip.id,
        data: {
          startDate: dateToISODateTime(data.startDate), // ✅ ISO datetime 변환
          endDate: dateToISODateTime(data.endDate), // ✅ ISO datetime 변환
        },
      },
      {
        onSuccess: () => {
          Alert.alert('성공', '여행 정보가 수정되었습니다.');
          onClose();
        },
        onError: () => {
          Alert.alert('오류', '여행 정보 수정에 실패했습니다.');
        },
      },
    );
  };

  const onInvalid = () => {
    Alert.alert('오류', '입력한 정보를 확인해주세요.');
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (!trip) return;

    Alert.alert('여행 삭제', '정말로 이 여행을 삭제하시겠습니까?\n모든 일정과 경비도 함께 삭제됩니다.', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deleteTrip(trip.id, {
            onSuccess: () => {
              Alert.alert('성공', '여행이 삭제되었습니다.');
              onClose();
            },
            onError: () => {
              Alert.alert('오류', '여행 삭제에 실패했습니다.');
            },
          });
        },
      },
    ]);
  };

  if (!trip) return null;

  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} title='여행 편집'>
        <View className='gap-md'>
          {/* 여행 정보 표시 */}
          <View>
            <Text className='text-title-medium text-foreground'>
              {trip.destination}, {trip.country}
            </Text>
            <Text className='text-label text-muted-foreground mt-2xs'>{trip.name}</Text>

            {/* 안내 메시지 */}
            <View className='rounded-lg bg-muted p-sm mt-sm'>
              <Text className='text-label text-muted-foreground'>
                여행지는 수정할 수 없습니다. 다른 여행지로 가려면 새로 만들어주세요.
              </Text>
            </View>
          </View>

          {/* 날짜 선택 섹션 */}
          <View className='gap-sm'>
            <Text className='text-title-medium text-foreground'>여행 기간</Text>
            <View className='flex-row gap-sm'>
              {/* 시작 날짜 */}
              <Controller
                control={control}
                name='startDate'
                render={({ field: { value }, fieldState: { error } }) => (
                  <View className='flex-1'>
                    <Field>
                      <Field.Title>시작일</Field.Title>
                      <Field.ElementsBox>
                        <TouchableOpacity
                          onPress={() => handleShowPicker('start')}
                          className='h-11 flex-row items-center justify-between rounded-lg border border-input bg-background px-md'
                        >
                          <Text className='text-body text-muted-foreground'>
                            {formatDate(value) || '연도. 월. 일.'}
                          </Text>
                          <Calendar size={16} className='text-muted-foreground' />
                        </TouchableOpacity>
                      </Field.ElementsBox>
                      {error && <Field.Message>{error.message}</Field.Message>}
                    </Field>
                  </View>
                )}
              />

              {/* 종료 날짜 */}
              <Controller
                control={control}
                name='endDate'
                render={({ field: { value }, fieldState: { error } }) => (
                  <View className='flex-1'>
                    <Field>
                      <Field.Title>종료일</Field.Title>
                      <Field.ElementsBox>
                        <TouchableOpacity
                          onPress={() => handleShowPicker('end')}
                          className='h-11 flex-row items-center justify-between rounded-lg border border-input bg-background px-md'
                        >
                          <Text className='text-body text-muted-foreground'>
                            {formatDate(value) || '연도. 월. 일.'}
                          </Text>
                          <Calendar size={16} className='text-muted-foreground' />
                        </TouchableOpacity>
                      </Field.ElementsBox>
                      {error && <Field.Message>{error.message}</Field.Message>}
                    </Field>
                  </View>
                )}
              />
            </View>
          </View>

          {/* 버튼 섹션 */}
          <View className='gap-sm mt-lg'>
            {/* 저장 버튼 */}
            <Pressable
              variant='default'
              className='w-full rounded-lg bg-primary py-md'
              onPress={handleSubmit(onValid, onInvalid)}
              disabled={isUpdating}
            >
              <Text className='text-body font-semibold text-primary-foreground text-center'>
                {isUpdating ? '저장 중...' : '저장'}
              </Text>
            </Pressable>

            {/* 삭제 버튼 */}
            <Pressable
              variant='destructive'
              className='w-full rounded-lg bg-destructive py-md'
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <Text className='text-body font-semibold text-destructive-foreground text-center'>
                {isDeleting ? '삭제 중...' : '삭제'}
              </Text>
            </Pressable>

            {/* 취소 버튼 */}
            <Pressable
              variant='outline'
              className='w-full rounded-lg border border-input bg-background py-md'
              onPress={onClose}
            >
              <Text className='text-body font-semibold text-foreground text-center'>취소</Text>
            </Pressable>
          </View>
        </View>
      </Drawer>

      {/* 날짜 선택 DatePicker */}
      <DatePicker visible={pickerVisible} onClose={() => setPickerVisible(false)} onSelectDate={handleSelectDate} />
    </>
  );
};
