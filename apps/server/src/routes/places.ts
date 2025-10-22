import { Router } from 'express';
import { Client } from '@googlemaps/google-maps-services-js';
import config from '../config/index.js';

const router = Router();
const googleMapsClient = new Client({});

/**
 * POST /api/places/search
 * Google Places Autocomplete 검색
 *
 * Request Body:
 * - query: 검색어 (필수)
 * - cityName: 여행 도시 이름 (선택, 추천)
 * - latitude, longitude: 여행 도시 위치 (선택, cityName보다 우선)
 * - language: 결과 언어 (선택, 기본값: 'en') - 'ko' | 'en' | 'ja' 등
 */
router.post('/search', async (req, res, next) => {
  try {
    const { query, cityName, latitude, longitude, language = 'en' } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter is required',
      });
    }

    if (!config.googleMaps.placesApiKey) {
      return res.status(500).json({
        error: 'Google Places API key is not configured',
      });
    }

    // 지원 언어 검증
    const supportedLanguages = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'];
    const resultLanguage = supportedLanguages.includes(language) ? language : 'en';

    // 검색 파라미터 구성
    const searchParams: any = {
      input: query,
      key: config.googleMaps.placesApiKey,
      language: resultLanguage,
    };

    // 1. 좌표가 있으면 locationbias 사용 (우선순위 높음)
    if (latitude && longitude) {
      searchParams.locationbias = `circle:50000@${latitude},${longitude}`; // 50km 반경
      console.log(`🎯 Searching near coordinates: ${latitude}, ${longitude}`);
    }
    // 2. 도시 이름이 있으면 해당 도시로 제한
    else if (cityName && typeof cityName === 'string') {
      // 도시 이름을 쿼리에 포함하여 해당 지역 우선
      searchParams.input = `${query} in ${cityName}`;
      console.log(`🎯 Searching in city: ${cityName}`);
    }

    // Google Places Autocomplete API 호출
    const response = await googleMapsClient.placeAutocomplete({
      params: searchParams,
    });

    // 검색 결과 변환
    const predictions = response.data.predictions.map((prediction) => ({
      id: prediction.place_id,
      name: prediction.structured_formatting.main_text,
      address: prediction.description,
      placeId: prediction.place_id,
    }));

    res.json({
      results: predictions,
      searchContext: {
        query,
        cityName: cityName || null,
        coordinates: latitude && longitude ? { latitude, longitude } : null,
        language: resultLanguage,
      },
    });
  } catch (error) {
    console.error('Places search error:', error);
    next(error);
  }
});

/**
 * GET /api/places/:placeId
 * 장소 상세 정보 조회 (위도/경도 포함)
 *
 * Query Parameters:
 * - language: 결과 언어 (선택, 기본값: 'en')
 */
router.get('/:placeId', async (req, res, next) => {
  try {
    const { placeId } = req.params;
    const { language = 'en' } = req.query;

    if (!placeId) {
      return res.status(400).json({
        error: 'Place ID is required',
      });
    }

    if (!config.googleMaps.placesApiKey) {
      return res.status(500).json({
        error: 'Google Places API key is not configured',
      });
    }

    // 지원 언어 검증
    const supportedLanguages = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'];
    const resultLanguage = supportedLanguages.includes(language as string) ? language : 'en';

    // Google Place Details API 호출
    const response = await googleMapsClient.placeDetails({
      params: {
        place_id: placeId,
        key: config.googleMaps.placesApiKey,
        language: resultLanguage as string,
        fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'place_id'],
      },
    });

    const place = response.data.result;

    if (!place || !place.geometry) {
      return res.status(404).json({
        error: 'Place not found',
      });
    }

    // 사진 URL 생성 (첫 번째 사진만)
    let photoUrl: string | undefined;
    if (place.photos && place.photos.length > 0) {
      const photoReference = place.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${config.googleMaps.placesApiKey}`;
    }

    // 응답 데이터 구성
    const placeDetail = {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      placeId: place.place_id,
      photoUrl,
      rating: place.rating,
    };

    res.json(placeDetail);
  } catch (error) {
    console.error('Place details error:', error);
    next(error);
  }
});

export default router;
