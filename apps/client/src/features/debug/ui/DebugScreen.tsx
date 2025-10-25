import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { Pressable } from '@repo/ui';
import { MobileHeader, Container, Stack } from '@/shared/components';
import { ArrowLeft, Database, Trash2, RefreshCw, Upload, Wifi, WifiOff, RotateCcw } from 'lucide-react-native';
import { router } from 'expo-router';
import { db, trips, schedules, syncQueue } from '@/shared/db';
import type { Trip, Schedule, SyncQueueItem } from '@/shared/db/schema';
import { resetDatabase } from '@/shared/db';
import { getSyncQueueStats } from '@/shared/services/sync/queue';
import { triggerSync } from '@/shared/services/sync/engine';
import { useNetworkOverride } from '../context/NetworkOverrideContext';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

export default function DebugScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [tripsData, setTripsData] = useState<Trip[]>([]);
  const [schedulesData, setSchedulesData] = useState<Schedule[]>([]);
  const [syncQueueData, setSyncQueueData] = useState<SyncQueueItem[]>([]);
  const [stats, setStats] = useState<{ pending: number; inProgress: number; failed: number; total: number } | null>(
    null,
  );

  const { overrideStatus, setOverrideOnline, setOverrideOffline, clearOverride } = useNetworkOverride();
  const realNetworkStatus = useNetworkStatus();
  const effectiveStatus = overrideStatus ?? realNetworkStatus;

  const loadData = async () => {
    try {
      setRefreshing(true);

      const tripsResult = await db.select().from(trips).all();
      setTripsData(tripsResult);

      const schedulesResult = await db.select().from(schedules).all();
      setSchedulesData(schedulesResult);

      const syncQueueResult = await db.select().from(syncQueue).all();
      setSyncQueueData(syncQueueResult);

      const statsResult = await getSyncQueueStats();
      setStats(statsResult);

      console.log('✅ Debug data loaded');
    } catch (error) {
      console.error('❌ Failed to load debug data:', error);
      Alert.alert('오류', '데이터를 불러올 수 없습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleResetDatabase = () => {
    Alert.alert('⚠️ DB 초기화', '모든 로컬 데이터가 삭제됩니다.\n계속하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '초기화',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetDatabase();
            await loadData();
            Alert.alert('✅ 성공', 'DB가 초기화되었습니다.');
          } catch (error) {
            console.error('❌ Failed to reset DB:', error);
            Alert.alert('❌ 실패', 'DB 초기화에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleManualSync = async () => {
    try {
      const result = await triggerSync();

      if (result.success) {
        await loadData(); // 데이터 새로고침
        Alert.alert('✅ 성공', result.message);
      } else {
        Alert.alert('❌ 실패', result.message);
      }
    } catch (error) {
      console.error('❌ Manual sync error:', error);
      Alert.alert('❌ 오류', '동기화 중 오류가 발생했습니다.');
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  return (
    <View className='flex-1 bg-background'>
      <MobileHeader
        title='디버그 콘솔'
        leftIcon={<ArrowLeft size={20} color='#1F1F1F' />}
        onLeftPress={() => router.back()}
      />

      <ScrollView className='flex-1' refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            <View className='rounded-lg bg-card p-md border border-card-border'>
              <View className='flex-row items-center gap-xs mb-sm'>
                <Database size={20} color='#228B22' />
                <Text className='text-title-medium text-foreground'>DB 통계</Text>
              </View>
              <View className='gap-2xs'>
                <Text className='text-body text-foreground'>여행: {tripsData.length}개</Text>
                <Text className='text-body text-foreground'>일정: {schedulesData.length}개</Text>
                {stats && (
                  <>
                    <Text className='text-body text-foreground'>동기화 대기: {stats.pending}개</Text>
                    <Text className='text-body text-foreground'>동기화 실패: {stats.failed}개</Text>
                    <Text className='text-body text-foreground'>진행 중: {stats.inProgress}개</Text>
                  </>
                )}
              </View>
            </View>

            <View className='rounded-lg bg-card p-md border border-card-border'>
              <View className='flex-row items-center gap-xs mb-sm'>
                {effectiveStatus === 'online' ? (
                  <Wifi size={20} color='#228B22' />
                ) : (
                  <WifiOff size={20} color='#BF4040' />
                )}
                <Text className='text-title-medium text-foreground'>네트워크 상태</Text>
              </View>
              <View className='gap-2xs mb-sm'>
                <Text className='text-body text-foreground'>
                  현재 상태:{' '}
                  <Text
                    className={
                      effectiveStatus === 'online' ? 'text-primary font-semibold' : 'text-destructive font-semibold'
                    }
                  >
                    {effectiveStatus === 'online' ? '🟢 온라인' : '🔴 오프라인'}
                  </Text>
                </Text>
                <Text className='text-label text-muted-foreground'>실제 네트워크: {realNetworkStatus}</Text>
                {overrideStatus && (
                  <Text className='text-label text-muted-foreground'>⚠️ 강제 설정: {overrideStatus}</Text>
                )}
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

            <View className='flex-row gap-sm'>
              <Pressable
                variant='outline'
                className='flex-1 flex-row items-center justify-center gap-xs py-sm rounded-lg border border-card-border'
                onPress={loadData}
              >
                <RefreshCw size={16} color='#228B22' />
                <Text className='text-body text-primary'>새로고침</Text>
              </Pressable>
              <Pressable
                variant='outline'
                className='flex-1 flex-row items-center justify-center gap-xs py-sm rounded-lg border border-destructive'
                onPress={handleResetDatabase}
              >
                <Trash2 size={16} color='#BF4040' />
                <Text className='text-body text-destructive'>DB 초기화</Text>
              </Pressable>
            </View>

            <Pressable
              variant='outline'
              className='flex-row items-center justify-center gap-xs py-sm rounded-lg border border-primary bg-primary/5'
              onPress={handleManualSync}
            >
              <Upload size={16} color='#228B22' />
              <Text className='text-body text-primary font-semibold'>🔄 전체 동기화 (Push + Pull)</Text>
            </Pressable>

            <View className='rounded-lg bg-card p-md border border-card-border'>
              <Text className='text-title-medium text-foreground mb-sm'>Trips 테이블</Text>
              {tripsData.length === 0 ? (
                <Text className='text-body text-muted-foreground'>데이터가 없습니다.</Text>
              ) : (
                <View className='gap-xs'>
                  {tripsData.map((trip) => (
                    <View key={trip.id} className='p-xs rounded bg-muted border border-card-border'>
                      <Text className='text-label text-muted-foreground'>ID: {trip.id.substring(0, 8)}...</Text>
                      <Text className='text-body text-foreground font-semibold'>{trip.name}</Text>
                      <Text className='text-label text-muted-foreground'>
                        {trip.destination}, {trip.country}
                      </Text>
                      <Text className='text-label text-muted-foreground'>
                        Version: {trip.version} | {trip.deletedAt ? ' (삭제됨)' : ' (활성)'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View className='rounded-lg bg-card p-md border border-card-border'>
              <Text className='text-title-medium text-foreground mb-sm'>Schedules 테이블</Text>
              {schedulesData.length === 0 ? (
                <Text className='text-body text-muted-foreground'>데이터가 없습니다.</Text>
              ) : (
                <View className='gap-xs'>
                  {schedulesData.map((schedule) => (
                    <View key={schedule.id} className='p-xs rounded bg-muted border border-card-border'>
                      <Text className='text-label text-muted-foreground'>ID: {schedule.id.substring(0, 8)}...</Text>
                      <Text className='text-body text-foreground font-semibold'>{schedule.title}</Text>
                      <Text className='text-label text-muted-foreground'>
                        {schedule.date} {schedule.time}
                      </Text>
                      <Text className='text-label text-muted-foreground'>
                        Trip ID: {schedule.tripId.substring(0, 8)}...
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View className='rounded-lg bg-card p-md border border-card-border'>
              <Text className='text-title-medium text-foreground mb-sm'>Sync Queue 테이블</Text>
              {syncQueueData.length === 0 ? (
                <Text className='text-body text-muted-foreground'>동기화 대기 중인 작업이 없습니다.</Text>
              ) : (
                <View className='gap-xs'>
                  {syncQueueData.map((task) => (
                    <View
                      key={task.id}
                      className={`p-xs rounded border ${
                        task.status === 'PENDING'
                          ? 'bg-accent border-primary'
                          : task.status === 'FAILED'
                            ? 'bg-destructive/10 border-destructive'
                            : 'bg-muted border-card-border'
                      }`}
                    >
                      <Text className='text-label text-muted-foreground'>ID: {task.id.substring(0, 8)}...</Text>
                      <Text className='text-body text-foreground font-semibold'>
                        {task.action} {task.tableName}
                      </Text>
                      <Text className='text-label text-muted-foreground'>
                        Record ID: {task.recordId.substring(0, 8)}...
                      </Text>
                      <Text
                        className={`text-label font-semibold ${
                          task.status === 'PENDING'
                            ? 'text-primary'
                            : task.status === 'FAILED'
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                        }`}
                      >
                        Status: {task.status} (재시도: {task.retryCount})
                      </Text>
                      <Text className='text-label-small text-muted-foreground mt-xs' numberOfLines={3}>
                        {task.payload}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
