import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { CheckCircle, XCircle, Download } from 'lucide-react-native';
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
  const isComplete = completedCount === totalCount;
  const hasError = items.some((item) => item.status === 'error');

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title}>
      <View className='flex-1 px-lg py-md'>
        {/* 상태 메시지 */}
        <View className='mb-md'>
          <Text className='text-body text-muted-foreground'>
            {isComplete
              ? hasError
                ? '일부 작업이 실패했습니다'
                : '모든 준비가 완료되었습니다!'
              : `준비 중... ${progressPercent}%`}
          </Text>
        </View>

        {/* 진행률 바 */}
        <View className='mb-lg h-2 overflow-hidden rounded-full bg-secondary'>
          <View
            className={cn('h-full transition-all', hasError ? 'bg-destructive' : 'bg-success')}
            style={{ width: `${progressPercent}%` }}
          />
        </View>

        {/* 진행 항목 리스트 */}
        <View className='flex-1'>
          {items.map((item) => (
            <View key={item.id} className='mb-md flex-row items-center gap-md'>
              {/* 상태 아이콘 */}
              <View className='h-10 w-10 items-center justify-center'>
                {item.status === 'pending' && <Download size={20} color='#9ca3af' strokeWidth={2} />}
                {item.status === 'loading' && <ActivityIndicator size='small' color='#3b82f6' />}
                {item.status === 'success' && <CheckCircle size={20} color='#22c55e' strokeWidth={2} />}
                {item.status === 'error' && <XCircle size={20} color='#ef4444' strokeWidth={2} />}
              </View>

              {/* 항목 정보 */}
              <View className='flex-1'>
                <Text
                  className={cn(
                    'text-body',
                    item.status === 'success' && 'text-success',
                    item.status === 'error' && 'text-destructive',
                    item.status === 'pending' && 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </Text>
                {item.error && <Text className='text-label text-destructive'>{item.error}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* 완료 버튼 (모든 작업 완료시) */}
        {isComplete && (
          <View className='mt-md'>
            <Pressable
              onPress={onClose}
              className={cn('items-center justify-center rounded-lg py-md', hasError ? 'bg-destructive' : 'bg-success')}
            >
              <Text className='text-body-bold text-white'>{hasError ? '닫기' : '완료'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Drawer>
  );
}
