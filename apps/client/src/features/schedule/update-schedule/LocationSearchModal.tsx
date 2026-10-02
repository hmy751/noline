import { View, Text, Modal, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { LocationSearchBar } from '@/shared/components/PlaceSearch/LocationSearchBar';
import { LocationSearchResults } from '@/shared/components/PlaceSearch/LocationSearchResults';
import { usePlaceResolutionSearch, type PlaceSearchContext } from '@/shared/services/places';
import { PolicyBasedMapView, PolicyErrorDisplay } from '@/shared/components';
import { getPlaceSearchPolicy } from '@/shared/policy/place-search';
import { toUpdateLocationSelection, type UpdateLocationSelection } from './place-search-compatibility';

type LocationSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: UpdateLocationSelection) => void;
  tripId: string;
  initialQuery?: string;
  cityContext?: PlaceSearchContext;
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
  cityContext,
}: LocationSearchModalProps) {
  // 부모는 보통 열린 동안에만 장착한다. 닫힌 채 장착돼도 입력·캐시를 유지하고 새 요청만 멈춘다.
  const search = usePlaceResolutionSearch(cityContext, isOpen);
  const { searchQuery, isSearching, handleSearch, clearSearch } = search;
  const mapLocations = search.results.map(toUpdateLocationSelection);
  const selectableLocations = search.policy.allowed && !search.isPlaceholderData ? mapLocations : [];
  const [selectedLocation, setSelectedLocation] = useState<UpdateLocationSelection | null>(null);

  const handleSelect = (location: UpdateLocationSelection) => {
    if (!isOpen || !getPlaceSearchPolicy().allowed || !selectableLocations.includes(location)) return;
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
        {search.policy.allowed ? (
          <LocationSearchBar value={searchQuery} onChangeText={handleSearch} onClear={clearSearch} autoFocus />
        ) : (
          <PolicyErrorDisplay policy={search.policy} variant='inline' />
        )}

        {/* Map + Results */}
        <View className='flex-1 relative'>
          <PolicyBasedMapView tripId={tripId} locations={mapLocations} selectedLocation={selectedLocation} />

          {search.policy.allowed && (isSearching || selectableLocations.length > 0) && (
            <LocationSearchResults
              results={selectableLocations}
              onSelectLocation={handleSelect}
              isSearching={isSearching}
            />
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
