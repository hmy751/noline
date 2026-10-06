import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Controller } from 'react-hook-form';
import { Wallet, ChevronDown, Calendar as CalendarIcon } from 'lucide-react-native';
import { Pressable, Select } from '@repo/ui';
import { Field } from '@/shared/components/Form';
import { DatePicker } from '@/shared/components';
import { EXPENSE_CATEGORIES, CURRENCIES, CURRENCY_SYMBOLS } from '@/entities/expense';
import { ExpenseScheduleField } from '../expense-form/ExpenseScheduleField';
import { ExpenseSubmitActions } from '../expense-form/ExpenseSubmitActions';
import { useAppPolicy } from '@/shared/policy';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateExpenseFormData } from './schema';
import { useState } from 'react';

type ExpenseFormProps = {
  form: UseFormReturn<CreateExpenseFormData>;
  tripId: string;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  submitError?: string | null;
};

/**
 * 경비 입력 폼 컴포넌트
 */
export function ExpenseForm({ form, tripId, onSubmit, onCancel, isPending, submitError }: ExpenseFormProps) {
  const { control, watch } = form;
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // 선택한 날짜 추적
  const selectedDate = watch('date');

  const policy = useAppPolicy(tripId);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
                <View className='flex-row items-center'>
                  <View className='flex-1'>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder='0.00'
                      keyboardType='decimal-pad'
                      className='h-11 rounded-md border border-input bg-background px-sm text-body text-foreground'
                      placeholderTextColor='#808080'
                    />
                  </View>
                </View>
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
            // 폼의 달력 날짜를 그대로 표시한다.
            const displayDate = value || '날짜 선택';

            return (
              <Field>
                <Field.Title>날짜 *</Field.Title>
                <Field.ElementsBox>
                  <Pressable
                    variant='outline'
                    className='h-11 flex-row items-center justify-between px-sm'
                    onPress={() => setIsDatePickerOpen(true)}
                  >
                    <View className='flex-row items-center gap-xs'>
                      <CalendarIcon size={16} color='hsl(0, 0%, 45%)' />
                      <Text className='text-body text-foreground'>{displayDate}</Text>
                    </View>
                  </Pressable>
                </Field.ElementsBox>
                {error && <Field.Message>{error.message}</Field.Message>}

                {/* DatePicker Modal */}
                <DatePicker
                  visible={isDatePickerOpen}
                  selectedDate={value || undefined}
                  onClose={() => setIsDatePickerOpen(false)}
                  onSelectDate={(dateString) => {
                    onChange(dateString);
                    setIsDatePickerOpen(false);
                  }}
                />
              </Field>
            );
          }}
        />

        <Controller
          control={control}
          name='scheduleId'
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <ExpenseScheduleField
              tripId={tripId}
              expenseDate={selectedDate}
              value={value}
              onChange={onChange}
              error={error?.message}
            />
          )}
        />
        <ExpenseSubmitActions
          policy={policy.expense.create}
          submitError={submitError}
          isPending={isPending}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
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
