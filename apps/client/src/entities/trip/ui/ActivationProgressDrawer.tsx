import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { CheckCircle, XCircle, Circle, Wifi } from 'lucide-react-native';
import { cn, Drawer, Pressable } from '@repo/ui';

export interface ProgressItem {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

interface ActivationProgressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: ProgressItem[];
}

export function ActivationProgressDrawer({ isOpen, onClose, title, items }: ActivationProgressDrawerProps) {
  // 전체 진행률 계산
  const completedCount = items.filter((item) => item.status === 'success').length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 모든 작업이 완료되었는지 확인
  const isComplete = completedCount === totalCount && totalCount > 0;
  const hasError = items.some((item) => item.status === 'error');
  const isInProgress = items.some((item) => item.status === 'loading');

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title}>
      <View className='flex-1 px-lg py-md'>
        {/* 상단 아이콘 + 상태 메시지 */}
        <View className='mb-lg items-center'>
          {isComplete && !hasError ? (
            <View className='mb-sm h-16 w-16 items-center justify-center rounded-full bg-success/10'>
              <Wifi size={32} color='#22c55e' strokeWidth={2} />
            </View>
          ) : hasError ? (
            <View className='mb-sm h-16 w-16 items-center justify-center rounded-full bg-destructive/10'>
              <XCircle size={32} color='#ef4444' strokeWidth={2} />
            </View>
          ) : (
            <View className='mb-sm h-16 w-16 items-center justify-center'>
              <ActivityIndicator size='large' color='#3b82f6' />
            </View>
          )}

          <Text className='text-title-large text-center text-foreground'>
            {isComplete ? (hasError ? '준비 중 오류 발생' : '오프라인 준비 완료!') : '오프라인 준비 중...'}
          </Text>
          <Text className='text-body mt-xs text-center text-muted-foreground'>
            {isComplete
              ? hasError
                ? '일부 항목을 다운로드하지 못했습니다'
                : '이제 오프라인에서도 여행을 관리할 수 있어요'
              : `${progressPercent}% 완료`}
          </Text>
        </View>

        {/* 진행률 바 */}
        <View className='mb-lg h-2 overflow-hidden rounded-full bg-secondary'>
          <View
            className={cn('h-full', hasError ? 'bg-destructive' : isComplete ? 'bg-success' : 'bg-primary')}
            style={{ width: `${progressPercent}%` }}
          />
        </View>

        {/* 진행 항목 리스트 */}
        <View className='mb-lg'>
          {items.map((item) => (
            <View key={item.id} className='mb-sm flex-row items-center gap-sm'>
              {/* 상태 아이콘 */}
              <View className='h-8 w-8 items-center justify-center'>
                {item.status === 'pending' && <Circle size={18} color='#9ca3af' strokeWidth={2} />}
                {item.status === 'loading' && <ActivityIndicator size='small' color='#3b82f6' />}
                {item.status === 'success' && <CheckCircle size={18} color='#22c55e' strokeWidth={2} />}
                {item.status === 'error' && <XCircle size={18} color='#ef4444' strokeWidth={2} />}
              </View>

              {/* 항목 정보 */}
              <View className='flex-1'>
                <Text
                  className={cn(
                    'text-body',
                    item.status === 'success' && 'text-foreground',
                    item.status === 'error' && 'text-destructive',
                    item.status === 'pending' && 'text-muted-foreground',
                    item.status === 'loading' && 'text-foreground',
                  )}
                >
                  {item.label}
                </Text>
                {item.error && <Text className='text-label text-destructive'>{item.error}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* 하단 버튼 */}
        <View className='mt-auto'>
          {isComplete ? (
            <Pressable
              onPress={onClose}
              className={cn('items-center justify-center rounded-lg py-md', hasError ? 'bg-muted' : 'bg-success')}
            >
              <Text className={cn('text-body-bold', hasError ? 'text-foreground' : 'text-white')}>
                {hasError ? '닫기' : '완료'}
              </Text>
            </Pressable>
          ) : (
            <Text className='text-label text-center text-muted-foreground'>잠시만 기다려주세요...</Text>
          )}
        </View>
      </View>
    </Drawer>
  );
}
