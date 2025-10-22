import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin } from 'lucide-react-native';
import type { Location } from './types';

type LocationSearchResultsProps = {
  results: Location[];
  onSelectLocation: (location: Location) => void;
  isSearching?: boolean;
};

/**
 * 검색 결과 리스트 컴포넌트
 */
export function LocationSearchResults({ results, onSelectLocation, isSearching = false }: LocationSearchResultsProps) {
  // 검색 중이면 로딩 표시
  if (isSearching) {
    return (
      <View style={styles.container}>
        <BlurView intensity={80} tint='light' style={styles.blurContainer}>
          <View className='flex-row items-center justify-center px-md py-lg'>
            <ActivityIndicator size='small' color='#228B22' />
            <Text className='text-body text-muted-foreground ml-sm'>장소 검색 중...</Text>
          </View>
        </BlurView>
      </View>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint='light' style={styles.blurContainer}>
        {/* 헤더 */}
        <View className='flex-row items-center justify-between px-md py-sm border-b border-card-border'>
          <Text className='text-title-medium text-foreground'>검색 결과</Text>
          <View className='bg-accent px-xs py-3xs rounded-full'>
            <Text className='text-label-small text-accent-foreground'>{results.length}개 장소</Text>
          </View>
        </View>

        {/* 결과 리스트 */}
        <ScrollView className='max-h-64' showsVerticalScrollIndicator={false}>
          {results.map((location) => (
            <TouchableOpacity
              key={location.id}
              onPress={() => onSelectLocation(location)}
              className='flex-row items-center px-md py-sm border-b border-card-border active:bg-muted'
            >
              <View className='w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-sm shadow-sm'>
                <MapPin size={20} color='#228B22' />
              </View>
              <View className='flex-1'>
                <Text className='text-title-medium text-foreground mb-3xs'>{location.name}</Text>
                <Text className='text-label text-muted-foreground' numberOfLines={1}>
                  {location.address}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  blurContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
