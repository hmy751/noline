import { useGetTrips } from '@/entities/trip';
import { useRef, useLayoutEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronDown, MapPin } from 'lucide-react-native';
import { Pressable, Select } from '@repo/ui';
import { Field } from '@/shared/components/Form';
import { PolicyErrorDisplay } from '@/shared/components';
import { useTripSchedulesReadQuery } from '@/features/schedule/read-schedules';
import type { Schedule } from '@/entities/schedule';
import { formatISOToTimeZoneDate, formatISOToTimeZoneTime, formatISOToTimeZoneDateTime } from '@/shared/lib/datetime';

type Props = {
  tripId: string;
  expenseDate: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  enabled?: boolean;
};

function scheduleLabel(schedule: Schedule, timeZone: string): string {
  return `${schedule.title} · ${formatISOToTimeZoneDateTime(schedule.scheduledAt, timeZone)}`;
}

function groupSchedulesByDate(schedules: Schedule[], timeZone: string): Map<string, Schedule[]> {
  const groups = new Map<string, Schedule[]>();
  const chronological = [...schedules].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  for (const schedule of chronological) {
    const date = formatISOToTimeZoneDate(schedule.scheduledAt, timeZone);
    const group = groups.get(date);
    if (group) group.push(schedule);
    else groups.set(date, [schedule]);
  }
  return groups;
}

/** 후보 조회 권한과 초안에 이미 연결한 일정의 표시 수명을 분리한다. 날짜는 후보를 제한하지 않는다. */
export function ExpenseScheduleField({ tripId, expenseDate, value, onChange, error, enabled = true }: Props) {
  const { data: trips } = useGetTrips();
  const timeZone = trips?.find((trip) => trip.id === tripId)?.timeZone;
  const displayTimeZone = timeZone ?? 'UTC';
  const { view, access, actions } = useTripSchedulesReadQuery(tripId, { enabled });
  const schedules = view.kind === 'ready' ? view.data : [];
  const selected = schedules.find((schedule) => schedule.id === value);
  const selectedLabel = selected ? scheduleLabel(selected, displayTimeZone) : undefined;
  const remembered = useRef<{ tripId: string; id: string; label: string } | null>(null);
  useLayoutEffect(() => {
    if (selectedLabel && value) remembered.current = { tripId, id: value, label: selectedLabel };
  }, [tripId, value, selectedLabel]);
  const canSelect = view.kind === 'ready' && access.canFetch;
  const blockedPolicy = access.block?.reason === 'policy' ? access.block.policy : undefined;
  const label =
    selectedLabel ??
    (remembered.current?.tripId === tripId && remembered.current.id === value
      ? remembered.current.label
      : '기존 일정 연결을 유지합니다.');
  const scheduleList = useRef<ScrollView>(null);
  const groupOffsets = useRef<Record<string, number>>({});
  const hasScrolledToExpenseDate = useRef(false);
  const expenseDay = expenseDate;
  const groups = groupSchedulesByDate(schedules, displayTimeZone);

  const scrollToExpenseDate = () => {
    scheduleList.current?.scrollTo({ y: groupOffsets.current[expenseDay] ?? 0, animated: false });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) return;
    hasScrolledToExpenseDate.current = false;
    // 다시 열 때는 기존 레이아웃을 쓰고, 첫 오픈에서는 아래 onLayout으로 위치를 보완한다.
    requestAnimationFrame(scrollToExpenseDate);
  };

  const handleGroupLayout = (date: string, offset: number) => {
    groupOffsets.current[date] = offset;
    if (date !== expenseDay || hasScrolledToExpenseDate.current) return;
    scrollToExpenseDate();
    hasScrolledToExpenseDate.current = true;
  };

  return (
    <Field>
      <Field.Title>연결된 일정 (선택)</Field.Title>
      {!timeZone && <Text className='text-label text-muted-foreground'>시간대 확인 필요 · UTC 기준</Text>}
      <Field.ElementsBox>
        {!canSelect ? (
          <View className='gap-sm'>
            <Text>{value ? label : '연결된 일정이 없습니다.'}</Text>
            {value && (
              <Pressable variant='outline' onPress={() => onChange('')}>
                연결 안 함
              </Pressable>
            )}
            {blockedPolicy ? (
              <PolicyErrorDisplay policy={blockedPolicy} variant='inline' />
            ) : view.kind === 'error' ? (
              <>
                <Text>일정 목록을 불러오지 못했어요.</Text>
                {access.canFetch && <Pressable onPress={() => actions.refetch()}>다시 불러오기</Pressable>}
              </>
            ) : (
              <Text>일정 목록을 불러오고 있어요.</Text>
            )}
          </View>
        ) : (
          <View className='gap-sm'>
            {view.kind === 'ready' && view.refreshFailed && (
              <View>
                <Text>일정 목록을 갱신하지 못했어요. 이전 내용을 표시하고 있어요.</Text>
                {access.canFetch && <Pressable onPress={() => actions.refetch()}>다시 불러오기</Pressable>}
              </View>
            )}
            <Select
              value={{ value: value ?? '', label: value ? label : '연결 안 함' }}
              onValueChange={(option) => onChange(option?.value ?? '')}
              onOpenChange={handleOpenChange}
            >
              <Select.Trigger>
                <View className='flex-row gap-xs flex-1'>
                  <MapPin size={16} color='#808080' />
                  <Select.Value />
                </View>
                <ChevronDown size={16} color='#808080' />
              </Select.Trigger>
              <Select.Portal>
                <Select.Overlay>
                  <Select.Content title='일정 연결'>
                    <Select.Item value='' label='연결 안 함'>
                      <Select.ItemText>연결 안 함</Select.ItemText>
                    </Select.Item>
                    <ScrollView ref={scheduleList} style={styles.scheduleList}>
                      {[...groups].map(([date, daySchedules]) => (
                        <View key={date} onLayout={(event) => handleGroupLayout(date, event.nativeEvent.layout.y)}>
                          <Text className='px-md py-xs text-label text-muted-foreground'>{date}</Text>
                          {daySchedules.map((schedule) => (
                            <Select.Item
                              key={schedule.id}
                              value={schedule.id}
                              label={scheduleLabel(schedule, displayTimeZone)}
                            >
                              <View className='gap-3xs'>
                                <Text>{schedule.title}</Text>
                                <Text className='text-label text-muted-foreground'>
                                  {formatISOToTimeZoneTime(schedule.scheduledAt, displayTimeZone)}
                                </Text>
                              </View>
                            </Select.Item>
                          ))}
                        </View>
                      ))}
                      {schedules.length === 0 && <Text className='px-md py-lg'>이 여행의 일정이 없습니다.</Text>}
                    </ScrollView>
                  </Select.Content>
                </Select.Overlay>
              </Select.Portal>
            </Select>
          </View>
        )}
      </Field.ElementsBox>
      {error && <Field.Message>{error}</Field.Message>}
    </Field>
  );
}

const styles = StyleSheet.create({ scheduleList: { maxHeight: 360 } });
