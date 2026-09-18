import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, Alert, Text } from 'react-native';
import { MobileHeader, Container, Stack } from '@/shared/components';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import MapboxGL from '@rnmapbox/maps';
import {
  getDatabase,
  resetDatabase,
  trips,
  schedules,
  expenses,
  syncQueue,
  offlineCities,
  tripActivations,
} from '@/shared/db';
import type { Trip, Schedule, Expense, SyncQueueItem, OfflineCity, TripActivation } from '@/shared/db/schema';
import { getSyncQueueStats } from '@/shared/services/sync/queue';
import { useSyncContext } from '@/shared/services/sync/provider';
import type { SyncSkipReason } from '@/shared/services/sync/lifecycle';
import { DashboardView } from './DashboardView';
import { DataInspectorView } from './DataInspectorView';
import { ToolsView } from './ToolsView';
import { Pressable } from '@repo/ui';

type ViewMode = 'dashboard' | 'inspector' | 'tools';

const SYNC_SKIP_MESSAGES: Record<SyncSkipReason, string> = {
  'already-running': '이미 동기화가 진행 중입니다.',
  'session-ending': '로그아웃 또는 회원 탈퇴가 진행 중입니다.',
  'database-not-ready': '로컬 DB 준비가 완료되지 않았습니다. 앱을 다시 실행해 주세요.',
  'signed-out': '로그인 후 동기화할 수 있습니다.',
  'session-expired': '다시 로그인한 후 동기화할 수 있습니다.',
  'network-offline': '네트워크 연결 후 다시 시도해 주세요.',
  'network-unknown': '네트워크 연결을 확인한 후 다시 시도해 주세요.',
  'override-active': '네트워크 강제 설정을 해제한 후 동기화할 수 있습니다.',
};

