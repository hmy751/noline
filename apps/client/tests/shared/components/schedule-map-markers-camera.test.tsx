import React from 'react';

import { beforeEach, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';

import { useGetRoutes } from '@/entities/route';
import { MapboxScheduleMapView } from '@/shared/components/Map/MapboxScheduleMapView';

const mockCameraProps: Record<string, unknown>[] = [];
const mockSetCamera = jest.fn();
const mockFitBounds = jest.fn();

jest.mock('@/entities/route', () => ({ useGetRoutes: jest.fn() }));
jest.mock('@rnmapbox/maps', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Passthrough = ({ children }: React.PropsWithChildren) => ReactRuntime.createElement(View, null, children);
  return {
    __esModule: true,
    // PointAnnotation은 일부러 두지 않는다. 일정 지도가 다시 PointAnnotation을 쓰면 렌더가 실패한다.
    default: {
      MapView: Passthrough,
      Camera: ReactRuntime.forwardRef((props: Record<string, unknown>, ref) => {
        mockCameraProps.push(props);
        ReactRuntime.useImperativeHandle(ref, () => ({ setCamera: mockSetCamera, fitBounds: mockFitBounds }));
        return null;
      }),
      ShapeSource: Passthrough,
      LineLayer: Passthrough,
      MarkerView: Passthrough,
    },
  };
});

// 도쿄 두 곳과 오사카 한 곳: 모두를 담는 범위로 열면 일정 위치가 보이지 않을 만큼 축소된다.
const day1 = [
  { id: 'a', title: 'A', location: 'Sakurashinmachi', latitude: 35.63, longitude: 139.64, time: '09:00' },
  { id: 'b', title: 'B', location: 'Tokyo Tower', latitude: 35.66, longitude: 139.75, time: '10:00' },
  { id: 'c', title: 'C', location: 'Shinsaibashi', latitude: 34.67, longitude: 135.5, time: '11:00' },
];
// 첫 일정에 좌표가 없는 날
const day2 = [
  { id: 'd', title: 'D', location: '직접 입력', time: '09:00' },
  { id: 'e', title: 'E', location: 'Dotonbori', latitude: 34.67, longitude: 135.5, time: '10:00' },
  { id: 'f', title: 'F', location: 'Osaka Castle', latitude: 34.69, longitude: 135.53, time: '11:00' },
];
const lastCamera = () => mockCameraProps[mockCameraProps.length - 1];

beforeEach(() => {
  mockCameraProps.length = 0;
  mockSetCamera.mockClear();
  mockFitBounds.mockClear();
  jest.mocked(useGetRoutes).mockReturnValue({ data: [] } as unknown as ReturnType<typeof useGetRoutes>);
});

it('일정 마커를 이미지로 찍는 PointAnnotation 대신 뷰로 그려 순서 번호를 남긴다', () => {
  const view = render(<MapboxScheduleMapView tripId='trip' schedules={day1} selectedScheduleId='a' />);
  expect(view.getByText('1')).toBeTruthy();
  expect(view.getByText('2')).toBeTruthy();
  expect(view.getByText('3')).toBeTruthy();
});

it('처음 열 때 선택한 일정에서 시작하고, 카메라 위치를 값이 바뀌면 다시 보내는 prop으로 넘기지 않는다', () => {
  render(<MapboxScheduleMapView tripId='trip' schedules={day1} selectedScheduleId='b' />);
  expect(lastCamera().defaultSettings).toEqual({ centerCoordinate: [139.75, 35.66], zoomLevel: 15 });
  expect(lastCamera().bounds).toBeUndefined();
  expect(lastCamera().centerCoordinate).toBeUndefined();
});

it('선택한 일정이 없으면 모든 일정이 보이는 범위에서 시작한다', () => {
  render(<MapboxScheduleMapView tripId='trip' schedules={day1} />);
  const settings = lastCamera().defaultSettings as { bounds: { ne: number[]; sw: number[] } };
  expect(settings.bounds.ne).toEqual([139.75, 35.66]);
  expect(settings.bounds.sw).toEqual([135.5, 34.67]);
});

it('값이 같은 재렌더는 사용자가 옮겨 둔 지도를 선택 일정으로 되돌리지 않는다', () => {
  const view = render(<MapboxScheduleMapView tripId='trip' schedules={day1} selectedScheduleId='a' />);
  const moves = mockSetCamera.mock.calls.length;
  view.rerender(<MapboxScheduleMapView tripId='trip' schedules={day1.map((s) => ({ ...s }))} selectedScheduleId='a' />);
  expect(mockSetCamera.mock.calls.length).toBe(moves);
});

it('선택이 좌표 없는 일정인 날로 바뀌면 그날 좌표가 있는 일정 전체로 옮긴다', () => {
  const view = render(<MapboxScheduleMapView tripId='trip' schedules={day1} selectedScheduleId='a' />);
  mockFitBounds.mockClear();
  view.rerender(<MapboxScheduleMapView tripId='trip' schedules={day2} selectedScheduleId='d' />);
  expect(mockFitBounds).toHaveBeenCalledWith([135.53, 34.69], [135.5, 34.67], [100, 50, 300, 50], 300);
});
