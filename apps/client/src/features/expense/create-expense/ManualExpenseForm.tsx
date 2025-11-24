import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Wallet, ChevronDown, Calendar as CalendarIcon, AlertCircle } from 'lucide-react-native';
import { Pressable, Select } from '@repo/ui';
import { Field } from '@/shared/components/Form';
import { DatePicker } from '@/shared/components';
import { EXPENSE_CATEGORIES, CURRENCIES, CURRENCY_SYMBOLS } from '@/entities/expense';
import { formatISOToLocalDate, dateToISODateTime } from '@/shared/lib/datetime';
import type { CreateExpenseFormData } from './schema';
import { useState } from 'react';

type ManualExpenseFormProps = {
  form: UseFormReturn<CreateExpenseFormData>;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
};

/**
 * Manual Expense Form (오프라인 전용)
 *
 * 동작:
 * - 일정 연결 없이 기본 정보만 입력
 * - scheduleId는 null로 저장
 * - 온라인 복구 시 일정 연결 가능
 *
 * 사용 시나리오:
 * - offline_active 상태 (policy.expense.create.mode === 'manual-only')
 * - 필수: title, amount, currency, category, date
 * - 일정 연결 불가 (오프라인에서는 장소 정보 조회 불가)
 */
export function ManualExpenseForm({ form, onSubmit, onCancel, isPending }: ManualExpenseFormProps) {
  const { control, watch } = form;
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const selectedDate = watch('date');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 오프라인 안내 배너 */}
      <View className='bg-yellow-50 px-md py-sm border-b border-yellow-200'>
        <View className='flex-row items-start gap-xs'>
          <AlertCircle size={16} color='#D97706' style={{ marginTop: 2 }} />
          <View className='flex-1'>
            <Text className='text-small font-medium text-yellow-800 mb-3xs'>오프라인 모드</Text>
            <Text className='text-small text-yellow-700'>
              일정 연결을 사용할 수 없어요. 온라인으로 복구되면 경비 수정에서 일정을 연결할 수 있습니다.
            </Text>
          </View>
        </View>
      </View>

      {/* 입력 폼 */}
      <View className='px-md py-md gap-md'>
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
                  placeholder='예: 에펠탑 입장권'
                  className='h-11 rounded-md border border-input bg-background px-sm text-body text-foreground'
                  placeholderTextColor='#808080'
                />
              </Field.ElementsBox>
              {error && <Field.Message>{error.message}</Field.Message>}
            </Field>
          )}
        />

        {/* 금액 */}
        <Controller
          control={control}
          name='amount'
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Field>
              <Field.Title>금액 *</Field.Title>
              <Field.ElementsBox>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder='0.00'
                  keyboardType='decimal-pad'
                  className='h-11 rounded-md border border-input bg-background px-sm text-body text-foreground'
                  placeholderTextColor='#808080'
                />
              </Field.ElementsBox>
              {error && <Field.Message>{error.message}</Field.Message>}
            </Field>
          )}
        />

        {/* 통화 */}
        <Controller
          control={control}
          name='currency'
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Field>
              <Field.Title>통화 *</Field.Title>
              <Field.ElementsBox>
                <Select
                  value={{
                    value,
                    label: `${value} (${CURRENCY_SYMBOLS[value as keyof typeof CURRENCY_SYMBOLS] || ''})`,
                  }}
                  onValueChange={(option) => option && onChange(option.value)}
                >
                  <Select.Trigger>
                    <View className='flex-row items-center gap-xs flex-1'>
                      <Wallet size={16} color='hsl(0, 0%, 45%)' />
                      <Select.Value placeholder='통화 선택' />
                    </View>
                    <ChevronDown size={16} color='hsl(0, 0%, 45%)' />
                  </Select.Trigger>

                  <Select.Portal>
                    <Select.Overlay>
                      <Select.Content>
                        <Select.Viewport>
                          {CURRENCIES.map((currency) => (
                            <Select.Item
                              key={currency}
                              value={currency}
                              label={`${currency} (${CURRENCY_SYMBOLS[currency]})`}
                            >
                              <Select.ItemText>
                                {currency} ({CURRENCY_SYMBOLS[currency]})
                              </Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Overlay>
                  </Select.Portal>
                </Select>
              </Field.ElementsBox>
              {error && <Field.Message>{error.message}</Field.Message>}
            </Field>
          )}
        />

        {/* 카테고리 */}
        <Controller
          control={control}
          name='category'
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Field>
              <Field.Title>카테고리 *</Field.Title>
              <Field.ElementsBox>
                <Select
                  value={value ? { value, label: value } : undefined}
                  onValueChange={(option) => option && onChange(option.value)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder='카테고리 선택' />
                    <ChevronDown size={16} color='hsl(0, 0%, 45%)' />
                  </Select.Trigger>

                  <Select.Portal>
                    <Select.Overlay>
                      <Select.Content>
                        <Select.Viewport>
                          {EXPENSE_CATEGORIES.map((category) => (
                            <Select.Item key={category} value={category} label={category}>
                              <Select.ItemText>{category}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Overlay>
                  </Select.Portal>
                </Select>
              </Field.ElementsBox>
              {error && <Field.Message>{error.message}</Field.Message>}
            </Field>
          )}
        />

        {/* 날짜 */}
        <Controller
          control={control}
          name='date'
          render={({ field: { value, onChange }, fieldState: { error } }) => {
            const displayDate = value ? formatISOToLocalDate(value) : '날짜 선택';

            return (
              <Field>
                <Field.Title>날짜 *</Field.Title>
                <Field.ElementsBox>
                  <TouchableOpacity
                    onPress={() => setIsDatePickerOpen(true)}
                    className='h-11 flex-row items-center rounded-md border border-input bg-background px-sm'
                  >
                    <CalendarIcon size={16} color='#808080' />
                    <Text className='text-body text-foreground ml-xs'>{displayDate}</Text>
                  </TouchableOpacity>
                </Field.ElementsBox>
                {error && <Field.Message>{error.message}</Field.Message>}

                {/* DatePicker Modal */}
                <DatePicker
                  visible={isDatePickerOpen}
                  onClose={() => setIsDatePickerOpen(false)}
                  onSelectDate={(dateString) => {
                    onChange(dateToISODateTime(dateString));
                    setIsDatePickerOpen(false);
                  }}
                  markedDates={{
                    [displayDate]: {
                      selected: true,
                      selectedColor: 'hsl(120, 61%, 34%)',
                    },
                  }}
                />
              </Field>
            );
          }}
        />

        {/* 버튼 */}
        <View className='flex-row gap-sm mt-md'>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
