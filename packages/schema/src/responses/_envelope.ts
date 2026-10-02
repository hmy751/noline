import { z } from 'zod';
import { isoDateTime } from '../primitives/datetime';

// ========================================
// Response Envelope Factories
// ========================================
//
// 정책: 모든 API 응답은 { success: true, data: ... } 구조를 따른다.
// 각 entity response 파일은 이 factory를 통해 동일한 envelope를 만든다.

export const okResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const okListResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
  });

/**
 * Soft delete 응답
 * DELETE /api/{entity}/:id
 *
 * trip/schedule/expense 모두 동일 shape.
 */
export const deleteResponse = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().ulid(),
    deletedAt: isoDateTime,
  }),
});
