import { Router } from 'express';
import { z } from 'zod';

import { ackLegacyHoldResponse, legacyHoldsResponse } from '@repo/schema/responses/mutation-conflict';

import { requireAuth } from '../middleware/auth.js';
import { acknowledgeLegacyUpdate, refreshAndListLegacyUpdates } from '../services/legacy-update-holds.js';
import { sendInternalError } from '../utils/http-errors.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const holds = await refreshAndListLegacyUpdates(req.userId!);

    return res.json(legacyHoldsResponse.parse({ success: true, data: holds }));
  } catch (error) {
    return sendInternalError(res, 'Failed to load held updates', error);
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const holdId = z.string().ulid().safeParse(req.params.id);

  if (!holdId.success) {
    return res.status(400).json({ error: 'Validation error', message: 'Invalid hold ID' });
  }

  try {
    await acknowledgeLegacyUpdate(holdId.data, req.userId!);
    return res.json(ackLegacyHoldResponse.parse({ success: true, data: { id: holdId.data } }));
  } catch (error) {
    return sendInternalError(res, 'Failed to acknowledge held update', error);
  }
});

export default router;
