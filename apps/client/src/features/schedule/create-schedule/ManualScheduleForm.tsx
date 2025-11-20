import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Calendar, Clock, AlertCircle } from 'lucide-react-native';
import { Pressable } from '@repo/ui';
import { Field } from '@/shared/components/Form';
import type { CreateScheduleFormData } from './schema';

type ManualScheduleFormProps = {
  form: UseFormReturn<CreateScheduleFormData>;
  onShowTimePicker: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
};

/**
 * Manual Schedule Form (오프라인 전용)
 *
 * 동작:
 * - 장소 검색 없이 텍스트 입력만 받음
 * - latitude/longitude는 null로 저장
 * - 온라인 복구 시 일정 수정에서 장소 재검색 가능
 *
 * 사용 시나리오:
 * - offline_active 상태 (policy.schedule.create.mode === 'manual-only')
 * - 장소 이름과 주소만 텍스트로 입력
 * - 온라인 복구되면 UpdateScheduleDrawer에서 수동으로 장소 재검색
 */
export function ManualScheduleForm({ form, onShowTimePicker, onSubmit, onCancel, isPending }: ManualScheduleFormProps) {
  const { control } = form;

  return (
    <View style={styles.container}>
      {/* 오프라인 안내 배너 */}
      <View className='bg-yellow-50 px-md py-sm border-b border-yellow-200'>
        <View className='flex-row items-start gap-xs'>
          <AlertCircle size={16} color='#D97706' style={{ marginTop: 2 }} />
          <View className='flex-1'>
            <Text className='text-small font-medium text-yellow-800 mb-3xs'>오프라인 모드</Text>
            <Text className='text-small text-yellow-700'>
              장소 검색을 사용할 수 없어요. 온라인으로 복구되면 일정 수정에서 장소를 검색할 수 있습니다.
            </Text>
          </View>
        </View>
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
                  placeholder='예: 에펠탑 방문'
                  className='h-11 rounded-md border border-input bg-background px-sm text-body text-foreground'
                  placeholderTextColor='#808080'
                />
              </Field.ElementsBox>
              {error && <Field.Message>{error.message}</Field.Message>}
            </Field>
          )}
        />

        {/* 장소 이름 (텍스트 입력) */}
        <Controller
          control={control}
          name='location'
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Field>
              <Field.Title>장소 이름 *</Field.Title>
              <Field.ElementsBox>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder='예: 에펠탑'
                  className='h-11 rounded-md border border-input bg-background px-sm text-body text-foreground'
                  placeholderTextColor='#808080'
                />
              </Field.ElementsBox>
              {error && <Field.Message>{error.message}</Field.Message>}
            </Field>
          )}
        />

        {/* 주소 (선택) */}
        <Controller
          control={control}
          name='address'
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Field>
              <Field.Title>주소 (선택)</Field.Title>
              <Field.ElementsBox>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder='예: 파리 7구'
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
