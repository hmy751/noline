import { eq, and, isNull, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';

import { expenseEntity } from '@repo/schema/entities/expense';
import { createExpenseRequest, updateExpenseRequest } from '@repo/schema/requests/expense';
import { deleteExpenseResponse, expenseListResponse, expenseResponse } from '@repo/schema/responses/expense';

import { db, expenses } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeExpense } from '../serializers/expense.js';
import { createExpense, updateExpense, deleteEntity } from '../services/entity-mutations.js';
import { sendInternalError } from '../utils/http-errors.js';

const router = Router();

// GET /api/expenses - 경비 조회 (Query Parameter 방식)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { tripId, scheduleId } = req.query;
    const userId = req.userId!;

    // 조건 구성 (소유권 필터링)
    const conditions = [isNull(expenses.deletedAt), eq(expenses.userId, userId)];

    if (tripId) {
      conditions.push(eq(expenses.tripId, tripId as string));
    }

    if (scheduleId) {
      conditions.push(eq(expenses.scheduleId, scheduleId as string));
    }

    // 경비 목록 조회
    const expenseList = await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(sql`${expenses.createdAt} DESC`);

    // Zod로 응답 데이터 검증
    const validatedExpenses = expenseList.map((expense) => {
      const validated = expenseEntity.safeParse(serializeExpense(expense));

      if (!validated.success) {
        console.error('Expense validation error:', validated.error);
        throw new Error('Invalid expense data');
      }

      return validated.data;
    });

    // 정책: 전체 응답 구조 검증
    const response = { success: true as const, data: validatedExpenses };
    const validatedResponse = expenseListResponse.safeParse(response);

    if (!validatedResponse.success) {
      console.error('Response validation error:', validatedResponse.error);
      return res.status(500).json({
        error: 'Internal validation error',
        message: 'Response validation failed',
      });
    }

    res.status(200).json(validatedResponse.data);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    sendInternalError(res, 'Failed to fetch expenses', error);
  }
});

// POST /api/expenses - 경비 생성
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const request = createExpenseRequest.safeParse(req.body);

    if (!request.success) {
      return res
        .status(400)
        .json({ error: 'Validation error', message: 'Invalid request data', details: request.error.errors });
    }

    const result = await createExpense(request.data, req.userId!);
    const body = result.status < 300 ? expenseResponse.parse(result.body) : result.body;

    return res.status(result.status).json(body);
  } catch (error) {
    sendInternalError(res, 'Failed to create expense', error);
  }
});

// GET /api/expenses/:id - 특정 경비 조회
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // 경비 조회 (Soft Delete 제외, 소유권 확인)
    const [expense] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId), isNull(expenses.deletedAt)))
      .limit(1);

    if (!expense) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Expense not found',
      });
    }

    // Zod로 응답 데이터 검증
    const validated = expenseEntity.safeParse(serializeExpense(expense));

    if (!validated.success) {
      console.error('Expense validation error:', validated.error);
      throw new Error('Invalid expense data');
    }

    // 정책: 전체 응답 구조 검증
    const response = { success: true as const, data: validated.data };
    const validatedResponse = expenseResponse.safeParse(response);

    if (!validatedResponse.success) {
      console.error('Response validation error:', validatedResponse.error);
      return res.status(500).json({
        error: 'Internal validation error',
        message: 'Response validation failed',
      });
    }

    res.status(200).json(validatedResponse.data);
  } catch (error) {
    console.error('Error fetching expense:', error);
    sendInternalError(res, 'Failed to fetch expense', error);
  }
});

// PUT /api/expenses/:id - 경비 수정
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const request = updateExpenseRequest.safeParse(req.body);

    if (!request.success) {
      return res
        .status(400)
        .json({ error: 'Validation error', message: 'Invalid request data', details: request.error.errors });
    }

    const result = await updateExpense(req.params.id, req.userId!, request.data, req.body);
    const body = result.status < 300 ? expenseResponse.parse(result.body) : result.body;

    return res.status(result.status).json(body);
  } catch (error) {
    sendInternalError(res, 'Failed to update expense', error);
  }
});

// DELETE /api/expenses/:id - 경비 삭제 (Soft Delete)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await deleteEntity('expense', req.params.id, req.userId!);
    const body = result.status < 300 ? deleteExpenseResponse.parse(result.body) : result.body;

    return res.status(result.status).json(body);
  } catch (error) {
    sendInternalError(res, 'Failed to delete expense', error);
  }
});

export default router;
