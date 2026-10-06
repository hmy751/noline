import { View, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Pressable } from '@repo/ui';
import { Field, TimeField } from '@/shared/components/Form';
import type { CreateScheduleFormData } from './schema';
import { ScheduleLocationField, type ScheduleLocationFieldProps } from './ScheduleLocationField';
import { ScheduleSubmitActions, type ScheduleSubmitActionsProps } from './ScheduleSubmitActions';

type ScheduleFormProps = {
  form: UseFormReturn<CreateScheduleFormData>;
  location: Omit<ScheduleLocationFieldProps, 'control'>;
  submission: ScheduleSubmitActionsProps;
  onShowDatePicker: () => void;
};

/** 단일 폼의 필드와 영역을 조립한다. 정책 안내와 장소 표현은 각 영역이 소유한다. */
export function ScheduleForm({ form, location, submission, onShowDatePicker }: ScheduleFormProps) {
  const { control } = form;

  return (
    <ScrollView
      className='flex-1'
      keyboardShouldPersistTaps='handled'
      keyboardDismissMode='on-drag'
      contentContainerStyle={styles.content}
    >
      <Controller
        control={control}
        name='title'
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <Field>
            <Field.Title>제목 *</Field.Title>
            <Field.ElementsBox>
              <TextInput
                accessibilityLabel='일정 제목'
                value={value}
                onChangeText={onChange}
                placeholder='예: 에펠탑 방문'
                className='h-11 rounded-md border border-input bg-background px-sm text-body text-foreground'
              />
            </Field.ElementsBox>
            {error && <Field.Message>{error.message}</Field.Message>}
          </Field>
        )}
      />

      <ScheduleLocationField control={control} {...location} />

      <View className='flex-row gap-sm'>
        <View className='flex-1'>
          <Controller
            control={control}
            name='date'
            render={({ field: { value }, fieldState: { error } }) => (
              <Field>
                <Field.Title>날짜 *</Field.Title>
                <Field.ElementsBox>
                  <Pressable variant='outline' onPress={onShowDatePicker}>
                    {value || '날짜 선택'}
                  </Pressable>
                </Field.ElementsBox>
                {error && <Field.Message>{error.message}</Field.Message>}
              </Field>
            )}
          />
        </View>
        <View className='flex-1'>
          <TimeField
            form={form}
            name='time'
            title='시간 *'
            renderTrigger={(value, open) => (
              <Pressable variant='outline' onPress={open}>
                {value || '시간 선택'}
              </Pressable>
            )}
          />
        </View>
      </View>

      <ScheduleSubmitActions {...submission} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({ content: { padding: 20, gap: 20, paddingBottom: 36 } });
