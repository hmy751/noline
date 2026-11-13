import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View, StyleSheet } from 'react-native';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Drawer, Pressable } from '@repo/ui';

import { expenseQueryKeys } from '@/entities/expense/data/keys';
import { ExpenseRepository } from '@/entities/expense/repository/expense-repository';
import { routeQueryKeys } from '@/entities/route/data/keys';
import { scheduleQueryKeys } from '@/entities/schedule/data/keys';
import { ScheduleRepository } from '@/entities/schedule/repository/schedule-repository';
import { tripQueryKeys } from '@/entities/trip/data/keys';
import { editableGroups } from '@/shared/lib/edit-fields';
import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';
import { ConfirmedDeletionError, ConfirmedUpdateError } from '@/shared/services/edit-stamp/errors';
import { listLegacyHolds, clearLegacyHold, subscribeLegacyHolds } from '@/shared/services/sync/legacy-holds';

type LegacyHold = Awaited<ReturnType<typeof listLegacyHolds>>[number];
const EDIT_GROUP_LABELS: Record<string, string> = {
  title: '제목',
  scheduledAt: '출발 시각',
  location: '장소',
  amount: '지출액',
  category: '분류',
  date: '날짜',
  scheduleId: '연결 일정',
  hasReceipt: '영수증 여부',
  receiptUrl: '영수증',
};
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  food: '식사',
  transport: '교통',
  transportation: '교통',
  shopping: '쇼핑',
  accommodation: '숙박',
  sightseeing: '관광',
  activity: '활동',
  other: '기타',
};
type RecoveryProps = { table: 'schedules' | 'expenses'; tripId?: string | null };
type FieldValues = Record<string, unknown>;

const formatGroupValue = (record: FieldValues, fields: readonly string[]): string =>
  fields
    .map((field) => {
      const value = record[field];

      if (value == null || value === '') {
        return '없음';
      }

      const text = String(value);
      return field === 'category' ? (LEGACY_CATEGORY_LABELS[text] ?? text) : text;
    })
    .join(' · ');

