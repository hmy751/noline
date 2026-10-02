import { View, Text, Keyboard } from 'react-native';
import { Pressable } from '@repo/ui';
import { PolicyBasedMapView, PolicyErrorDisplay } from '@/shared/components';
import { LocationSearchBar } from '@/shared/components/PlaceSearch/LocationSearchBar';
import { LocationSearchResults } from '@/shared/components/PlaceSearch/LocationSearchResults';
import type { useCreateScheduleSearch } from './useCreateScheduleSearch';
import type { Location } from './types';

type Props = {
  tripId: string;
  search: ReturnType<typeof useCreateScheduleSearch>;
  selectedLocation: Location | null;
  returning: boolean;
  onContinue: () => void;
  onSelect: (place: Location) => void;
};

export function ScheduleSearchPanel({ tripId, search, selectedLocation, returning, onContinue, onSelect }: Props) {
  // 검색 장면은 후보들을 보여준다. 후보가 없을 때만 작성에 채택한 장소를 지도에 남긴다.
  const mapSelectedLocation = search.mapLocations.length > 0 ? null : selectedLocation;
  return (
    <View className='flex-1'>
      {search.policy.allowed ? (
        <LocationSearchBar
          value={search.searchQuery}
          onChangeText={search.handleSearch}
          onClear={search.clearSearch}
          autoFocus
        />
      ) : (
        <PolicyErrorDisplay policy={search.policy} variant='inline' />
      )}
      <View className='px-md py-sm'>
        <Pressable
          variant='outline'
          onPress={() => {
            Keyboard.dismiss();
            onContinue();
          }}
        >
          {returning ? '작성 중인 일정으로 돌아가기' : '장소 직접 입력'}
        </Pressable>
      </View>
      <View className='flex-1 relative'>
        <PolicyBasedMapView
          tripId={tripId}
          locations={search.mapLocations}
          selectedLocation={mapSelectedLocation}
          emptyMessage={{ title: '표시할 장소가 없어요', description: '장소를 선택하거나 직접 입력할 수 있습니다.' }}
        />
        {search.policy.allowed &&
          (search.isError ? (
            <View className='p-md gap-sm'>
              <Text accessibilityRole='alert'>장소를 검색하지 못했어요. 다시 시도하거나 직접 입력해주세요.</Text>
              <Pressable
                variant='outline'
                onPress={() => {
                  search.retry();
                }}
              >
                다시 검색
              </Pressable>
            </View>
          ) : (
            (search.isSearching || search.selectablePlaces.length > 0) && (
              <LocationSearchResults
                results={search.selectablePlaces}
                isSearching={search.isSearching}
                onSelectLocation={onSelect}
              />
            )
          ))}
      </View>
    </View>
  );
}
