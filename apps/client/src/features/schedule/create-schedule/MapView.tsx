import { View, Text, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import RNMapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
  map: {
    flex: 1,
    width: '100%',
  },
});

/**
 * 실제 지도 컴포넌트 (react-native-maps)
 */
export function MapView({ locations, selectedLocation }: MapViewProps) {
  const mapRef = useRef<RNMapView>(null);

  // 지도 영역 자동 조정
  useEffect(() => {
    if (mapRef.current) {
      if (selectedLocation) {
        // 선택된 장소로 포커스
        mapRef.current.animateToRegion({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else if (locations.length > 0) {
        // 여러 검색 결과가 있으면 모두 보이도록
        mapRef.current.fitToCoordinates(
          locations.map((loc) => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
          })),
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          },
        );
      }
    }
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

  // 기본 중심 좌표 (선택된 장소 또는 첫 번째 검색 결과)
  const centerLocation = selectedLocation || locations[0];

  return (
    <RNMapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={{
        latitude: centerLocation.latitude,
        longitude: centerLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation
      showsMyLocationButton
    >
      {/* 선택된 장소 마커 (큰 마커) */}
      {selectedLocation && (
        <Marker
          coordinate={{
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }}
          title={selectedLocation.name}
          description={selectedLocation.address}
          pinColor='#228B22'
        />
      )}

      {/* 검색 결과 마커들 (선택 전) */}
      {!selectedLocation &&
        locations.map((location, index) => (
          <Marker
            key={`${location.latitude}-${location.longitude}-${index}`}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.name}
            description={location.address}
            pinColor='#228B22'
          />
        ))}
    </RNMapView>
  );
}
