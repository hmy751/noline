import { EXPO_PUBLIC_GEONAMES_API_URL, EXPO_PUBLIC_GEONAMES_USERNAME } from '@env';
import axios from 'axios';

export interface City {
  id: number;
  name: string;
  country: string; // 국가명 (한글 또는 영어)
  countryCode: string; // ISO 국가 코드 (KR, JP, US, etc.)
  latitude: number;
  longitude: number;
}

interface Geoname {
  geonameId: number;
  name: string;
  countryName: string;
  countryCode: string; // ISO 3166-1 alpha-2 (KR, JP, US, etc.)
  lat: string;
  lng: string;
  fcode: string;
  population: number;
}

interface GeonamesResponse {
  geonames: Geoname[];
}

const CAPITAL_FEATURE_CODE = 'PPLC';
const CITY_FEATURE_CODES = [CAPITAL_FEATURE_CODE, 'PPLA', 'PPLA2', 'PPL'];
const MIN_CITY_POPULATION = 10_000;

const fetcher = axios.create({
  baseURL: EXPO_PUBLIC_GEONAMES_API_URL,
});

const isSearchableCity = (geoname: Geoname): boolean => {
  if (!geoname.name || !geoname.countryName) {
    return false;
  }

  if (!CITY_FEATURE_CODES.includes(geoname.fcode)) {
    return false;
  }

  return geoname.fcode === CAPITAL_FEATURE_CODE || geoname.population > MIN_CITY_POPULATION;
};

const toCity = (geoname: Geoname): City => ({
  id: geoname.geonameId,
  name: geoname.name,
  country: geoname.countryName,
  countryCode: geoname.countryCode,
  latitude: parseFloat(geoname.lat),
  longitude: parseFloat(geoname.lng),
});

export const searchCities = async (namePrefix: string): Promise<City[]> => {
  try {
    const response = await fetcher.get<GeonamesResponse>('/searchJSON', {
      params: {
        name_startsWith: namePrefix,
        lang: 'ko',
        orderBy: 'population',
        maxRows: 10,
        username: EXPO_PUBLIC_GEONAMES_USERNAME,
        featureCode: CITY_FEATURE_CODES,
        style: 'full',
      },
    });

    return response.data.geonames.filter(isSearchableCity).map(toCity);
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
};
