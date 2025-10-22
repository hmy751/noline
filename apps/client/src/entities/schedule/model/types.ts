/**
 * Schedule Entity Types
 */

export type Schedule = {
  id: string;
  tripId: string;
  title: string;
  location: string | null;
  startTime: string; // ISO 8601 timestamp
  endTime: string | null; // ISO 8601 timestamp
  order: number;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateScheduleRequest = {
  tripId: string;
  title: string;
  location?: string;
  startTime: string; // ISO 8601 timestamp
  endTime?: string; // ISO 8601 timestamp
  order: number;
  memo?: string;
};
