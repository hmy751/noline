import { z } from 'zod';

// ========================================
// Places Request Schemas (Google Maps Integration)
// ========================================

/**
 * 장소 검색 요청 스키마
 * POST /api/places/search
 */
export const placesSearchRequest = z.object({
  query: z.string().min(1, 'Query is required'),
  cityName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  language: z.enum(['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de']).default('en'),
});

// 타입 추출
export type PlacesSearchRequest = z.infer<typeof placesSearchRequest>;
