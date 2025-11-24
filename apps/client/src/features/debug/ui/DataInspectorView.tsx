import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Pressable } from '@repo/ui';
import { Power, PowerOff } from 'lucide-react-native';
import { formatISOToLocalDateTime } from '@/shared/lib/datetime';
import type { Trip, Schedule, Expense, SyncQueueItem, OfflineCity, TripActivation } from '@/shared/db/schema';

interface DataInspectorViewProps {
  data: {
    trips: Trip[];
    schedules: Schedule[];
    expenses: Expense[];
    activations: TripActivation[];
    offlineCities: OfflineCity[];
    syncQueue: SyncQueueItem[];
  };
  onActivateTrip: (tripId: string, tripName: string) => void;
  onDeactivateTrip: (tripId: string, tripName: string) => void;
}

type Tab = 'trips' | 'schedules' | 'expenses' | 'activations' | 'offline' | 'sync';

export function DataInspectorView({ data, onActivateTrip, onDeactivateTrip }: DataInspectorViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('trips');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'trips', label: '여행' },
    { id: 'schedules', label: '일정' },
    { id: 'expenses', label: '경비' },
    { id: 'activations', label: '활성화' },
    { id: 'offline', label: '오프라인 지도' },
    { id: 'sync', label: '동기화 대기열' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'trips':
        return (
          <View className='gap-xs'>
            {data.trips.length === 0 ? (
              <Text className='text-body text-muted-foreground'>데이터가 없습니다.</Text>
            ) : (
              data.trips.map((trip) => {
                const activation = data.activations.find((a) => a.tripId === trip.id);
                const isActivated = activation?.isActivated ?? false;

                return (
                  <View key={trip.id} className='p-xs rounded bg-muted border border-card-border'>
                    <Text className='text-label text-muted-foreground'>ID: {trip.id.substring(0, 8)}...</Text>
                    <Text className='text-body text-foreground font-semibold'>{trip.name}</Text>
                    <Text className='text-label text-muted-foreground'>
                      {trip.destination}, {trip.country}
                    </Text>
                    <Text className='text-label text-muted-foreground'>
                      버전: {trip.version} | {trip.deletedAt ? ' (삭제됨)' : ' (활성)'}
                    </Text>
                    <View className='flex-row gap-xs mt-xs'>
                      {isActivated ? (
                        <Pressable
                          variant='outline'
                          className='flex-1 flex-row items-center justify-center gap-xs py-xs rounded border border-destructive'
                          onPress={() => onDeactivateTrip(trip.id, trip.name)}
                        >
                          <PowerOff size={12} color='#BF4040' />
                          <Text className='text-label-small text-destructive'>비활성화</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          variant='outline'
                          className='flex-1 flex-row items-center justify-center gap-xs py-xs rounded border border-primary'
                          onPress={() => onActivateTrip(trip.id, trip.name)}
                        >
                          <Power size={12} color='#228B22' />
                          <Text className='text-label-small text-primary'>활성화</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        );
      case 'schedules':
        return (
          <View className='gap-xs'>
            {data.schedules.length === 0 ? (
              <Text className='text-body text-muted-foreground'>데이터가 없습니다.</Text>
            ) : (
              data.schedules.map((schedule) => (
                <View key={schedule.id} className='p-xs rounded bg-muted border border-card-border'>
                  <Text className='text-label text-muted-foreground'>ID: {schedule.id.substring(0, 8)}...</Text>
                  <Text className='text-body text-foreground font-semibold'>{schedule.title}</Text>
                  <Text className='text-label text-muted-foreground'>
                    {formatISOToLocalDateTime(schedule.scheduledAt)}
                  </Text>
                  <Text className='text-label text-muted-foreground'>
                    여행 ID: {schedule.tripId.substring(0, 8)}...
                  </Text>
                </View>
              ))
            )}
          </View>
        );
      case 'expenses':
        return (
          <View className='gap-xs'>
            {data.expenses.length === 0 ? (
              <Text className='text-body text-muted-foreground'>데이터가 없습니다.</Text>
            ) : (
              data.expenses.map((expense) => (
                <View key={expense.id} className='p-xs rounded bg-muted border border-card-border'>
                  <Text className='text-label text-muted-foreground'>ID: {expense.id.substring(0, 8)}...</Text>
                  <Text className='text-body text-foreground font-semibold'>{expense.title}</Text>
                  <Text className='text-label text-muted-foreground'>
                    {expense.currency} {expense.amount} ({expense.category})
                  </Text>
                  <Text className='text-label text-muted-foreground'>날짜: {expense.date}</Text>
                  <Text className='text-label text-muted-foreground'>여행 ID: {expense.tripId.substring(0, 8)}...</Text>
                </View>
              ))
            )}
          </View>
        );
      case 'activations':
        return (
          <View className='gap-xs'>
            {data.activations.length === 0 ? (
              <Text className='text-body text-muted-foreground'>활성화된 여행이 없습니다.</Text>
            ) : (
              data.activations.map((activation) => {
                const trip = data.trips.find((t) => t.id === activation.tripId);
                return (
                  <View
                    key={activation.id}
                    className={`p-xs rounded border ${
                      activation.isActivated ? 'bg-primary/10 border-primary' : 'bg-muted border-card-border'
                    }`}
                  >
                    <Text className='text-label text-muted-foreground'>ID: {activation.id.substring(0, 8)}...</Text>
                    {trip && <Text className='text-body text-foreground font-semibold'>{trip.name}</Text>}
                    <Text className='text-label text-muted-foreground'>
                      여행 ID: {activation.tripId.substring(0, 8)}...
                    </Text>
                    <Text
                      className={`text-label font-semibold ${
                        activation.isActivated ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      상태: {activation.isActivated ? '🟢 활성화됨' : '🔴 비활성'}
                    </Text>
                    <Text className='text-label text-muted-foreground'>
                      동기화: {activation.syncStatus} ({activation.syncProgress}%)
                    </Text>
                    <Text className='text-label text-muted-foreground'>
                      활성화: {formatISOToLocalDateTime(activation.activatedAt)}
                    </Text>
                    {activation.deactivatedAt && (
                      <Text className='text-label text-muted-foreground'>
                        비활성화: {formatISOToLocalDateTime(activation.deactivatedAt)}
                      </Text>
                    )}
                    <Text className='text-label text-muted-foreground'>
                      만료: {formatISOToLocalDateTime(activation.expiresAt)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        );
      case 'offline':
        return (
          <View className='gap-xs'>
            {data.offlineCities.length === 0 ? (
              <Text className='text-body text-muted-foreground'>다운로드된 오프라인 지도가 없습니다.</Text>
            ) : (
              data.offlineCities.map((city) => (
                <View key={city.cityId} className='p-xs rounded bg-muted border border-card-border'>
                  <Text className='text-label text-muted-foreground'>도시 ID: {city.cityId}</Text>
                  <Text className='text-body text-foreground font-semibold'>
                    {city.cityName}, {city.country}
                  </Text>
                  <Text className='text-label text-muted-foreground'>
                    중심: {city.centerLatitude}, {city.centerLongitude}
                  </Text>
                  <Text className='text-label text-muted-foreground'>
                    반경: {city.radiusKm}km | 크기: {(city.sizeBytes / 1024 / 1024).toFixed(2)}MB
                  </Text>
                  <Text className='text-label text-muted-foreground'>
                    타일: {city.tileCount ?? 'N/A'}개 | 참조 수: {city.referenceCount}
                  </Text>
                </View>
              ))
            )}
          </View>
        );
      case 'sync':
        return (
          <View className='gap-xs'>
            {data.syncQueue.length === 0 ? (
              <Text className='text-body text-muted-foreground'>동기화 대기 중인 작업이 없습니다.</Text>
            ) : (
              data.syncQueue.map((task) => (
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
                    레코드 ID: {task.recordId.substring(0, 8)}...
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
                    상태: {task.status} (재시도: {task.retryCount})
                  </Text>
                  <Text className='text-label-small text-muted-foreground mt-xs' numberOfLines={3}>
                    {task.payload}
                  </Text>
                </View>
              ))
            )}
          </View>
        );
    }
  };

  return (
    <View className='flex-1'>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-sm'>
        <View className='flex-row gap-xs'>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`px-md py-xs rounded-full border ${
                activeTab === tab.id ? 'bg-primary border-primary' : 'bg-card border-card-border'
              }`}
            >
              <Text
                className={`text-label font-semibold ${
                  activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View className='rounded-lg bg-card p-md border border-card-border'>{renderContent()}</View>
    </View>
  );
}
