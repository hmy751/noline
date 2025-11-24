import React from 'react';
import { View, Text } from 'react-native';
import { Pressable } from '@repo/ui';
import { Database, Wifi, WifiOff, RotateCcw, RefreshCw, Upload } from 'lucide-react-native';
import { useNetworkControl, useNetworkStatus } from '@/shared/store/network';

interface DashboardViewProps {
  stats: { pending: number; inProgress: number; failed: number; total: number } | null;
  counts: {
    trips: number;
    schedules: number;
    expenses: number;
    activations: number;
    offlineCities: number;
  };
  onRefresh: () => void;
  onManualSync: () => void;
}

export function DashboardView({ stats, counts, onRefresh, onManualSync }: DashboardViewProps) {
  const { overrideStatus, setOverrideOnline, setOverrideOffline, clearOverride } = useNetworkControl();
  const realNetworkStatus = useNetworkStatus();
  const effectiveStatus = overrideStatus ?? realNetworkStatus;

  return (
    <View className='gap-md'>
      {/* Network Status Card */}
      <View className='rounded-lg bg-card p-md border border-card-border'>
        <View className='flex-row items-center gap-xs mb-sm'>
          {effectiveStatus === 'online' ? <Wifi size={20} color='#228B22' /> : <WifiOff size={20} color='#BF4040' />}
          <Text className='text-title-medium text-foreground'>네트워크 상태</Text>
        </View>
        <View className='gap-2xs mb-sm'>
          <Text className='text-body text-foreground'>
            현재 상태:{' '}
            <Text
              className={effectiveStatus === 'online' ? 'text-primary font-semibold' : 'text-destructive font-semibold'}
            >
              {effectiveStatus === 'online' ? '🟢 온라인' : '🔴 오프라인'}
            </Text>
          </Text>
          <Text className='text-label text-muted-foreground'>실제 네트워크: {realNetworkStatus}</Text>
          {overrideStatus && <Text className='text-label text-muted-foreground'>⚠️ 강제 설정: {overrideStatus}</Text>}
        </View>
        <View className='flex-row gap-xs'>
          <Pressable
            variant='outline'
            className='flex-1 flex-row items-center justify-center gap-xs py-xs rounded-lg border border-primary'
            onPress={setOverrideOnline}
          >
            <Wifi size={14} color='#228B22' />
            <Text className='text-label text-primary'>온라인</Text>
          </Pressable>
          <Pressable
            variant='outline'
            className='flex-1 flex-row items-center justify-center gap-xs py-xs rounded-lg border border-destructive'
            onPress={setOverrideOffline}
          >
            <WifiOff size={14} color='#BF4040' />
            <Text className='text-label text-destructive'>오프라인</Text>
          </Pressable>
          <Pressable
            variant='outline'
            className='flex-1 flex-row items-center justify-center gap-xs py-xs rounded-lg border border-card-border'
            onPress={clearOverride}
          >
            <RotateCcw size={14} color='#666' />
            <Text className='text-label text-muted-foreground'>실제</Text>
          </Pressable>
        </View>
      </View>

      {/* DB Stats Card */}
      <View className='rounded-lg bg-card p-md border border-card-border'>
        <View className='flex-row items-center gap-xs mb-sm'>
          <Database size={20} color='#228B22' />
          <Text className='text-title-medium text-foreground'>DB 통계</Text>
        </View>
        <View className='gap-2xs'>
          <Text className='text-body text-foreground'>여행: {counts.trips}개</Text>
          <Text className='text-body text-foreground'>일정: {counts.schedules}개</Text>
          <Text className='text-body text-foreground'>경비: {counts.expenses}개</Text>
          <Text className='text-body text-foreground'>활성화된 여행: {counts.activations}개</Text>
          <Text className='text-body text-foreground'>오프라인 지도: {counts.offlineCities}개</Text>
          {stats && (
            <>
              <Text className='text-body text-foreground'>동기화 대기: {stats.pending}개</Text>
              <Text className='text-body text-foreground'>동기화 실패: {stats.failed}개</Text>
              <Text className='text-body text-foreground'>진행 중: {stats.inProgress}개</Text>
            </>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View className='gap-sm'>
        <Pressable
          variant='outline'
          className='flex-row items-center justify-center gap-xs py-3 rounded-lg border border-card-border'
          onPress={onRefresh}
        >
          <RefreshCw size={16} color='#228B22' />
          <Text className='text-body text-primary'>새로고침</Text>
        </Pressable>

        <Pressable
          variant='outline'
          className='flex-row items-center justify-center gap-xs py-3 rounded-lg border border-primary bg-primary/5'
          onPress={onManualSync}
        >
          <Upload size={16} color='#228B22' />
          <Text className='text-body text-primary font-semibold'>전체 동기화 (Push + Pull)</Text>
        </Pressable>
      </View>
    </View>
  );
}
