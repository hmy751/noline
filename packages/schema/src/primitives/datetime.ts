import { z } from 'zod';

/** Offset을 포함하고 실제 시점으로 해석할 수 있는 ISO datetime. 값은 변환하지 않는다. */
export const isoDateTime = z
  .string()
  .datetime({ offset: true })
  .refine((value) => Number.isFinite(Date.parse(value)), 'Invalid datetime or timezone offset');
