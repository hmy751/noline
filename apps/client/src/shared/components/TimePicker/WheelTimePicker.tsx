import { View, Text } from 'react-native';
import { Drawer, Pressable } from '@repo/ui';
import { useState, useCallback, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

type WheelPickerProps = {
  data: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
};

function WheelPicker({ data, selectedValue, onValueChange }: WheelPickerProps) {
  const scrollY = useSharedValue(0);
  const initialIndex = data.indexOf(selectedValue);

  const handleValueChange = useCallback(
    (index: number) => {
      if (index >= 0 && index < data.length) {
        onValueChange(data[index]);
      }
    },
    [data, onValueChange],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onMomentumEnd: (event) => {
      const index = Math.round(event.contentOffset.y / ITEM_HEIGHT);
      runOnJS(handleValueChange)(index);
    },
  });

  return (
    <View style={{ height: PICKER_HEIGHT }} className='overflow-hidden'>
      {/* 중앙 하이라이트 */}
      <View
        className='absolute left-0 right-0 bg-muted/50 rounded-lg'
        style={{
          top: ITEM_HEIGHT * 2,
          height: ITEM_HEIGHT,
        }}
        pointerEvents='none'
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate='fast'
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * 2,
        }}
        contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
      >
        {data.map((item, index) => (
          <WheelItem key={item} item={item} index={index} scrollY={scrollY} />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

type WheelItemProps = {
  item: string;
  index: number;
  scrollY: Animated.SharedValue<number>;
};

function WheelItem({ item, index, scrollY }: WheelItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const itemPosition = index * ITEM_HEIGHT;
    const centerOffset = scrollY.value - itemPosition + ITEM_HEIGHT * 2;

    const scale = interpolate(Math.abs(centerOffset), [0, ITEM_HEIGHT, ITEM_HEIGHT * 2], [1, 0.85, 0.7], 'clamp');

    const opacity = interpolate(Math.abs(centerOffset), [0, ITEM_HEIGHT, ITEM_HEIGHT * 2], [1, 0.6, 0.3], 'clamp');

    const rotateX = interpolate(centerOffset, [-ITEM_HEIGHT * 2, 0, ITEM_HEIGHT * 2], [60, 0, -60], 'clamp');

    return {
      transform: [{ scale }, { rotateX: `${rotateX}deg` }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: ITEM_HEIGHT,
          justifyContent: 'center',
          alignItems: 'center',
        },
        animatedStyle,
      ]}
    >
      <Text className='text-title-large text-foreground font-medium'>{item}</Text>
    </Animated.View>
  );
}

type WheelTimePickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time: string) => void;
  initialTime?: string;
};

export default function WheelTimePicker({
  visible,
  onClose,
  onSelectTime,
  initialTime = '09:00',
}: WheelTimePickerProps) {
  const [hour, minute] = initialTime.split(':');
  const [selectedHour, setSelectedHour] = useState(hour || '09');
  const [selectedMinute, setSelectedMinute] = useState(minute || '00');

  // initialTime이 변경되면 상태 업데이트
  useEffect(() => {
    const [h, m] = initialTime.split(':');
    setSelectedHour(h || '09');
    setSelectedMinute(m || '00');
  }, [initialTime]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleConfirm = () => {
    onSelectTime(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  return (
    <Drawer isOpen={visible} onClose={onClose} title='시간 선택'>
      <View className='flex-row items-center justify-center py-md'>
        <WheelPicker data={hours} selectedValue={selectedHour} onValueChange={setSelectedHour} />

        <Text className='text-title-large text-foreground px-sm'>:</Text>

        <WheelPicker data={minutes} selectedValue={selectedMinute} onValueChange={setSelectedMinute} />
      </View>

      <View className='px-sm pb-xl pt-md'>
        <Pressable variant='default' onPress={handleConfirm} className='w-full'>
          확인
        </Pressable>
      </View>
    </Drawer>
  );
}
