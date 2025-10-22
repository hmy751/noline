import { View, TextInput, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';

type LocationSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  autoFocus?: boolean;
};

/**
 * 장소 검색창 컴포넌트
 */
export function LocationSearchBar({ value, onChangeText, onClear, autoFocus = true }: LocationSearchBarProps) {
  return (
    <View className='bg-background px-md pt-sm pb-sm border-b border-card-border'>
      <View className='flex-row items-center h-11 rounded-lg border border-input bg-background px-sm'>
        <Search size={20} color='#808080' />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder='장소를 검색해주세요 (예: 에펠탑)'
          className='flex-1 text-body text-foreground ml-xs'
          placeholderTextColor='#808080'
          autoFocus={autoFocus}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} className='ml-xs'>
            <X size={20} color='#808080' />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
