import { useState } from 'react';
import { View, Text } from 'react-native';
import { Plane, ChevronDown, Check } from 'lucide-react-native';
import { Select } from '@repo/ui';

interface Trip {
  value: string;
  label: string;
}

interface TripSelectorProps {
  defaultTrip?: Trip;
  onTripChange?: (trip: Trip) => void;
  className?: string;
}

/**
 * TripSelector - 현재 여행 선택 컴포넌트
 *
 * packages/ui의 Select Compound Component를 조합하여 만든
 * 여행 선택 특화 컴포넌트입니다.
 *
 * 일정, 경비 등 화면 상단에 sticky 형태로 배치되어
 * 현재 선택된 여행을 표시하고 변경할 수 있습니다.
 *
 * @example
 * <TripSelector
 *   defaultTrip={{ value: 'paris', label: '파리, 프랑스' }}
 *   onTripChange={(trip) => console.log('Selected:', trip)}
 * />
 */
export function TripSelector({ defaultTrip, onTripChange, className = '' }: TripSelectorProps) {
  const [selectedTrip, setSelectedTrip] = useState<Trip>(defaultTrip || { value: 'paris', label: '파리, 프랑스' });
  const [isOpen, setIsOpen] = useState(false);

  // TODO: Replace with real data from API
  const trips: Trip[] = [
    { value: 'paris', label: '파리, 프랑스' },
    { value: 'tokyo', label: '도쿄, 일본' },
    { value: 'newyork', label: '뉴욕, 미국' },
    { value: 'london', label: '런던, 영국' },
    { value: 'rome', label: '로마, 이탈리아' },
  ];

  const handleTripChange = (trip: Trip | undefined) => {
    if (trip) {
      setSelectedTrip(trip);
      onTripChange?.(trip);
    }
  };

  return (
    <Select value={selectedTrip} onValueChange={handleTripChange} onOpenChange={setIsOpen}>
      <View className={className}>
        <Select.Trigger className={isOpen ? 'border-2 border-[hsl(142,76%,36%)]' : ''} size='sm'>
          <View className='flex-row items-center gap-xs'>
            <Plane size={18} color='hsl(0, 0%, 12%)' strokeWidth={2} />
            <Text className='text-body text-foreground'>{selectedTrip.label}</Text>
          </View>
          <ChevronDown size={16} color='hsl(0, 0%, 45%)' strokeWidth={2} />
        </Select.Trigger>
      </View>

      <Select.Portal>
        <Select.Overlay>
          <Select.Content className='w-full rounded-2xl bg-background shadow-lg' sideOffset={4}>
            <Select.Viewport>
              {trips.map((trip) => {
                const isSelected = trip.value === selectedTrip.value;
                return (
                  <Select.Item
                    key={trip.value}
                    value={trip.value}
                    label={trip.label}
                    className={`flex-row items-center px-md py-sm active:bg-muted ${isSelected ? 'bg-muted' : ''}`}
                  >
                    {isSelected ? (
                      <Select.ItemIndicator className='mr-xs'>
                        <Check size={18} color='hsl(142, 76%, 36%)' strokeWidth={2.5} />
                      </Select.ItemIndicator>
                    ) : (
                      <View className='mr-xs w-[18px]' />
                    )}
                    <Plane size={18} color='hsl(0, 0%, 12%)' strokeWidth={2} />
                    <Text className='ml-xs text-body text-foreground'>{trip.label}</Text>
                  </Select.Item>
                );
              })}
            </Select.Viewport>
          </Select.Content>
        </Select.Overlay>
      </Select.Portal>
    </Select>
  );
}
