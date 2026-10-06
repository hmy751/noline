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
import { formatISOToTimeZoneDate, getTimeZoneDayStartISO } from '@/shared/lib/datetime';
import { useCityTimeZone } from '../create-trip/useCityTimeZone';
import { useAppPolicy } from '@/shared/policy';
import { PolicyErrorDisplay } from '@/shared/components/ErrorBoundary/PolicyErrorDisplay';

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
  const updatePolicy = useAppPolicy(trip?.id).trip.update;
  const [resolveRequested, setResolveRequested] = React.useState(false);
  const latitude = Number(trip?.latitude);
  const longitude = Number(trip?.longitude);
  const hasCoordinates =
    trip?.latitude != null && trip?.longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude);
  const cityTimeZone = useCityTimeZone(
    { id: trip?.cityId ?? 0, latitude, longitude },
    isOpen && resolveRequested && !trip?.timeZone && hasCoordinates,
  );
  const editingTimeZoneRef = React.useRef(trip?.timeZone);
  const timeZone = editingTimeZoneRef.current;
  const { canResolveTimeZone } = cityTimeZone;
  const resolvedTimeZone = resolveRequested ? cityTimeZone.data : undefined;
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { defaultValues },
  } = useForm<TripEditFormData>({
    resolver: zodResolver(tripEditFormSchema),
    defaultValues: {
      startDate: trip?.startDate ? formatISOToTimeZoneDate(trip.startDate, trip.timeZone ?? 'UTC') : '', // ✅ ISO string → 날짜만
      endDate: trip?.endDate ? formatISOToTimeZoneDate(trip.endDate, trip.timeZone ?? 'UTC') : '',
    },
    mode: 'onChange',
  });

  const [currentPicker, setCurrentPicker] = React.useState<'start' | 'end' | null>(null);
  const [pickerVisible, setPickerVisible] = React.useState(false);

  const { mutate: updateTrip, isPending: isUpdating } = useUpdateTrip();
  const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip();

  // 같은 여행의 query 갱신은 편집 중 초안을 덮어쓰지 않는다.
  useEffect(() => {
    if (trip && isOpen) {
      editingTimeZoneRef.current = trip.timeZone;
      reset({
        startDate: formatISOToTimeZoneDate(trip.startDate, trip.timeZone ?? 'UTC'),
        endDate: formatISOToTimeZoneDate(trip.endDate, trip.timeZone ?? 'UTC'),
      });
      setResolveRequested(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, isOpen, reset]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${year}. ${Number(month)}. ${Number(day)}.`;
  };

  // 날짜 선택 핸들러
  const handleShowPicker = (pickerType: 'start' | 'end') => {
    if (!timeZone) return;
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
    if (!trip || !updatePolicy.allowed || isUpdating) return;

    const startChanged = data.startDate !== defaultValues?.startDate;
    const endChanged = data.endDate !== defaultValues?.endDate;

    if (!timeZone) {
      setError('startDate', { message: '여행 시간대를 먼저 확인해주세요.' });
      return;
    }

    let dates = {};

    try {
      dates = {
        ...(startChanged ? { startDate: getTimeZoneDayStartISO(data.startDate, timeZone) } : {}),
        ...(endChanged ? { endDate: getTimeZoneDayStartISO(data.endDate, timeZone) } : {}),
      };
    } catch (error) {
      setError('startDate', { message: error instanceof Error ? error.message : '날짜를 다시 선택해주세요.' });
      return;
    }

    updateTrip(
      {
        id: trip.id,
        data: dates,
      },
      {
        onSuccess: () => {
          reset(data);
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
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title='여행 편집'
        childrenOverlay={
          pickerVisible ? (
            <DatePicker
              visible={pickerVisible}
              onClose={() => setPickerVisible(false)}
              onSelectDate={handleSelectDate}
            />
          ) : null
        }
      >
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

          {!updatePolicy.allowed && <PolicyErrorDisplay policy={updatePolicy} variant='inline' />}
          <View className='gap-xs'>
            <Text className='text-label text-muted-foreground'>
              {timeZone ? `여행 현지 시간 (${timeZone})` : '시간대 확인 필요 · UTC 기준'}
            </Text>
            {!timeZone && trip.timeZone && (
              <Text>여행 시간대가 갱신되었습니다. 닫고 다시 열어 날짜를 수정해주세요.</Text>
            )}
            {!trip.timeZone && (
              <>
                <Text>기존 저장 시각을 유지하면서 도시 시간대를 확인합니다.</Text>
                {resolvedTimeZone && <Text>확인한 도시 시간대: {resolvedTimeZone}</Text>}
                {!hasCoordinates ? (
                  <Text>도시 좌표가 없어 시간대를 확인할 수 없습니다.</Text>
                ) : (
                  <Pressable
                    variant='outline'
                    disabled={!canResolveTimeZone || cityTimeZone.isFetching}
                    onPress={() => {
                      if (resolveRequested) cityTimeZone.refetch();
                      else setResolveRequested(true);
                    }}
                  >
                    {cityTimeZone.isFetching
                      ? '시간대 확인 중...'
                      : cityTimeZone.isError
                        ? '시간대 다시 확인'
                        : '도시 시간대 확인'}
                  </Pressable>
                )}
                {resolvedTimeZone && (
                  <Pressable
                    variant='default'
                    disabled={isUpdating || !updatePolicy.allowed}
                    onPress={() => {
                      if (isUpdating || !updatePolicy.allowed) return;
                      updateTrip(
                        { id: trip.id, data: { timeZone: resolvedTimeZone } },
                        {
                          onSuccess: () => {
                            Alert.alert('성공', '여행 시간대를 확인했습니다. 저장된 시각은 유지됩니다.');
                            onClose();
                          },
                          onError: () => Alert.alert('오류', '시간대 저장에 실패했습니다. 다시 시도해주세요.'),
                        },
                      );
                    }}
                  >
                    시간대 적용
                  </Pressable>
                )}
                {cityTimeZone.isError && <Text>시간대를 확인하지 못했어요. 입력한 내용은 유지됩니다.</Text>}
                {!canResolveTimeZone && <Text>시간대 확인에는 인터넷 연결이 필요합니다.</Text>}
              </>
            )}
            {!trip.timeZone && <Text>시간대를 적용한 뒤 여행 날짜를 수정할 수 있습니다.</Text>}
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
                          disabled={!timeZone}
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
                          disabled={!timeZone}
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
              onPress={handleSubmit(onValid, onInvalid)}
              disabled={isUpdating || !timeZone || !updatePolicy.allowed}
            >
              {isUpdating ? '저장 중...' : '저장'}
            </Pressable>

            {/* 삭제 버튼 */}
            <Pressable variant='destructive' onPress={handleDelete} disabled={isDeleting}>
              {isDeleting ? '삭제 중...' : '삭제'}
            </Pressable>

            {/* 취소 버튼 */}
            <Pressable variant='outline' onPress={onClose}>
              취소
            </Pressable>
          </View>
        </View>
      </Drawer>
    </>
  );
};
