import React from 'react';

import { expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';

import { useGetRoutes } from '@/entities/route';
import { MapboxScheduleMapView } from '@/shared/components/Map/MapboxScheduleMapView';
import { OfflineMapView } from '@/shared/components/PolicyBasedMapView/OfflineMapView';
import { OFFLINE_MAP_STYLE_URL } from '@/shared/lib/mapbox';

jest.mock('@/entities/route', () => ({ useGetRoutes: jest.fn() }));
jest.mock('@rnmapbox/maps', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Passthrough = ({ children }: React.PropsWithChildren) => ReactRuntime.createElement(View, null, children);
  return {
    __esModule: true,
    default: {
      // native 기본값(v11에서는 streets-v12)을 흉내 내 상수 대신 이 값을 쓰면 테스트가 실패하게 한다.
      StyleURL: { Street: 'mapbox://styles/mapbox/streets-v12' },
      MapView: ({ styleURL, children }: React.PropsWithChildren<{ styleURL?: string }>) =>
        ReactRuntime.createElement(View, { testID: 'mapbox-map', accessibilityLabel: styleURL }, children),
      Camera: ReactRuntime.forwardRef(() => null),
      UserLocation: () => null,
      ShapeSource: Passthrough,
      LineLayer: Passthrough,
      PointAnnotation: Passthrough,
      Callout: Passthrough,
    },
  };
});

const place = { latitude: 48.8584, longitude: 2.2945, name: '에펠탑', address: 'Paris' };

it('오프라인 지도 화면은 pack을 받은 스타일로 그린다', () => {
  const view = render(<OfflineMapView locations={[place]} selectedLocation={place} cityId={2988507} />);
  expect(view.getByTestId('mapbox-map').props.accessibilityLabel).toBe(OFFLINE_MAP_STYLE_URL);
});

it('일정 Mapbox 지도도 pack을 받은 스타일로 그린다', () => {
  jest.mocked(useGetRoutes).mockReturnValue({ data: [] } as unknown as ReturnType<typeof useGetRoutes>);
  const schedules = [{ id: 'a', title: 'A', location: 'A', latitude: 48.85, longitude: 2.29, time: '10:00' }];
  const view = render(<MapboxScheduleMapView tripId='trip' schedules={schedules} />);
  expect(view.getByTestId('mapbox-map').props.accessibilityLabel).toBe(OFFLINE_MAP_STYLE_URL);
});
