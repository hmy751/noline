import React from 'react';

import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { useGetRoutes } from '@/entities/route';
import { MapboxScheduleMapView } from '@/shared/components/Map/MapboxScheduleMapView';
import type { Route } from '@/shared/db/schema';
import { encodePolyline } from '@/shared/lib/mapbox';
import { buildRouteSegments } from '@/shared/services/directions/route-plan';

jest.mock('@/entities/route', () => ({ useGetRoutes: jest.fn() }));
jest.mock('@rnmapbox/maps', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Source = ({ id, ...props }: React.PropsWithChildren<{ id: string }>) =>
    ReactRuntime.createElement(View, { ...props, testID: id });
  return {
    __esModule: true,
    default: {
      MapView: View,
      Camera: ReactRuntime.forwardRef(() => null),
      ShapeSource: Source,
      LineLayer: Source,
      MarkerView: ({ children }: React.PropsWithChildren) => ReactRuntime.createElement(View, null, children),
    },
  };
});

const schedules = [
  { id: 'a', title: 'A', location: 'A', latitude: 0, longitude: 10, time: '10:00' },
  { id: 'b', title: 'B', location: 'B', latitude: 2, longitude: 20, time: '11:00' },
  { id: 'c', title: 'C', location: 'C', latitude: 3, longitude: 30, time: '12:00' },
];
const geometry = encodePolyline([
  [10, 0],
  [15, 1],
  [20, 2],
]);
const route: Route = {
  id: 'current',
  tripId: 'trip',
  fromScheduleId: 'a',
  toScheduleId: 'b',
  profile: 'walking',
  coordinatesKey: buildRouteSegments(schedules)[0].coordinatesKey,
  geometry,
  distance: 1200,
  duration: 600,
  deletedAt: null,
  version: 1,
  createdAt: '2026-11-12T00:00:00Z',
  updatedAt: '2026-11-12T00:00:00Z',
};

const setRoutes = (rows: Route[]) => {
  jest.mocked(useGetRoutes).mockReturnValue({ data: rows } as ReturnType<typeof useGetRoutes>);
};

beforeEach(() => setRoutes([route]));

it('현재 좌표와 맞는 경로를 선택하고, 장소가 바뀌면 캐시에 남은 옛 경로 대신 현재 좌표의 점선을 그린다', () => {
  // Mapbox native renderer 대신 실제 컴포넌트가 넘기는 geometry/style 계약을 검사한다.
  const view = render(<MapboxScheduleMapView tripId='trip' schedules={schedules} />);
  expect(view.getByTestId('route-a-b').props.shape.geometry.coordinates).toEqual([
    [10, 0],
    [15, 1],
    [20, 2],
  ]);
  expect(view.getByTestId('route-a-b-layer').props.style.lineDasharray).toBeUndefined();

  const moved = schedules.map((schedule) => (schedule.id === 'b' ? { ...schedule, longitude: 25 } : schedule));
  view.rerender(<MapboxScheduleMapView tripId='trip' schedules={moved} />);
  expect(view.getByTestId('route-a-b').props.shape.geometry.coordinates).toEqual([
    [10, 0],
    [25, 2],
  ]);
  expect(view.getByTestId('route-a-b-layer').props.style.lineDasharray).toEqual([2, 2]);
  expect(view.queryByText('1.2km')).toBeNull();
});

it('구버전·다른 좌표·삭제된 중복 행이 앞에 있어도 현재 유효한 경로를 표시한다', () => {
  setRoutes([
    {
      ...route,
      id: 'legacy',
      coordinatesKey: null,
      geometry: encodePolyline([
        [1, 1],
        [2, 2],
      ]),
    },
    {
      ...route,
      id: 'stale',
      coordinatesKey: 'old',
      geometry: encodePolyline([
        [3, 3],
        [4, 4],
      ]),
    },
    { ...route, id: 'deleted', deletedAt: '2026-11-12T01:00:00Z' },
    route,
  ]);
  const view = render(<MapboxScheduleMapView tripId='trip' schedules={schedules} />);
  expect(view.getByTestId('route-a-b').props.shape.geometry.coordinates).toEqual([
    [10, 0],
    [15, 1],
    [20, 2],
  ]);

  fireEvent.press(view.getByText('자전거'));
  expect(view.getByTestId('route-a-b-layer').props.style.lineDasharray).toEqual([2, 2]);
});

it('일정 순서가 바뀌면 이전 인접 구간을 그리지 않고 새 이웃만 표시한다', () => {
  const view = render(<MapboxScheduleMapView tripId='trip' schedules={[schedules[0], schedules[2], schedules[1]]} />);
  expect(view.queryByTestId('route-a-b')).toBeNull();
  expect(view.getByTestId('route-a-c').props.shape.geometry.coordinates).toEqual([
    [10, 0],
    [30, 3],
  ]);
  expect(view.getByTestId('route-c-b-layer').props.style.lineDasharray).toEqual([2, 2]);
});

it('좌표 출처가 없는 이전 캐시만 있으면 현재 도로 경로로 표시하지 않는다', () => {
  setRoutes([{ ...route, coordinatesKey: null }]);
  const view = render(<MapboxScheduleMapView tripId='trip' schedules={schedules} />);
  expect(view.getByTestId('route-a-b-layer').props.style.lineDasharray).toEqual([2, 2]);
});
