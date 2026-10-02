import { beforeEach, expect, it, jest } from '@jest/globals';
import { searchPlaceResolutions, searchResolvedPlaces } from '@/shared/services/places/api';
import { useNetworkStore } from '@/shared/store/network';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('@/shared/api/axios-instances', () => ({
  authAxios: { post: (...args: unknown[]) => mockSearch(...args), get: (...args: unknown[]) => mockDetail(...args) },
}));
const mockSearch = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockDetail = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const candidate = { id: 'tower', placeId: 'tower', name: 'Tower', address: 'Paris' };
const detail = { ...candidate, latitude: 0, longitude: 2.294 };
const response = {
  success: true,
  data: {
    results: [candidate],
    searchContext: { query: 'tower', cityName: null, coordinates: null, language: 'en' },
  },
};
beforeEach(() => {
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null, checkStatus: 'idle' });
  mockSearch.mockResolvedValue({ data: response });
  mockDetail.mockResolvedValue({ data: detail });
});

it('요청을 검증·정규화하고 bare 상세 응답의 유효 좌표 0을 보존한다', async () => {
  await expect(searchResolvedPlaces(' tower ', { cityName: 'Paris', latitude: 0, longitude: 2 })).resolves.toEqual([
    detail,
  ]);
  expect(mockSearch).toHaveBeenCalledWith('/api/places/search', {
    query: 'tower',
    cityName: 'Paris',
    latitude: 0,
    longitude: 2,
    language: 'en',
  });
  expect(mockDetail).toHaveBeenCalledWith('/api/places/tower?language=en');
  await expect(searchResolvedPlaces(' ')).rejects.toThrow();
  expect(mockSearch).toHaveBeenCalledTimes(1);
});

it('검색 응답 shape가 틀리면 상세 요청 전에 거부한다', async () => {
  mockSearch.mockResolvedValue({ data: { data: { results: [candidate] } } });
  await expect(searchResolvedPlaces('tower')).rejects.toThrow();
  expect(mockDetail).not.toHaveBeenCalled();
});

it.each([
  { ...detail, latitude: undefined },
  { ...detail, longitude: Number.NaN },
  { ...detail, latitude: 91 },
  { ...detail, placeId: undefined },
  { success: true, data: detail },
])('잘못된 상세 응답을 정상 장소로 반환하지 않는다: %p', async (invalid) => {
  mockDetail.mockResolvedValue({ data: invalid });
  await expect(searchResolvedPlaces('tower')).rejects.toThrow();
});

it('정상 검색은 상세 한 건의 실패도 전체 오류로 전달한다', async () => {
  const error = new Error('detail unavailable');
  mockSearch.mockResolvedValue({
    data: {
      ...response,
      data: { ...response.data, results: [candidate, { ...candidate, id: 'cafe', placeId: 'cafe' }] },
    },
  });
  mockDetail.mockResolvedValueOnce({ data: detail }).mockRejectedValueOnce(error);
  await expect(searchResolvedPlaces('tower')).rejects.toBe(error);
});

it('부분 실패 계약은 실패 후보와 정상 상세를 좌표 대체 없이 구분한다', async () => {
  const error = new Error('detail unavailable');
  mockSearch.mockResolvedValue({
    data: {
      ...response,
      data: { ...response.data, results: [candidate, { ...candidate, id: 'cafe', placeId: 'cafe' }] },
    },
  });
  mockDetail.mockResolvedValueOnce({ data: detail }).mockRejectedValueOnce(error);
  await expect(searchPlaceResolutions('tower')).resolves.toEqual([
    { status: 'resolved', place: detail },
    { status: 'unresolved-detail', candidate: { ...candidate, id: 'cafe', placeId: 'cafe' }, error },
  ]);
});

it('강제 online이 실제 offline인 상태의 요청을 열지 않는다', async () => {
  useNetworkStore.setState({ realStatus: 'offline', overrideStatus: 'online' });
  await expect(searchResolvedPlaces('tower')).rejects.toThrow(/연결이 변경/);
  expect(mockSearch).not.toHaveBeenCalled();
});

it('검색 이후 정책 중단은 부분 상세 실패 대체로 흡수하지 않는다', async () => {
  mockSearch.mockImplementation(async () => {
    useNetworkStore.setState({ realStatus: 'offline' });
    return { data: response };
  });
  await expect(searchPlaceResolutions('tower')).rejects.toThrow(/연결이 변경/);
  expect(mockDetail).not.toHaveBeenCalled();
});

it('상세 요청 뒤 정책 중단도 정상 결과를 반환하지 않는다', async () => {
  mockDetail.mockImplementation(async () => {
    useNetworkStore.setState({ realStatus: 'offline' });
    return { data: detail };
  });
  await expect(searchResolvedPlaces('tower')).rejects.toThrow(/연결이 변경/);
});
