import { View, Text } from 'react-native';
import { Stack, ExpenseCard } from '@/shared/components';
import { type Expense } from '@/entities/expense';
import { formatISOToLocalDate } from '@/shared/lib/datetime';

export interface ScheduleExpenseListProps {
  expenses: Expense[];
  onExpensePress?: (expenseId: string) => void;
}

export function ScheduleExpenseList({ expenses, onExpensePress }: ScheduleExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <View className='rounded-lg border border-dashed border-card-border bg-muted/30 px-md py-lg'>
        <Text className='text-body text-center text-muted-foreground'>경비 내역이 없습니다</Text>
      </View>
    );
  }

  return (
    <Stack direction='vertical' gap='xs'>
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          title={expense.title}
          amount={expense.amount}
          currency={expense.currency}
          category={expense.category}
          hasReceipt={expense.hasReceipt}
          isPending={false}
          showArrow={true}
          onPress={() => onExpensePress?.(expense.id)}
        />
      ))}
    </Stack>
  );
}
