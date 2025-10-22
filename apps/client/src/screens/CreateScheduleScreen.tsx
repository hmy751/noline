import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Controller } from 'react-hook-form';
import { Calendar, Clock, MapPin, ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable } from '@repo/ui';
import { Container, MobileHeader, DatePicker, TimePicker } from '@/shared/components';
import { Field } from '@/shared/components/Form';
import { useCreateScheduleForm } from '@/features/schedule/create-schedule';

export default function CreateScheduleScreen() {
  const params = useLocalSearchParams<{ tripId?: string; date?: string }>();
  const tripId = params.tripId || '';
  const prefilledDate = params.date;

  const {
    form,
    isPending,
    datePickerVisible,
    timePickerVisible,
    handleShowDatePicker,
    handleShowTimePicker,
    handleSelectDate,
    handleSelectTime,
    onSubmit,
  } = useCreateScheduleForm({
    tripId,
    onSuccess: () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/schedule');
      }
    },
  });

  const { control, watch } = form;

  // prefilledDate가 있으면 초기값으로 설정
  if (prefilledDate && !watch('date')) {
    form.setValue('date', prefilledDate);
  }

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/schedule');
    }
  };

  return (
    <Container className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader
        title='새 일정 추가'
        leftIcon={<ArrowLeft size={20} color='#1F1F1F' />}
        onLeftPress={handleBackPress}
      />

      {/* Content */}
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        <View className='px-md py-md'>
          <Text className='text-body text-muted-foreground mb-md'>여행 일정을 추가해보세요</Text>

          <View className='gap-md'>
            {/* 제목 */}
            <Controller
              control={control}
              name='title'
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <Field>
                  <Field.Title>제목</Field.Title>
                  <Field.ElementsBox>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder='예: 에펠탑 방문'
                      className='h-11 rounded-md border border-input bg-background px-4 text-body text-foreground'
                      placeholderTextColor='hsl(120, 8%, 35%)'
                    />
                  </Field.ElementsBox>
                  {error && <Field.Message>{error.message}</Field.Message>}
                </Field>
              )}
            />

            {/* 장소 */}
            <Controller
              control={control}
              name='location'
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <Field>
                  <Field.Title>장소</Field.Title>
                  <Field.ElementsBox>
                    <View className='flex-row items-center h-11 rounded-md border border-input bg-background px-4'>
                      <MapPin size={16} className='mr-xs text-muted-foreground' />
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder='장소 검색 (예: 에펠탑, 도디타워)'
                        className='flex-1 text-body text-foreground'
                        placeholderTextColor='hsl(120, 8%, 35%)'
                      />
                    </View>
                  </Field.ElementsBox>
                  {error && <Field.Message>{error.message}</Field.Message>}
                </Field>
              )}
            />

            {/* 주소 (자동 입력) */}
            <Controller
              control={control}
              name='address'
              render={({ field: { value } }) => (
                <Field>
                  <Field.Title>주소 (자동 입력)</Field.Title>
                  <Field.ElementsBox>
                    <View className='h-11 rounded-md border border-input bg-muted px-4 justify-center'>
                      <Text className='text-body text-muted-foreground'>{value || '장소 선택 시 자동 입력'}</Text>
                    </View>
                  </Field.ElementsBox>
                </Field>
              )}
            />

            {/* 날짜와 시간 */}
            <View className='flex-row gap-sm'>
              {/* 날짜 */}
              <View className='flex-1'>
                <Controller
                  control={control}
                  name='date'
                  render={({ field: { value }, fieldState: { error } }) => (
                    <Field>
                      <Field.Title>날짜</Field.Title>
                      <Field.ElementsBox>
                        <TouchableOpacity
                          onPress={handleShowDatePicker}
                          className='h-11 flex-row items-center rounded-md border border-input bg-background px-4'
                        >
                          <Calendar size={16} className='mr-xs text-muted-foreground' />
                          <Text className='text-body text-foreground'>{value || 'March 15th, 2025'}</Text>
                        </TouchableOpacity>
                      </Field.ElementsBox>
                      {error && <Field.Message>{error.message}</Field.Message>}
                    </Field>
                  )}
                />
              </View>

              {/* 시간 */}
              <View className='flex-1'>
                <Controller
                  control={control}
                  name='time'
                  render={({ field: { value }, fieldState: { error } }) => (
                    <Field>
                      <Field.Title>시간</Field.Title>
                      <Field.ElementsBox>
                        <TouchableOpacity
                          onPress={handleShowTimePicker}
                          className='h-11 flex-row items-center rounded-md border border-input bg-background px-4'
                        >
                          <Clock size={16} className='mr-xs text-muted-foreground' />
                          <Text className='text-body text-foreground'>{value || '--:--:--'}</Text>
                        </TouchableOpacity>
                      </Field.ElementsBox>
                      {error && <Field.Message>{error.message}</Field.Message>}
                    </Field>
                  )}
                />
              </View>
            </View>

            {/* 버튼들 */}
            <View className='gap-sm mt-md'>
              <Pressable variant='default' onPress={onSubmit} disabled={isPending}>
                {isPending ? '추가 중...' : '추가'}
              </Pressable>
              <Pressable variant='outline' onPress={handleBackPress} disabled={isPending}>
                취소
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker */}
      <DatePicker
        visible={datePickerVisible}
        onClose={() => handleSelectDate(watch('date') || '')}
        onSelectDate={handleSelectDate}
      />

      {/* Time Picker */}
      <TimePicker
        visible={timePickerVisible}
        onClose={() => handleSelectTime(watch('time') || '09:00')}
        onSelectTime={handleSelectTime}
        initialTime={watch('time') || '09:00'}
      />
    </Container>
  );
}
