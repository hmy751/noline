/**
 * OfflineMapView Component
 * Mapbox 오프라인 지도 렌더링
 */

import { View, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import MapboxGL from '@rnmapbox/maps';

interface Location {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

interface OfflineMapViewProps {
  locations: Location[];
  selectedLocation: Location | null;
  cityId: number;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

/**
 * Mapbox 오프라인 지도 컴포넌트
 * - 오프라인 팩이 다운로드된 경우 사용
 * - react-native-maps와 동일한 props 인터페이스 제공
 */
export function OfflineMapView({ locations, selectedLocation, cityId }: OfflineMapViewProps) {
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // 지도 중심 좌표
  const centerLocation = selectedLocation || locations[0];

  // 지도 카메라 자동 조정
  useEffect(() => {
    if (!cameraRef.current) return;

    if (selectedLocation) {
      // 선택된 장소로 포커스
      cameraRef.current.setCamera({
        centerCoordinate: [selectedLocation.longitude, selectedLocation.latitude],
        zoomLevel: 14,
        animationDuration: 500,
      });
    } else if (locations.length > 0) {
      // 여러 검색 결과가 있으면 모두 보이도록
      const coordinates = locations.map((loc) => [loc.longitude, loc.latitude] as [number, number]);

      cameraRef.current.fitBounds(
        [Math.min(...coordinates.map((c) => c[0])), Math.min(...coordinates.map((c) => c[1]))],
        [Math.max(...coordinates.map((c) => c[0])), Math.max(...coordinates.map((c) => c[1]))],
        [50, 50, 50, 50], // edgePadding
        500, // animationDuration
      );
    }
  }, [locations, selectedLocation]);

  if (!centerLocation) {
    return <View style={styles.map} />;
  }

  return (
    <View style={styles.map}>
      <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={13}
          centerCoordinate={[centerLocation.longitude, centerLocation.latitude]}
        />

        <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} />

        {/* 선택된 장소 마커 */}
        {selectedLocation && (
          <MapboxGL.PointAnnotation
            id={`selected-${selectedLocation.latitude}-${selectedLocation.longitude}`}
            coordinate={[selectedLocation.longitude, selectedLocation.latitude]}
            title={selectedLocation.name}
            snippet={selectedLocation.address}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: '#228B22',
                borderWidth: 3,
                borderColor: '#ffffff',
              }}
            />
          </MapboxGL.PointAnnotation>
        )}

        {/* 검색 결과 마커들 (선택 전) */}
        {!selectedLocation &&
          locations.map((location, index) => (
            <MapboxGL.PointAnnotation
              key={`marker-${location.latitude}-${location.longitude}-${index}`}
              id={`marker-${location.latitude}-${location.longitude}-${index}`}
              coordinate={[location.longitude, location.latitude]}
              title={location.name}
              snippet={location.address}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#228B22',
                  borderWidth: 2,
                  borderColor: '#ffffff',
                }}
              />
            </MapboxGL.PointAnnotation>
          ))}
      </MapboxGL.MapView>
    </View>
  );
}
