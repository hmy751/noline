import { GEONAMES_API_URL, GEONAMES_USERNAME } from '@env';
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

const fetcher = axios.create({
  baseURL: GEONAMES_API_URL,
});

export const searchCities = async (namePrefix: string): Promise<City[]> => {
  try {
    const response = await fetcher.get<GeonamesResponse>('/searchJSON', {
      params: {
        name_startsWith: namePrefix,
        lang: 'ko',
        orderBy: 'population',
        maxRows: 10,
        username: GEONAMES_USERNAME,
        featureCode: ['PPLC', 'PPLA', 'PPLA2', 'PPL'],
        style: 'full',
      },
    });

    // API 응답 중 name, country 필드가 비어있지 않은 결과만 필터링
    const validResults = response.data.geonames.filter((item) => item.name && item.countryName);

    const allowedFCodes = ['PPLC', 'PPLA', 'PPLA2', 'PPL']; // 허용할 도시 등급 목록

    const filteredCities = validResults.filter(
      (item) =>
        allowedFCodes.includes(item.fcode) &&
        // 최소 인구 조건을 추가해 더 확실하게 필터링
        (item.population > 10000 || item.fcode === 'PPLC'),
    );

    return filteredCities.map((item) => ({
      id: item.geonameId,
      name: item.name,
      country: item.countryName,
      countryCode: item.countryCode,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lng),
    }));
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
};
