import { createScheduleRequest, updateScheduleRequest } from '@repo/schema/requests/schedule';
import { scheduleListResponse, scheduleResponse, deleteScheduleResponse } from '@repo/schema/responses/schedule';

import apiClient from '@/shared/api/fetcher';
import { observeFieldEdits, type PreparedEdit } from '@/shared/services/edit-stamp';
import { ConfirmedUpdateError } from '@/shared/services/edit-stamp/errors';

import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest, DeleteScheduleResponse } from '../model';

export const fetchSchedules = async (tripId: string): Promise<Schedule[]> => {
  const response = await apiClient.get(`/api/schedules?tripId=${tripId}`);
  const schedules = scheduleListResponse.parse(response).data;

  for (const schedule of schedules) {
    await observeFieldEdits(schedule.fieldEdits);
  }

  return schedules;
};

export const fetchScheduleById = async (id: string): Promise<Schedule> => {
  const response = await apiClient.get(`/api/schedules/${id}`);
  const schedule = scheduleResponse.parse(response).data;

  await observeFieldEdits(schedule.fieldEdits);
  return schedule;
};

export const fetchCreateSchedule = async (input: CreateScheduleRequest): Promise<Schedule> => {
  const request = createScheduleRequest.parse(input);
  const response = await apiClient.post('/api/schedules', request);
  const schedule = scheduleResponse.parse(response).data;

  await observeFieldEdits(schedule.fieldEdits);
  return schedule;
};

export const fetchUpdateSchedule = async (
  id: string,
  input: PreparedEdit<UpdateScheduleRequest>,
): Promise<Schedule> => {
  const request = updateScheduleRequest.parse(input);
  const response = await apiClient.put(`/api/schedules/${id}`, request);
  const schedule = scheduleResponse.parse(response).data;

  try {
    await observeFieldEdits(schedule.fieldEdits);
  } catch (error) {
    throw new ConfirmedUpdateError(error);
  }

  return schedule;
};

export const fetchDeleteSchedule = async (id: string): Promise<DeleteScheduleResponse['data']> => {
  const response = await apiClient.delete(`/api/schedules/${id}`);
  return deleteScheduleResponse.parse(response).data;
};
