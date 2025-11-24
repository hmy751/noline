import React from 'react';
import { View, Text } from 'react-native';
import { Pressable } from '@repo/ui';
import { Trash2 } from 'lucide-react-native';

interface ToolsViewProps {
  onResetDatabase: () => void;
  onClearOfflineMaps: () => void;
  onClearActivations: () => void;
}

export function ToolsView({ onResetDatabase, onClearOfflineMaps, onClearActivations }: ToolsViewProps) {
  return (
    <View className='gap-md'>
      <View className='rounded-lg bg-card p-md border border-card-border'>
        <Text className='text-title-medium text-foreground mb-sm'>데이터 관리</Text>
        <View className='gap-sm'>
          <Pressable
            variant='outline'
            className='flex-row items-center justify-center gap-xs py-3 rounded-lg border border-destructive'
            onPress={onResetDatabase}
          >
            <Trash2 size={16} color='#BF4040' />
            <Text className='text-body text-destructive'>DB 초기화</Text>
          </Pressable>

          <Pressable
            variant='outline'
            className='flex-row items-center justify-center gap-xs py-3 rounded-lg border border-destructive'
            onPress={onClearOfflineMaps}
          >
            <Trash2 size={16} color='#BF4040' />
            <Text className='text-body text-destructive'>오프라인 지도 완전 삭제 (팩 + DB)</Text>
          </Pressable>

          <Pressable
            variant='outline'
            className='flex-row items-center justify-center gap-xs py-3 rounded-lg border border-destructive'
            onPress={onClearActivations}
          >
            <Trash2 size={16} color='#BF4040' />
            <Text className='text-body text-destructive'>활성화 데이터 완전 삭제 (활성화 + 로컬 여행)</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
