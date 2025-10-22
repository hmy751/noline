// ========================================
// Trip API Types
// ========================================

export type TripData = {
  id: number;
  name: string;
  destination: string;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GetAllTripsResponse = {
  success: boolean;
  data: TripData[];
};

export type CreateTripRequest = {
  userId?: number;
  name: string;
  destination: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  cityId?: number;
  startDate: string;
  endDate: string;
};

export type CreateTripResponse = {
  success: boolean;
  data: {
    id: number;
    userId: number | null;
    name: string;
    destination: string;
    country: string | null;
    latitude: string | null;
    longitude: string | null;
    cityId: number | null;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateTripRequest = {
  name?: string;
  destination?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
};

export type UpdateTripResponse = {
  success: boolean;
  data: TripData;
};

export type DeleteTripResponse = {
  success: boolean;
  message: string;
};
