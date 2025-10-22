import { View, Text, Animated, StyleSheet } from 'react-native';
import { Search, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import type { Location } from './types';

type MapViewProps = {
  locations: Location[];
  selectedLocation: Location | null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});

/**
 * 지도 컴포넌트 (Mock UI)
 * TODO: 실제 Google Maps 연동 시 교체 예정
 */
export function MapView({ locations, selectedLocation }: MapViewProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (locations.length > 0 || selectedLocation) {
      // Bounce 애니메이션
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, selectedLocation]);

  // 빈 상태
  if (locations.length === 0 && !selectedLocation) {
    return (
      <LinearGradient
        colors={['#E3F2FD', '#E8F5E9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <View className='items-center'>
          <View className='w-24 h-24 rounded-full bg-white/80 items-center justify-center mb-md shadow-sm'>
            <Search size={48} color='#228B22' />
          </View>
          <Text className='text-title-large text-foreground mb-xs'>장소를 검색해주세요</Text>
          <Text className='text-body text-muted-foreground text-center'>방문할 여행지를 찾아보세요</Text>
        </View>
      </LinearGradient>
    );
  }

  // 선택된 장소가 있을 때
  if (selectedLocation) {
    return (
      <View className='flex-1 items-center justify-center bg-blue-50 relative'>
        <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
          <MapPin size={80} color='#228B22' fill='#FFFFFF' strokeWidth={3} />
        </Animated.View>
      </View>
    );
  }

  // 검색 결과들
  return (
    <View className='flex-1 bg-blue-50 relative items-center justify-center'>
      <View className='absolute top-1/4 left-1/4'>
        <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
          <MapPin size={48} color='#228B22' fill='#FFFFFF' strokeWidth={2.5} />
        </Animated.View>
      </View>
      <View className='absolute top-1/2 left-1/2'>
        <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
          <MapPin size={48} color='#228B22' fill='#FFFFFF' strokeWidth={2.5} />
        </Animated.View>
      </View>
      <View className='absolute top-1/3 right-1/4'>
        <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
          <MapPin size={48} color='#228B22' fill='#FFFFFF' strokeWidth={2.5} />
        </Animated.View>
      </View>
    </View>
  );
}
