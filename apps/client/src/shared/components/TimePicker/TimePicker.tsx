import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Drawer, Pressable } from '@repo/ui';
import { useState, useRef } from 'react';

type TimePickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time: string) => void;
  initialTime?: string;
};

export default function TimePicker({ visible, onClose, onSelectTime, initialTime = '09:00' }: TimePickerProps) {
  return (
    <Drawer isOpen={visible} onClose={onClose} title='시간 선택'>
      {visible && <TimePickerSelection initialTime={initialTime} onClose={onClose} onSelectTime={onSelectTime} />}
    </Drawer>
  );
}

// 열려 있는 동안만 임시 선택을 보관한다. 닫았다 다시 열면 현재 폼 값으로 새로 시작한다.
function TimePickerSelection({ initialTime, onClose, onSelectTime }: Required<Omit<TimePickerProps, 'visible'>>) {
  const [hour, minute] = initialTime.split(':');
  const [selectedHour, setSelectedHour] = useState(hour || '09');
  const [selectedMinute, setSelectedMinute] = useState(minute || '00');
  const draftTime = useRef({ hour: hour || '09', minute: minute || '00' });

  const selectHour = (value: string) => {
    draftTime.current.hour = value;
    setSelectedHour(value);
  };
  const selectMinute = (value: string) => {
    draftTime.current.minute = value;
    setSelectedMinute(value);
  };

  const handleConfirm = () => {
    onSelectTime(`${draftTime.current.hour}:${draftTime.current.minute}`);
    onClose();
  };

  return (
    <>
      <View className='items-center py-md'>
        <View className='flex-row items-center justify-center' style={{ height: WHEEL_HEIGHT }}>
          <View
            pointerEvents='none'
            className='absolute inset-x-0 rounded-lg border-y border-primary/30 bg-primary/10'
            style={{ top: WHEEL_PADDING, height: ROW_HEIGHT }}
          />
          <TimeColumn label='시' count={24} initialValue={hour || '09'} value={selectedHour} onSelect={selectHour} />
          <Text className='text-title-large text-foreground px-xs'>:</Text>
          <TimeColumn
            label='분'
            count={60}
            initialValue={minute || '00'}
            value={selectedMinute}
            onSelect={selectMinute}
          />
        </View>
      </View>
      <View className='px-sm pb-xl pt-md'>
        <Pressable variant='default' onPress={handleConfirm} className='w-full'>
          확인
        </Pressable>
      </View>
    </>
  );
}

const ROW_HEIGHT = 44;
const WHEEL_HEIGHT = ROW_HEIGHT * 5;
const WHEEL_PADDING = (WHEEL_HEIGHT - ROW_HEIGHT) / 2;

function TimeColumn({
  label,
  count,
  initialValue,
  value,
  onSelect,
}: {
  label: string;
  count: number;
  initialValue: string;
  value: string;
  onSelect: (value: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const initialOffset = Number(initialValue) * ROW_HEIGHT;
  const initialContentOffset = useRef({ x: 0, y: initialOffset }).current;
  const didInitialize = useRef(false);

  const selectAtOffset = (offset: number) => {
    const index = Math.max(0, Math.min(count - 1, Math.round(offset / ROW_HEIGHT)));
    const next = index.toString().padStart(2, '0');
    if (next !== value) onSelect(next);
    return index * ROW_HEIGHT;
  };

  const finishScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const snappedOffset = selectAtOffset(event.nativeEvent.contentOffset.y);
    scrollRef.current?.scrollTo({ y: snappedOffset, animated: false });
  };

  return (
    <ScrollView
      ref={scrollRef}
      accessibilityLabel={`${label} 선택 목록`}
      className='w-20'
      style={{ height: WHEEL_HEIGHT }}
      showsVerticalScrollIndicator={false}
      bounces={false}
      nestedScrollEnabled
      snapToInterval={ROW_HEIGHT}
      decelerationRate='fast'
      scrollEventThrottle={16}
      contentOffset={initialContentOffset}
      onContentSizeChange={() => {
        if (didInitialize.current) return;
        didInitialize.current = true;
        scrollRef.current?.scrollTo({ y: initialOffset, animated: false });
      }}
      onScroll={(event) => selectAtOffset(event.nativeEvent.contentOffset.y)}
      onScrollEndDrag={(event) => {
        if (event.nativeEvent.velocity && Math.abs(event.nativeEvent.velocity.y) < 0.01) finishScroll(event);
      }}
      onMomentumScrollEnd={finishScroll}
    >
      <View style={{ height: WHEEL_PADDING }} />
      {Array.from({ length: count }, (_, index) => index.toString().padStart(2, '0')).map((item) => (
        <TouchableOpacity
          key={item}
          accessibilityRole='button'
          accessibilityLabel={`${item}${label}`}
          accessibilityState={{ selected: value === item }}
          onPress={() => {
            const nextOffset = Number(item) * ROW_HEIGHT;
            scrollRef.current?.scrollTo({ y: nextOffset, animated: false });
            onSelect(item);
          }}
          style={{ height: ROW_HEIGHT }}
          className='items-center justify-center'
        >
          <Text
            className={`text-title-medium ${value === item ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
          >
            {item}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={{ height: WHEEL_PADDING }} />
    </ScrollView>
  );
}
