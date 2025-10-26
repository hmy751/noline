import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Controller } from 'react-hook-form';
import { Wallet, ChevronDown, Calendar as CalendarIcon, MapPin } from 'lucide-react-native';
import { Pressable, Select } from '@repo/ui';
import { Field } from '@/shared/components/Form';
import { DatePicker } from '@/shared/components';
import { EXPENSE_CATEGORIES, CURRENCIES, CURRENCY_SYMBOLS } from '@/entities/expense';
import { formatISOToLocalDate, dateToISODateTime, formatISOToLocalTime } from '@/shared/lib/datetime';
import { useGetSchedules } from '@/entities/schedule';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateExpenseFormData } from './schema';
import { useState, useMemo } from 'react';

type ExpenseFormProps = {
  form: UseFormReturn<CreateExpenseFormData>;
  tripId: string;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
};

/**
 * 경비 입력 폼 컴포넌트
 */
export function ExpenseForm({ form, tripId, onSubmit, onCancel, isPending }: ExpenseFormProps) {
  const { control, watch } = form;
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // 선택한 날짜 추적
  const selectedDate = watch('date');

  // 여행의 모든 일정 조회
  const { data: schedules = [] } = useGetSchedules(tripId);

  // 선택한 날짜의 일정만 필터링
  const schedulesOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    const selectedLocalDate = formatISOToLocalDate(selectedDate);

    return schedules.filter((schedule) => {
      const scheduleDate = formatISOToLocalDate(schedule.scheduledAt);
      return scheduleDate === selectedLocalDate;
    });
  }, [selectedDate, schedules]);

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
            // ✅ TIME_ARCHITECTURE_GUIDE: ISO → Local Date for display
            const displayDate = value ? formatISOToLocalDate(value) : '날짜 선택';

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
                  onClose={() => setIsDatePickerOpen(false)}
                  onSelectDate={(dateString) => {
                    // ✅ TIME_ARCHITECTURE_GUIDE: Date → ISO datetime
                    // "2024-03-15" → "2024-03-15T00:00:00.000Z"
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

        {/* 연결된 일정 (선택) */}
        <Controller
          control={control}
          name='scheduleId'
          render={({ field: { value, onChange }, fieldState: { error } }) => {
            const selectedSchedule = schedulesOnSelectedDate.find((s) => s.id === value);

            return (
              <Field>
                <Field.Title>연결된 일정 (선택)</Field.Title>
                <Field.ElementsBox>
                  <Select
                    value={
                      selectedSchedule
                        ? {
                            value: selectedSchedule.id,
                            label: `${formatISOToLocalTime(selectedSchedule.scheduledAt)} ${selectedSchedule.title}`,
                          }
                        : undefined
                    }
                    onValueChange={(option) => onChange(option?.value || undefined)}
                  >
                    <Select.Trigger>
                      <View className='flex-row items-center gap-xs flex-1'>
                        <MapPin size={16} color='hsl(0, 0%, 45%)' />
                        <Select.Value placeholder='일정 선택 (선택사항)' />
                      </View>
                      <ChevronDown size={16} color='hsl(0, 0%, 45%)' />
                    </Select.Trigger>

                    <Select.Portal>
                      <Select.Overlay>
                        <Select.Content>
                          <Select.Viewport>
                            {schedulesOnSelectedDate.length === 0 ? (
                              <View className='px-md py-lg'>
                                <Text className='text-body text-center text-muted-foreground'>
                                  {selectedDate ? '이 날의 일정이 없습니다' : '먼저 날짜를 선택해주세요'}
                                </Text>
                              </View>
                            ) : (
                              schedulesOnSelectedDate.map((schedule) => {
                                const timeLabel = formatISOToLocalTime(schedule.scheduledAt);
                                const label = `${timeLabel} ${schedule.title}`;

                                return (
                                  <Select.Item key={schedule.id} value={schedule.id} label={label}>
                                    <View className='flex-col gap-3xs py-2xs'>
                                      <Text className='text-body-large text-foreground'>{schedule.title}</Text>
                                      <View className='flex-row items-center gap-2xs'>
                                        <Text className='text-label text-muted-foreground'>{timeLabel}</Text>
                                        <Text className='text-label text-muted-foreground'>•</Text>
                                        <Text className='text-label text-muted-foreground'>{schedule.location}</Text>
                                      </View>
                                    </View>
                                  </Select.Item>
                                );
                              })
                            )}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Overlay>
                    </Select.Portal>
                  </Select>
                </Field.ElementsBox>
                {error && <Field.Message>{error.message}</Field.Message>}
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
