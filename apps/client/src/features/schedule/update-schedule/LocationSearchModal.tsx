import { View, Text, Modal, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { LocationSearchBar, LocationSearchResults, type Location } from '@/features/schedule/create-schedule';
import { useLocationSearch } from '@/features/schedule/create-schedule';
import { PolicyBasedMapView } from '@/shared/components';

type LocationSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
  tripId: string;
  initialQuery?: string;
  cityContext?: {
    cityName: string;
    latitude?: number;
    longitude?: number;
  };
};

/**
 * 장소 재검색 모달
 *
 * 사용 시나리오:
 * - Manual input으로 생성된 일정의 장소 재검색
 * - 온라인 상태에서만 사용 가능 (Policy 체크는 부모에서)
 */
export function LocationSearchModal({
  isOpen,
  onClose,
  onSelectLocation,
  tripId,
  initialQuery = '',
  cityContext,
}: LocationSearchModalProps) {
  const { searchQuery, results, isSearching, handleSearch, clearSearch } = useLocationSearch(cityContext);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const handleSelect = (location: Location) => {
    setSelectedLocation(location);
    onSelectLocation(location);
    onClose();
  };

  return (
    <Modal visible={isOpen} animationType='slide' onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View className='flex-row items-center justify-between px-md py-sm border-b border-border'>
          <View className='flex-1' />
          <View className='absolute left-0 right-0 items-center pointer-events-none'>
            <View className='text-title-medium text-foreground'>
              <Text>장소 검색</Text>
            </View>
          </View>
          <View className='w-10 h-10 items-center justify-center' onTouchEnd={onClose}>
            <X size={24} color='#1F1F1F' />
          </View>
        </View>

        {/* Search Bar */}
        <LocationSearchBar value={searchQuery} onChangeText={handleSearch} onClear={clearSearch} autoFocus />

        {/* Map + Results */}
        <View className='flex-1 relative'>
          <PolicyBasedMapView tripId={tripId} locations={results} selectedLocation={selectedLocation} />

          {(isSearching || results.length > 0) && (
            <LocationSearchResults results={results} onSelectLocation={handleSelect} isSearching={isSearching} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
