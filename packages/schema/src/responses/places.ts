import { z } from 'zod';

// ========================================
// Places Response Schemas (Google Maps Integration)
// ========================================

/**
 * 장소 검색 결과 아이템 스키마
 */
const placeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  placeId: z.string(),
});

/**
 * 검색 컨텍스트 스키마
 */
const searchContextSchema = z.object({
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
 *
 * 정책: 모든 API 응답은 { success, data } 구조를 따른다
 */
export const placesSearchResponse = z.object({
  success: z.literal(true),
  data: z.object({
    results: z.array(placeItemSchema),
    searchContext: searchContextSchema,
  }),
});
