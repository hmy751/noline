import { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, ChevronDown, Calendar as CalendarIcon, MapPin } from 'lucide-react-native';
import { Drawer, Pressable, Select } from '@repo/ui';
import { DatePicker } from '@/shared/components';
import { Field } from '@/shared/components/Form';
import { EXPENSE_CATEGORIES, CURRENCIES, CURRENCY_SYMBOLS } from '@/entities/expense';
import { useUpdateExpense } from '@/entities/expense/data/useUpdateExpense';
import { formatISOToLocalDate, formatISOToLocalTime, dateToISODateTime } from '@/shared/lib/datetime';
import { useGetSchedules } from '@/entities/schedule';
import { expenseUpdateFormSchema, type ExpenseUpdateFormData } from './schema';

export type UpdateExpenseDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  expenseData?: {
    id: string;
    title: string;
    amount: string;
    currency: string;
    category: string;
    date: string; // ISO datetime string
    scheduleId?: string;
    tripId: string;
  } | null;
};

/**
 * 경비 수정 드로어 컴포넌트
 * 제목, 금액, 통화, 카테고리, 날짜, 연결된 일정을 수정할 수 있는 UI
 */
export const UpdateExpenseDrawer = ({ isOpen, onClose, expenseData }: UpdateExpenseDrawerProps) => {
  // react-hook-form 설정
  const { control, handleSubmit, setValue, watch } = useForm<ExpenseUpdateFormData>({
    resolver: zodResolver(expenseUpdateFormSchema),
    defaultValues: {
      title: expenseData?.title || '',
      amount: expenseData?.amount || '',
      currency: expenseData?.currency || 'EUR',
      category: expenseData?.category || '',
      date: expenseData?.date || '',
      scheduleId: expenseData?.scheduleId || undefined,
    },
    mode: 'onChange',
  });

  // Picker visibility state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // useUpdateExpense mutation hook
  const { mutate: updateExpense, isPending } = useUpdateExpense();

  // 선택한 날짜 추적
  const selectedDate = watch('date');

  // 여행의 모든 일정 조회
  const { data: schedules = [] } = useGetSchedules(expenseData?.tripId || '');

  // 선택한 날짜의 일정만 필터링
  const schedulesOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    const selectedLocalDate = formatISOToLocalDate(selectedDate);

    return schedules.filter((schedule) => {
      const scheduleDate = formatISOToLocalDate(schedule.scheduledAt);
      return scheduleDate === selectedLocalDate;
    });
  }, [selectedDate, schedules]);

  // expenseData가 변경되면 폼 값 업데이트
  useEffect(() => {
    if (expenseData) {
      setValue('title', expenseData.title);
      setValue('amount', expenseData.amount);
      setValue('currency', expenseData.currency);
      setValue('category', expenseData.category);
      setValue('date', expenseData.date);
      setValue('scheduleId', expenseData.scheduleId || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseData?.id]);

  // 저장 핸들러 (유효성 검사는 zodResolver가 처리)
  const onValid = (data: ExpenseUpdateFormData) => {
    if (!expenseData) return;

    // ✅ Local-First: 로컬 DB 업데이트 + sync_queue 기록
    updateExpense(
      {
        id: expenseData.id,
        data: {
          title: data.title,
          amount: data.amount,
          currency: data.currency,
          category: data.category,
          date: data.date,
          scheduleId: data.scheduleId || null,
        },
      },
      {
        onSuccess: () => {
          Alert.alert('성공', '경비가 수정되었습니다.');
          onClose();
        },
        onError: () => {
          Alert.alert('오류', '경비 수정에 실패했습니다.');
        },
      },
    );
  };

  const onInvalid = () => {
    Alert.alert('오류', '입력한 정보를 확인해주세요.');
  };

  if (!expenseData) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title='경비 수정'>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className='gap-md'>
          {/* 설명 */}
          <Text className='text-body text-muted-foreground'>{expenseData.title}의 정보를 수정합니다</Text>

          {/* 제목 */}
          <Controller
            control={control}
            name='title'
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <Field>
                <Field.Title>제목 *</Field.Title>
                <Field.ElementsBox>
                  <TouchableOpacity
                    className='h-11 rounded-md border border-input bg-background px-sm justify-center'
                    onPress={() => {
                      Alert.prompt('제목 수정', '새로운 제목을 입력하세요', [
                        { text: '취소', style: 'cancel' },
                        {
                          text: '확인',
                          onPress: (text) => {
                            if (text) onChange(text);
                          },
                        },
                      ]);
                    }}
                  >
                    <Text className='text-body text-foreground'>{value || '제목을 입력하세요'}</Text>
                  </TouchableOpacity>
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
                  <TouchableOpacity
                    className='h-11 rounded-md border border-input bg-background px-sm justify-center'
                    onPress={() => {
                      Alert.prompt(
                        '금액 수정',
                        '새로운 금액을 입력하세요',
                        [
                          { text: '취소', style: 'cancel' },
                          {
                            text: '확인',
                            onPress: (text) => {
                              if (text) onChange(text);
                            },
                          },
                        ],
                        'plain-text',
                        value,
                        'decimal-pad',
                      );
                    }}
                  >
                    <Text className='text-body text-foreground'>{value || '0.00'}</Text>
                  </TouchableOpacity>
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
                    <TouchableOpacity
                      className='h-11 flex-row items-center rounded-md border border-input bg-background px-sm'
                      onPress={() => setIsDatePickerOpen(true)}
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

          {/* 버튼 영역 */}
          <View className='flex-row gap-sm mt-md'>
            <View className='flex-1'>
              <Pressable variant='default' onPress={handleSubmit(onValid, onInvalid)} disabled={isPending}>
                {isPending ? '저장 중...' : '저장'}
              </Pressable>
            </View>
            <View className='flex-1'>
              <Pressable variant='outline' onPress={onClose} disabled={isPending}>
                취소
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </Drawer>
  );
};
