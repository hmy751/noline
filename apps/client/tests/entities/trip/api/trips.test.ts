import { expect, it, jest } from '@jest/globals';
import apiClient from '@/shared/api/fetcher';
import { fetchUpdateTrip } from '@/entities/trip/api/trips';

jest.mock('@/shared/api/fetcher', () => ({ __esModule: true, default: { put: jest.fn(), patch: jest.fn() } }));

it('서버 Trip 수정 계약인 PUT에 부분 수정 요청을 보내고 응답을 검증한다', async () => {
  const id = '01ARZ3NDEKTSV4RRFFQ69G5FAZ';
  const now = '2026-10-04T00:00:00.000Z';
  const trip = {
    id,
    userId: '01ARZ3NDEKTSV4RRFFQ69G5FA0',
    name: '수정',
    destination: 'Tokyo',
    country: null,
    baseCurrency: 'JPY',
    latitude: null,
    longitude: null,
    cityId: null,
    startDate: now,
    endDate: now,
    createdAt: now,
    updatedAt: now,
  };
  jest.mocked(apiClient.put).mockResolvedValue({ success: true, data: trip });
  await expect(fetchUpdateTrip(id, { name: '수정' })).resolves.toMatchObject(trip);
  expect(apiClient.put).toHaveBeenCalledWith(`/api/trips/${id}`, { name: '수정' });
  expect(apiClient.patch).not.toHaveBeenCalled();
});