/** 구버전 요청에 포함된 값만 표시한다. 복구 저장 시에는 선택한 묶음의 나머지 값을 현재 기록에서 채운다. */
export const LegacyUpdateRecovery = ({ table, tripId }: RecoveryProps) => {
  const queryClient = useQueryClient();
  const { data: holds = [] } = useQuery({
    queryKey: ['legacy-update-holds', table, tripId],
    queryFn: () => listLegacyHolds(table),
  });
  const [selectedHold, setSelectedHold] = useState<LegacyHold | null>(null);
  const [currentRecord, setCurrentRecord] = useState<FieldValues | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeLegacyHolds(() => {
        queryClient.invalidateQueries({ queryKey: ['legacy-update-holds'] });
      }),
    [queryClient],
  );

  useEffect(() => {
    setCurrentRecord(null);

    if (!selectedHold) {
      return;
    }

    let isCurrentSelection = true;
    setSelectedGroups([]);
    setErrorMessage(null);

    const loadCurrentRecord = async () => {
      try {
        const record =
          table === 'schedules'
            ? await ScheduleRepository.getById(selectedHold.recordId, selectedHold.tripId)
            : (await ExpenseRepository.getByTripId(selectedHold.tripId)).find(
                (expense) => expense.id === selectedHold.recordId,
              );

        if (isCurrentSelection) {
          if (record) {
            setCurrentRecord(record);
          } else {
            setErrorMessage('현재 기록을 찾지 못했어요. 입력은 보관되어 있어요.');
          }
        }
      } catch {
        if (isCurrentSelection) {
          setErrorMessage('현재 값을 불러오지 못했어요. 닫고 다시 확인해 주세요.');
        }
      }
    };

    loadCurrentRecord();

    return () => {
      isCurrentSelection = false;
    };
  }, [selectedHold, table]);

  const tripHolds = holds.filter((hold) => hold.tripId === tripId);
  const groups = Object.entries(editableGroups[table])
    .map(([name, fields]) => ({
      name,
      fields,
      savedFields: fields.filter((field) => selectedHold && Object.hasOwn(selectedHold.payload, field)),
    }))
    .filter(({ savedFields }) => savedFields.length > 0);

  const dismissHold = async (hold: LegacyHold) => {
    await clearLegacyHold(hold.id);
    setSelectedHold(null);
    await queryClient.invalidateQueries();
  };

  const handleSaveSelected = async () => {
    if (!selectedHold || !currentRecord || isResolving || !selectedGroups.length) {
      return;
    }

    setIsResolving(true);
    setErrorMessage(null);

    try {
      const patch: FieldValues = {};

      for (const { name, fields } of groups) {
        if (!selectedGroups.includes(name)) {
          continue;
        }

        for (const field of fields) {
          patch[field] = Object.hasOwn(selectedHold.payload, field)
            ? selectedHold.payload[field]
            : (currentRecord[field] ?? null);
        }
      }

      if (table === 'schedules') {
        for (const coordinate of ['latitude', 'longitude']) {
          if (patch[coordinate] != null) {
            patch[coordinate] = Number(patch[coordinate]);
          }
        }

        await ScheduleRepository.update(selectedHold.recordId, selectedHold.tripId, patch);
      } else {
        await ExpenseRepository.update(selectedHold.recordId, selectedHold.tripId, patch);
      }

      await dismissHold(selectedHold);
    } catch (error) {
      if (error instanceof ConfirmedDeletionError) {
        // 삭제 반영과 보류 정리는 repository에서 끝났다. 같은 보류를 다시 지우지 않는다.
        setSelectedHold(null);
        Alert.alert('삭제 확인', error.message);
        const queryKeys = [
          expenseQueryKeys.base,
          ['legacy-update-holds', table, tripId],
          ...(table === 'schedules' || error.code === 'TRIP_DELETED'
            ? [scheduleQueryKeys.base, routeQueryKeys.base]
            : []),
          ...(error.code === 'TRIP_DELETED' ? [tripQueryKeys.base] : []),
        ];

        Promise.all(queryKeys.map((queryKey) => cancelAndInvalidateQueries(queryClient, { queryKey }))).catch(
          (refreshError) => console.error('[SyncRecovery] cache refresh failed', refreshError),
        );
      } else if (error instanceof ConfirmedUpdateError) {
        setErrorMessage(`${error.message} 이전 입력은 보관되어 있어요. 닫고 다시 열어 확인해주세요.`);
        // 현재 비교값은 다시 열 때 조회한다. 목록 갱신 실패가 확인된 서버 결과를 바꾸지는 않는다.
        cancelAndInvalidateQueries(queryClient, {
          queryKey: table === 'expenses' ? expenseQueryKeys.base : scheduleQueryKeys.base,
        }).catch((refreshError) => console.error('[SyncRecovery] cache refresh failed', refreshError));
      } else {
        setErrorMessage('저장하지 못했어요. 이전 입력은 보관되어 있어요. 다시 시도해 주세요.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleKeepCurrent = () => {
    if (!selectedHold) {
      return;
    }

    Alert.alert('현재 값 유지', '이전 입력을 정리하고 현재 값을 유지할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '현재 값 유지',
        onPress: async () => {
          setIsResolving(true);

          try {
            await dismissHold(selectedHold);
          } catch {
            setErrorMessage('이전 입력을 정리하지 못했어요. 다시 시도해 주세요.');
          } finally {
            setIsResolving(false);
          }
        },
      },
    ]);
  };

  const handleToggleGroup = (group: string) => {
    setSelectedGroups((previous) =>
      previous.includes(group) ? previous.filter((name) => name !== group) : [...previous, group],
    );
  };

  const handleClose = () => {
    if (!isResolving) {
      setSelectedHold(null);
    }
  };

  return (
    <>
      {tripHolds.length > 0 && (
        <ScrollView style={styles.entries} contentContainerStyle={styles.entriesContent}>
          {tripHolds.map((hold) => (
            <View key={hold.id} className='px-md py-sm'>
              <Pressable accessibilityRole='button' variant='outline' onPress={() => setSelectedHold(hold)}>
                {`수정 확인 · ${String(hold.payload.title ?? hold.current.title ?? '이전 입력')}`}
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      <Drawer isOpen={!!selectedHold} onClose={handleClose} title='수정 확인'>
        <ScrollView>
          <View className='gap-md'>
            <Text className='text-body text-foreground'>
              이전 수정이 반영되지 않았어요. 이전 요청에 담긴 값과 현재 값을 확인하고, 다시 저장할 항목만 선택해 주세요.
            </Text>
            {selectedHold &&
              currentRecord &&
              groups.map(({ name, savedFields }) => {
                const isSelected = selectedGroups.includes(name);
                const label = EDIT_GROUP_LABELS[name] ?? name;
                const currentValue = formatGroupValue(currentRecord, savedFields);
                const previousValue = formatGroupValue(selectedHold.payload, savedFields);

                return (
                  <Pressable
                    accessibilityRole='button'
                    key={name}
                    size='auto'
                    className='py-sm'
                    variant={isSelected ? 'default' : 'outline'}
                    onPress={() => handleToggleGroup(name)}
                    disabled={isResolving}
                  >
                    {`${isSelected ? '✓ ' : ''}${label}\n현재: ${currentValue}\n이전 요청: ${previousValue}`}
                  </Pressable>
                );
              })}
            {errorMessage && (
              <Text accessibilityRole='alert' className='text-body text-destructive'>
                {errorMessage}
              </Text>
            )}
            <Pressable
              accessibilityRole='button'
              disabled={isResolving || !currentRecord || !selectedGroups.length}
              onPress={handleSaveSelected}
            >
              {isResolving ? '저장 중...' : '선택한 항목 다시 저장'}
            </Pressable>
            <Pressable accessibilityRole='button' variant='outline' disabled={isResolving} onPress={handleKeepCurrent}>
              현재 값 유지
            </Pressable>
            <Pressable accessibilityRole='button' variant='ghost' disabled={isResolving} onPress={handleClose}>
              닫기
            </Pressable>
          </View>
        </ScrollView>
      </Drawer>
    </>
  );
};

const styles = StyleSheet.create({ entries: { maxHeight: 160 }, entriesContent: { flexGrow: 0 } });