export default function DebugScreen() {
  const { triggerManualSync } = useSyncContext();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Data States
  const [tripsData, setTripsData] = useState<Trip[]>([]);
  const [schedulesData, setSchedulesData] = useState<Schedule[]>([]);
  const [expensesData, setExpensesData] = useState<Expense[]>([]);
  const [offlineCitiesData, setOfflineCitiesData] = useState<OfflineCity[]>([]);
  const [syncQueueData, setSyncQueueData] = useState<SyncQueueItem[]>([]);
  const [tripActivationsData, setTripActivationsData] = useState<TripActivation[]>([]);
  const [stats, setStats] = useState<{ pending: number; inProgress: number; failed: number; total: number } | null>(
    null,
  );

  const loadData = async () => {
    try {
      setRefreshing(true);

      const tripsResult = await getDatabase().select().from(trips).all();
      setTripsData(tripsResult);

      const schedulesResult = await getDatabase().select().from(schedules).all();
      setSchedulesData(schedulesResult);

      const expensesResult = await getDatabase().select().from(expenses).all();
      setExpensesData(expensesResult);

      const offlineCitiesResult = await getDatabase().select().from(offlineCities).all();
      setOfflineCitiesData(offlineCitiesResult);

      const syncQueueResult = await getDatabase().select().from(syncQueue).all();
      setSyncQueueData(syncQueueResult);

      const tripActivationsResult = await getDatabase().select().from(tripActivations).all();
      setTripActivationsData(tripActivationsResult);

      const statsResult = await getSyncQueueStats();
      setStats(statsResult);

      console.log('[Debug] Debug data loaded');
    } catch (error) {
      console.error('[Debug] Failed to load debug data:', error);
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
            console.error('[Debug] Failed to reset DB:', error);
            Alert.alert('❌ 실패', 'DB 초기화에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleClearOfflineMaps = () => {
    Alert.alert(
      '⚠️ 오프라인 지도 완전 삭제',
      'Mapbox 네이티브 오프라인 팩과 DB의 offlineCities 레코드를 모두 삭제합니다.\n계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // Mapbox 네이티브 오프라인 팩 삭제
              const packs = await MapboxGL.offlineManager.getPacks();
              console.log(`[Debug] Deleting ${packs.length} offline packs...`);

              for (const pack of packs) {
                await MapboxGL.offlineManager.deletePack(pack.name);
                console.log(`[Debug] Deleted pack: ${pack.name}`);
              }

              // DB의 offlineCities 테이블 비우기
              await getDatabase().delete(offlineCities);
              console.log('[Debug] Cleared offlineCities table');

              await loadData();
              Alert.alert('✅ 성공', `${packs.length}개의 오프라인 지도와 DB 레코드를 모두 삭제했습니다.`);
            } catch (error) {
              console.error('[Debug] Failed to clear offline maps:', error);
              Alert.alert('❌ 실패', '오프라인 지도 삭제에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  const handleManualSync = async () => {
    try {
      const result = await triggerManualSync();

      if (result.status === 'completed') {
        await loadData();
        Alert.alert('✅ 성공', '동기화가 완료되었습니다.');
      } else if (result.status === 'skipped') {
        Alert.alert('동기화 보류', SYNC_SKIP_MESSAGES[result.reason]);
      } else {
        Alert.alert('❌ 실패', '동기화에 실패했습니다.');
      }
    } catch (error) {
      console.error('[Debug] Manual sync error:', error);
      Alert.alert('❌ 오류', '동기화 중 오류가 발생했습니다.');
    }
  };

  const handleManualActivate = async (tripId: string, tripName: string) => {
    Alert.alert('🟢 수동 활성화', `"${tripName}" 여행을 활성화하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '활성화',
        onPress: async () => {
          try {
            const { generateId } = await import('@/shared/services/id/ulid');
            const { getCurrentISOString } = await import('@/shared/db/utils');
            const { eq } = await import('drizzle-orm');

            const now = getCurrentISOString();
            const trip = tripsData.find((t) => t.id === tripId);

            if (!trip) {
              Alert.alert('❌ 오류', '여행을 찾을 수 없습니다.');
              return;
            }

            // 기존 활성화 확인
            const existing = await getDatabase()
              .select()
              .from(tripActivations)
              .where(eq(tripActivations.tripId, tripId))
              .get();

            if (existing) {
              // 이미 활성화 레코드가 있으면 업데이트
              await getDatabase()
                .update(tripActivations)
                .set({
                  isActivated: true,
                  activatedAt: now,
                  deactivatedAt: null,
                  updatedAt: now,
                })
                .where(eq(tripActivations.tripId, tripId));
            } else {
              // 새 활성화 레코드 생성
              const expiresAt = new Date(trip.endDate);
              expiresAt.setDate(expiresAt.getDate() + 7);

              await getDatabase().insert(tripActivations).values({
                id: generateId(),
                tripId,
                userId: trip.userId,
                isActivated: true,
                activatedAt: now,
                expiresAt: expiresAt.toISOString(),
                syncStatus: 'PENDING',
                createdAt: now,
                updatedAt: now,
              });
            }

            await loadData();
            Alert.alert('✅ 성공', `"${tripName}" 여행이 활성화되었습니다.`);
          } catch (error) {
            console.error('[Debug] Failed to activate trip:', error);
            Alert.alert('❌ 실패', '활성화에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleManualDeactivate = async (tripId: string, tripName: string) => {
    Alert.alert('🔴 수동 비활성화', `"${tripName}" 여행을 비활성화하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '비활성화',
        style: 'destructive',
        onPress: async () => {
          try {
            const { getCurrentISOString } = await import('@/shared/db/utils');
            const { eq } = await import('drizzle-orm');

            const now = getCurrentISOString();

            await getDatabase()
              .update(tripActivations)
              .set({
                isActivated: false,
                deactivatedAt: now,
                updatedAt: now,
              })
              .where(eq(tripActivations.tripId, tripId));

            await loadData();
            Alert.alert('✅ 성공', `"${tripName}" 여행이 비활성화되었습니다.`);
          } catch (error) {
            console.error('[Debug] Failed to deactivate trip:', error);
            Alert.alert('❌ 실패', '비활성화에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleClearAllActivations = () => {
    Alert.alert(
      '⚠️ 활성화 데이터 완전 삭제',
      'tripActivations 테이블과 모든 로컬 여행 데이터(trips, schedules, expenses)를 삭제합니다.\n계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            try {
              // tripActivations 테이블 비우기
              await getDatabase().delete(tripActivations);
              console.log('[Debug] Cleared tripActivations table');

              // 로컬 여행 데이터 삭제
              await getDatabase().delete(trips);
              console.log('[Debug] Cleared trips table');

              await getDatabase().delete(schedules);
              console.log('[Debug] Cleared schedules table');

              await getDatabase().delete(expenses);
              console.log('[Debug] Cleared expenses table');

              await loadData();
              Alert.alert('✅ 성공', '모든 활성화 정보와 로컬 여행 데이터가 삭제되었습니다.');
            } catch (error) {
              console.error('[Debug] Failed to clear activations:', error);
              Alert.alert('❌ 실패', '초기화에 실패했습니다.');
            }
          },
        },
      ],
    );
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

      <View className='px-md py-sm bg-background'>
        <View className='flex-row p-1 bg-muted rounded-lg'>
          {(['dashboard', 'inspector', 'tools'] as const).map((mode) => (
            <Pressable
              key={mode}
              variant='ghost'
              className={`flex-1 py-xs items-center rounded-md ${
                viewMode === mode ? 'bg-background shadow-sm' : 'bg-transparent'
              }`}
              onPress={() => setViewMode(mode)}
            >
              <Text
                className={`text-label font-semibold ${
                  viewMode === mode ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {mode === 'dashboard' ? '대시보드' : mode === 'inspector' ? '데이터' : '도구'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className='flex-1' refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {viewMode === 'dashboard' && (
              <DashboardView
                stats={stats}
                counts={{
                  trips: tripsData.length,
                  schedules: schedulesData.length,
                  expenses: expensesData.length,
                  activations: tripActivationsData.filter((a) => a.isActivated).length,
                  offlineCities: offlineCitiesData.length,
                }}
                onRefresh={loadData}
                onManualSync={handleManualSync}
              />
            )}
            {viewMode === 'inspector' && (
              <DataInspectorView
                data={{
                  trips: tripsData,
                  schedules: schedulesData,
                  expenses: expensesData,
                  activations: tripActivationsData,
                  offlineCities: offlineCitiesData,
                  syncQueue: syncQueueData,
                }}
                onActivateTrip={handleManualActivate}
                onDeactivateTrip={handleManualDeactivate}
              />
            )}
            {viewMode === 'tools' && (
              <ToolsView
                onResetDatabase={handleResetDatabase}
                onClearOfflineMaps={handleClearOfflineMaps}
                onClearActivations={handleClearAllActivations}
              />
            )}
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
