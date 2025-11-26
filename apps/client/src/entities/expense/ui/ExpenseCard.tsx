import { View, Text } from 'react-native';
import { Pressable } from '@repo/ui';
import { Receipt } from 'lucide-react-native';

export interface ExpenseCardProps {
  id: string;
  title: string;
  amount: string;
  currency: string;
  category: string;
  date: string;
  hasReceipt?: boolean;
  onPress?: () => void;
}

export function ExpenseCard({
  title,
  amount,
  currency,
  category,
  date,
  hasReceipt = false,
  onPress,
}: ExpenseCardProps) {
  // 카테고리별 배경색 (인라인 스타일로 적용)
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      관광: '#DBEAFE', // blue-100
      쇼핑: '#F3E8FF', // purple-100
      식사: '#FFEDD5', // orange-100
      교통: '#DCFCE7', // green-100
      숙박: '#FCE7F3', // pink-100
    };
    return colors[cat] || '#F3F4F6'; // gray-100
  };

  // 카테고리별 텍스트 색상 (인라인 스타일로 적용)
  const getCategoryTextColor = (cat: string) => {
    const colors: Record<string, string> = {
      관광: '#1D4ED8', // blue-700
      쇼핑: '#7C3AED', // purple-700
      식사: '#C2410C', // orange-700
      교통: '#15803D', // green-700
      숙박: '#BE185D', // pink-700
    };
    return colors[cat] || '#374151'; // gray-700
  };

  return (
    <Pressable
      onPress={onPress}
      size='auto'
      className='flex w-full rounded-lg border border-card-border bg-card p-md active:bg-muted'
    >
      <View className='flex-row items-start justify-between'>
        {/* Left Side */}
        <View className='flex-1 gap-2xs pr-xs'>
          {/* Title */}
          <Text className='text-title-medium text-foreground'>{title}</Text>

          {/* Amount */}
          <Text
            className='text-display-medium text-primary'
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {currency} {amount}
          </Text>

          {/* Category & Date */}
          <View className='flex-row items-center gap-2xs mt-xs'>
            <View className='rounded-md px-xs py-3xs' style={{ backgroundColor: getCategoryColor(category) }}>
              <Text className='text-label-small font-medium' style={{ color: getCategoryTextColor(category) }}>
                {category}
              </Text>
            </View>
            <Text className='text-label text-muted-foreground'>{date}</Text>
          </View>
        </View>

        {/* Right Side - Receipt Icon */}
        {hasReceipt && (
          <View className='ml-xs mt-xs flex-shrink-0'>
            <Receipt size={20} color='hsl(120, 8%, 35%)' strokeWidth={2} />
          </View>
        )}
      </View>
    </Pressable>
  );
}
