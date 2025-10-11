import { z } from 'zod';

export const helloSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
});

export type Hello = z.infer<typeof helloSchema>;
