import { useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import type MapView from 'react-native-maps';

interface UseMyLocationProps {
  mapRef?: React.RefObject<MapView>;
}

export const useMyLocation = ({ mapRef }: UseMyLocationProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const moveToCurrentLocation = async () => {
    try {
      setIsLoading(true);

      // 1. 권한 확인 및 요청
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '현재 위치를 확인하려면 위치 권한이 필요합니다.');
        return;
      }

      // 2. 현재 위치 가져오기
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // 3. 지도가 있으면 해당 위치로 이동
      if (mapRef?.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005, // 줌 레벨 조정
          longitudeDelta: 0.005,
        });
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    moveToCurrentLocation,
    isLoading,
  };
};
