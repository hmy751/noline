import { View, Text } from 'react-native';
import { Pressable } from '@repo/ui';
import { PolicyErrorDisplay } from '@/shared/components/ErrorBoundary/PolicyErrorDisplay';
import type { OperationPolicy } from '@/shared/policy/types';

export type ScheduleSubmitActionsProps = {
  creationPolicy: OperationPolicy;
  submitError: string | null;
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

/** 실행 실패와 사전 제한을 한 자리에서 안내한다. 최종 쓰기 차단은 Router가 맡는다. */
export function ScheduleSubmitActions({
  creationPolicy,
  submitError,
  isPending,
  onSubmit,
  onCancel,
}: ScheduleSubmitActionsProps) {
  return (
    <View className='gap-sm'>
      {!creationPolicy.allowed ? (
        <PolicyErrorDisplay policy={creationPolicy} variant='inline' />
      ) : submitError ? (
        <Text accessibilityRole='alert' className='text-body text-destructive'>
          마지막 저장 실패: {submitError}
        </Text>
      ) : null}
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
