import { View, Text } from 'react-native';
import { Pressable } from '@repo/ui';
import { PolicyErrorDisplay } from '@/shared/components';
import type { OperationPolicy } from '@/shared/policy/types';

type Props = {
  policy: OperationPolicy;
  submitError?: string | null;
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

/** 저장 영역의 제한·실패 안내. 최종 실행 허용 여부는 repository의 Router가 판단한다. */
export function ExpenseSubmitActions({ policy, submitError, isPending, onSubmit, onCancel }: Props) {
  return (
    <View className='gap-sm mt-md'>
      {!policy.allowed && <PolicyErrorDisplay policy={policy} variant='inline' />}
      {submitError && (
        <Text accessibilityRole='alert' className='text-body text-destructive'>
          마지막 저장 실패: {submitError}
        </Text>
      )}
      <View className='flex-row gap-sm'>
        <View className='flex-1'>
          <Pressable onPress={onSubmit} disabled={isPending}>
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
  );
}
