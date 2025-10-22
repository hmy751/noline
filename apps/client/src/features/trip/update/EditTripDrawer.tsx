import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Drawer, Pressable, Label } from '@repo/ui';
import DatePicker from '@/shared/components/DatePicker';
import { TripData } from '../api';
import { useUpdateTrip } from '../current/useUpdateTrip';
import { useDeleteTrip } from '../current/useDeleteTrip';

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
  const [startDate, setStartDate] = useState(trip?.startDate || '');
  const [endDate, setEndDate] = useState(trip?.endDate || '');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { mutate: updateTrip, isPending: isUpdating } = useUpdateTrip();
  const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip();

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  };

  // 저장 핸들러
  const handleSave = () => {
    if (!trip) return;

    // 날짜 유효성 검증
    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert('오류', '시작 날짜는 종료 날짜보다 이전이어야 합니다.');
      return;
    }

    updateTrip(
      {
        id: trip.id,
        data: {
          startDate,
          endDate,
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

  // trip이 변경되면 날짜 업데이트
  React.useEffect(() => {
    if (trip) {
      setStartDate(trip.startDate || '');
      setEndDate(trip.endDate || '');
    }
  }, [trip]);

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
              <View className='flex-1'>
                <Label className='mb-2xs text-label text-muted-foreground'>시작일</Label>
                <Pressable
                  variant='outline'
                  className='flex-row items-center justify-between rounded-lg border border-input bg-background px-md py-sm'
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text className='text-body text-muted-foreground'>{formatDate(startDate) || '연도. 월. 일.'}</Text>
                  <Text className='text-body text-muted-foreground'>📅</Text>
                </Pressable>
              </View>

              {/* 종료 날짜 */}
              <View className='flex-1'>
                <Label className='mb-2xs text-label text-muted-foreground'>종료일</Label>
                <Pressable
                  variant='outline'
                  className='flex-row items-center justify-between rounded-lg border border-input bg-background px-md py-sm'
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text className='text-body text-muted-foreground'>{formatDate(endDate) || '연도. 월. 일.'}</Text>
                  <Text className='text-body text-muted-foreground'>📅</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 버튼 섹션 */}
          <View className='gap-sm mt-lg'>
            {/* 저장 버튼 */}
            <Pressable
              variant='default'
              className='w-full rounded-lg bg-primary py-md'
              onPress={handleSave}
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

      {/* 시작 날짜 선택 DatePicker */}
      <DatePicker
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onSelectDate={(date: string) => {
          setStartDate(date);
          setShowStartDatePicker(false);
        }}
      />

      {/* 종료 날짜 선택 DatePicker */}
      <DatePicker
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onSelectDate={(date: string) => {
          setEndDate(date);
          setShowEndDatePicker(false);
        }}
      />
    </>
  );
};
