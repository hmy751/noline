import { useEffect, useState, useRef } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, ChevronDown, Calendar as CalendarIcon } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';

import { Drawer, Select } from '@repo/ui';

import { EXPENSE_CATEGORIES, CURRENCIES, CURRENCY_SYMBOLS } from '@/entities/expense';
import { useUpdateExpense } from '@/entities/expense/data/useUpdateExpense';
import { DatePicker } from '@/shared/components';
import { Field } from '@/shared/components/Form';
import { buildChangedGroupPatch } from '@/shared/lib/edit-fields';
import { useAppPolicy } from '@/shared/policy';
import { ConfirmedUpdateError } from '@/shared/services/edit-stamp/errors';

import { expenseUpdateFormSchema, type ExpenseUpdateFormData } from './schema';
import { ExpenseScheduleField } from '../expense-form/ExpenseScheduleField';
import { ExpenseSubmitActions } from '../expense-form/ExpenseSubmitActions';
import { expenseSubmitError } from '../expense-form/submit-error';

export type UpdateExpenseDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  expenseData?: {
    id: string;
    title: string;
    amount: string;
    currency: string;
    category: string;
    date: string; // 앱 데이터 경계에서 정리한 YYYY-MM-DD
    scheduleId?: string;
    tripId: string;
  } | null;
};

/**
 * 경비 수정 드로어 컴포넌트
 * 제목, 금액, 통화, 카테고리, 날짜, 연결된 일정을 수정할 수 있는 UI
 */
export const UpdateExpenseDrawer = ({ isOpen, onClose, expenseData }: UpdateExpenseDrawerProps) => {
  return isOpen && expenseData ? (
    <ExpenseEditForm key={expenseData.id} expenseData={expenseData} onClose={onClose} />
  ) : null;
};

type ExpenseEditFormProps = {
  expenseData: NonNullable<UpdateExpenseDrawerProps['expenseData']>;
  onClose: () => void;
};

const ExpenseEditForm = ({ expenseData: currentExpense, onClose }: ExpenseEditFormProps) => {
  // 같은 ID의 배경 조회는 이번 편집의 입력·비교 기준을 바꾸지 않는다.
  const [expenseData] = useState(currentExpense);
  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, defaultValues },
  } = useForm<ExpenseUpdateFormData>({
    resolver: zodResolver(expenseUpdateFormSchema),
    defaultValues: {
      title: expenseData.title,
      amount: expenseData.amount,
      currency: expenseData.currency,
      category: expenseData.category,
      date: expenseData.date,
      scheduleId: expenseData.scheduleId || undefined,
    },
    mode: 'onChange',
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const { mutateAsync: updateExpense } = useUpdateExpense();

  const selectedDate = watch('date');

  const policy = useAppPolicy(expenseData.tripId);
  const isMounted = useRef(true);
  const [submitError, setSubmitError] = useState<unknown>(null);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleValidSubmit = async (data: ExpenseUpdateFormData) => {
    if (!isMounted.current) {
      return;
    }

    setSubmitError(null);

    const patch = buildChangedGroupPatch('expenses', defaultValues ?? {}, {
      ...data,
      scheduleId: data.scheduleId || null,
    });

    if (!Object.keys(patch).length) {
      onClose();
      return;
    }

    await updateExpense({
      id: expenseData.id,
      tripId: expenseData.tripId,
      data: patch,
    });

    // 폼이 해제되어도 요청은 끝날 수 있다. 그 뒤에는 성공 안내나 닫기를 실행하지 않는다.
    if (!isMounted.current) {
      return;
    }

    Alert.alert('성공', '경비가 수정되었습니다.');
    onClose();
  };

  const handleInvalidSubmit = () => {
    if (!isMounted.current) {
      return;
    }

    Alert.alert('오류', '입력한 정보를 확인해주세요.');
  };

  const handleSave = async () => {
    try {
      await handleSubmit(handleValidSubmit, handleInvalidSubmit)();
    } catch (error) {
      if (isMounted.current) {
        setSubmitError(() => error);
      }
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      Alert.alert('저장 중입니다', '저장이 끝난 뒤 닫을 수 있어요.');
      return;
    }

    onClose();
  };

  return (
    <Drawer isOpen onClose={handleClose} title='경비 수정'>
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
                            if (text) {
                              onChange(text);
                            }
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
                              if (text) {
                                onChange(text);
                              }
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
              const displayDate = value || '날짜 선택';

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
                tripId={expenseData.tripId}
                expenseDate={selectedDate}
                value={value}
                onChange={onChange}
                error={error?.message}
                enabled
              />
            )}
          />
          <ExpenseSubmitActions
            policy={policy.expense.update}
            submitError={submitError === null ? null : expenseSubmitError(submitError)}
            submitErrorLabel={submitError instanceof ConfirmedUpdateError ? '저장 확인' : undefined}
            isPending={isSubmitting}
            isCancelDisabled={false}
            onSubmit={handleSave}
            onCancel={handleClose}
          />
        </View>
      </ScrollView>
    </Drawer>
  );
};
