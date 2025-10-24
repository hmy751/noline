import { z } from 'zod';

// ========================================
// Places API Schemas (Google Maps Integration)
// ========================================

/**
 * 장소 검색 요청 스키마
 * POST /api/places/search
 */
export const placesSearchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  cityName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  language: z.enum(['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de']).default('en'),
});

/**
 * 장소 검색 결과 아이템 스키마
 */
export const placeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  placeId: z.string(),
});

/**
 * 검색 컨텍스트 스키마
 */
export const searchContextSchema = z.object({
  query: z.string(),
  cityName: z.string().nullable(),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .nullable(),
  language: z.string(),
});

/**
 * 장소 검색 응답 스키마
 * POST /api/places/search
 */
export const placesSearchResponseSchema = z.object({
  results: z.array(placeItemSchema),
  searchContext: searchContextSchema,
});

/**
 * 장소 상세 정보 스키마
 * GET /api/places/:placeId
 */
export const placeDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  placeId: z.string(),
  photoUrl: z.string().optional(),
  rating: z.number().optional(),
});

// ========================================
// Type Exports
// ========================================

export type PlacesSearchRequest = z.infer<typeof placesSearchRequestSchema>;
export type PlaceItem = z.infer<typeof placeItemSchema>;
export type SearchContext = z.infer<typeof searchContextSchema>;
export type PlacesSearchResponse = z.infer<typeof placesSearchResponseSchema>;
export type PlaceDetail = z.infer<typeof placeDetailSchema>;
