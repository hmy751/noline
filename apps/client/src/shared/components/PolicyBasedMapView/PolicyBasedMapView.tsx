/**
 * PolicyBasedMapView Component
 * 정책에 따라 Google Maps vs Mapbox 자동 선택
 * Policy Layer (v3.0)의 service.mapProvider 정책을 따름
 */

import { View, Text, StyleSheet } from 'react-native';
import { Search, WifiOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import RNMapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { useOfflineCity } from '@/entities/offline-city';
import { useAppPolicy } from '@/shared/policy';
import { OfflineMapView } from './OfflineMapView';

interface Location {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

interface SmartMapViewProps {
  tripId: string | null;
  locations: Location[];
  selectedLocation: Location | null;
}

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
 * 스마트 지도 컴포넌트
 *
 * 동작 (Policy-Driven):
 * 1. policy.service.mapProvider로 지도 제공자 결정
 *    - 'google': Google Maps (온라인)
 *    - 'mapbox': Mapbox (오프라인 지도)
 *    - 'none': 지도 사용 불가 (offline_inactive)
 * 2. 빈 상태면 검색 유도 UI
 */
export function PolicyBasedMapView({ tripId, locations, selectedLocation }: SmartMapViewProps) {
  const mapRef = useRef<RNMapView>(null);

  // Policy Layer로 지도 제공자 결정
  const policy = useAppPolicy(tripId ?? undefined);

  // 오프라인 지도 조회 (mapbox 모드에서만 필요)
  const { data: offlineCity, isLoading } = useOfflineCity(tripId);

  // 지도 영역 자동 조정 (react-native-maps - Google Maps 모드에서만)
  useEffect(() => {
    if (mapRef.current && policy.service.mapProvider === 'google') {
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
  }, [locations, selectedLocation, policy.service.mapProvider]);

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

  // 기본 중심 좌표
  const centerLocation = selectedLocation || locations[0];

  // Policy에 따라 지도 제공자 선택
  switch (policy.service.mapProvider) {
    case 'mapbox':
      // Mapbox 오프라인 지도 사용
      if (offlineCity && !isLoading) {
        console.log('🗺️ Using Mapbox offline map for city:', offlineCity.cityName);
        return <OfflineMapView locations={locations} selectedLocation={selectedLocation} cityId={offlineCity.cityId} />;
      }
      // 오프라인 지도가 아직 다운로드 안 된 경우 로딩 상태
      return (
        <LinearGradient
          colors={['#E3F2FD', '#E8F5E9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >
          <View className='items-center'>
            <Text className='text-title-large text-foreground mb-xs'>오프라인 지도 준비 중...</Text>
            <Text className='text-body text-muted-foreground text-center'>잠시만 기다려주세요</Text>
          </View>
        </LinearGradient>
      );

    case 'none':
      // 지도 사용 불가 (offline_inactive 상태)
      return (
        <LinearGradient
          colors={['#F5F5F5', '#E0E0E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >
          <View className='items-center'>
            <View className='w-24 h-24 rounded-full bg-white/80 items-center justify-center mb-md shadow-sm'>
              <WifiOff size={48} color='#757575' />
            </View>
            <Text className='text-title-large text-foreground mb-xs'>지도를 사용할 수 없습니다</Text>
            <Text className='text-body text-muted-foreground text-center'>
              오프라인 상태에서는 활성화된 여행만 지도를 볼 수 있어요
            </Text>
          </View>
        </LinearGradient>
      );

    case 'google':
    default:
      // Google Maps 사용 (react-native-maps)
      console.log('🌐 Using Google Maps (online)');
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
          showsMyLocationButton={false}
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
}
