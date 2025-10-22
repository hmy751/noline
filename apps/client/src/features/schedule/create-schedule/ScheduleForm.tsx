import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Controller } from 'react-hook-form';
import { Calendar, Clock, X, MapPin } from 'lucide-react-native';
import { Pressable } from '@repo/ui';
import { Field } from '@/shared/components/Form';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateScheduleFormData } from './schema';
import type { Location } from './types';

type ScheduleFormProps = {
  selectedLocation: Location;
  form: UseFormReturn<CreateScheduleFormData>;
  onClearLocation: () => void;
  onShowTimePicker: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
};

/**
 * 일정 입력 폼 컴포넌트
 */
export function ScheduleForm({
  selectedLocation,
  form,
  onClearLocation,
  onShowTimePicker,
  onSubmit,
  onCancel,
  isPending,
}: ScheduleFormProps) {
  const { control } = form;

  return (
    <View style={styles.container}>
      {/* 선택된 장소 정보 */}
      <View className='flex-row items-center justify-between px-md py-sm border-b border-card-border bg-muted/30'>
        <View className='flex-row items-center flex-1'>
          <View className='w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-sm'>
            <MapPin size={20} color='#228B22' />
          </View>
          <View className='flex-1'>
            <Text className='text-title-medium text-foreground'>{selectedLocation.name}</Text>
            <Text className='text-label text-muted-foreground mt-3xs' numberOfLines={1}>
              {selectedLocation.address}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClearLocation} className='ml-sm w-8 h-8 items-center justify-center'>
          <X size={20} color='#808080' />
        </TouchableOpacity>
      </View>

      {/* 입력 폼 */}
      <View className='px-md py-sm gap-md'>
        {/* 제목 */}
        <Controller
          control={control}
          name='title'
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Field>
              <Field.Title>제목 *</Field.Title>
              <Field.ElementsBox>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder='제목을 입력하세요'
                  className='h-11 rounded-md border border-input bg-background px-sm text-body text-foreground'
                  placeholderTextColor='#808080'
                />
              </Field.ElementsBox>
              {error && <Field.Message>{error.message}</Field.Message>}
            </Field>
          )}
        />

        {/* 날짜와 시간 */}
        <View className='flex-row gap-sm'>
          {/* 날짜 (비활성) */}
          <View className='flex-1'>
            <Controller
              control={control}
              name='date'
              render={({ field: { value }, fieldState: { error } }) => (
                <Field>
                  <Field.Title>날짜 *</Field.Title>
                  <Field.ElementsBox>
                    <View className='h-11 flex-row items-center rounded-md border border-input bg-muted px-sm opacity-60'>
                      <Calendar size={16} color='#808080' />
                      <Text className='text-body text-muted-foreground ml-xs'>{value || 'March 15th, 2025'}</Text>
                    </View>
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
                  <Field.Title>시간 *</Field.Title>
                  <Field.ElementsBox>
                    <TouchableOpacity
                      onPress={onShowTimePicker}
                      className='h-11 flex-row items-center rounded-md border border-input bg-background px-sm'
                    >
                      <Clock size={16} color='#808080' />
                      <Text className='text-body text-foreground ml-xs'>{value || '--:--'}</Text>
                    </TouchableOpacity>
                  </Field.ElementsBox>
                  {error && <Field.Message>{error.message}</Field.Message>}
                </Field>
              )}
            />
          </View>
        </View>

        {/* 버튼 */}
        <View className='flex-row gap-sm'>
          <View className='flex-1'>
            <Pressable variant='default' onPress={onSubmit} disabled={isPending}>
              {isPending ? '저장 중...' : '저장'}
            </Pressable>
          </View>
          <View className='flex-1'>
            <Pressable variant='outline' onPress={onCancel} disabled={isPending}>
              취소
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});
