import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, expenses } from '../db/index.js';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { createExpenseRequest, updateExpenseRequest } from '@repo/schema/requests/expense';
import { expenseEntity } from '@repo/schema/entities/expense';

const router = Router();

// GET /api/expenses - 경비 조회 (Query Parameter 방식)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tripId, scheduleId } = req.query;

    // 조건 구성
    const conditions = [isNull(expenses.deletedAt)];

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
      const validated = expenseEntity.safeParse({
        ...expense,
        hasReceipt: expense.hasReceipt === 1,
        date: expense.date.toISOString().split('T')[0],
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
        deletedAt: expense.deletedAt?.toISOString() || null,
      });

      if (!validated.success) {
        console.error('Expense validation error:', validated.error);
        throw new Error('Invalid expense data');
      }

      return validated.data;
    });

    res.status(200).json(validatedExpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch expenses',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch expenses',
        details: 'Unknown error occurred',
      });
    }
  }
});

// POST /api/expenses - 경비 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    // Zod로 요청 데이터 검증
    const validationResult = createExpenseRequest.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { id, userId, tripId, scheduleId, title, amount, currency, category, date, hasReceipt, receiptUrl } =
      validationResult.data;

    // 경비 생성 (클라이언트가 생성한 ID 사용)
    const [newExpense] = await db
      .insert(expenses)
      .values({
        id, // ✨ 클라이언트가 생성한 ULID
        userId: userId || null,
        tripId,
        scheduleId: scheduleId || null,
        title,
        amount,
        currency,
        category,
        date: new Date(date), // ISO string → Date 객체
        hasReceipt: hasReceipt ? 1 : 0, // boolean → integer
        receiptUrl: receiptUrl || null,
      })
      .returning();

    // Zod로 응답 데이터 검증
    const validated = expenseEntity.safeParse({
      ...newExpense,
      hasReceipt: newExpense.hasReceipt === 1, // integer → boolean
      date: newExpense.date.toISOString().split('T')[0], // Date → ISO date string
      createdAt: newExpense.createdAt.toISOString(),
      updatedAt: newExpense.updatedAt.toISOString(),
      deletedAt: newExpense.deletedAt?.toISOString() || null,
    });

    if (!validated.success) {
      console.error('Expense validation error:', validated.error);
      throw new Error('Invalid expense data');
    }

    res.status(201).json({
      success: true,
      data: validated.data,
    });
  } catch (error) {
    console.error('Error creating expense:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create expense',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create expense',
        details: 'Unknown error occurred',
      });
    }
  }
});

// PUT /api/expenses/:id - 경비 수정
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Zod로 요청 데이터 검증
    const validationResult = updateExpenseRequest.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const updateData = validationResult.data;

    // 경비 수정
    const [updatedExpense] = await db
      .update(expenses)
      .set({
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.amount && { amount: updateData.amount }),
        ...(updateData.currency && { currency: updateData.currency }),
        ...(updateData.category && { category: updateData.category }),
        ...(updateData.date && { date: new Date(updateData.date) }),
        ...(updateData.hasReceipt !== undefined && { hasReceipt: updateData.hasReceipt ? 1 : 0 }),
        ...(updateData.receiptUrl !== undefined && { receiptUrl: updateData.receiptUrl }),
        ...(updateData.scheduleId !== undefined && { scheduleId: updateData.scheduleId }),
        updatedAt: new Date(),
        version: sql`${expenses.version} + 1`, // ✅ version 증가 (Local-First)
      })
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
      .returning();

    if (!updatedExpense) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Expense not found',
      });
    }

    // Zod로 응답 데이터 검증
    const validated = expenseEntity.safeParse({
      ...updatedExpense,
      hasReceipt: updatedExpense.hasReceipt === 1,
      date: updatedExpense.date.toISOString().split('T')[0],
      createdAt: updatedExpense.createdAt.toISOString(),
      updatedAt: updatedExpense.updatedAt.toISOString(),
      deletedAt: updatedExpense.deletedAt?.toISOString() || null,
    });

    if (!validated.success) {
      console.error('Expense validation error:', validated.error);
      throw new Error('Invalid expense data');
    }

    res.json({
      success: true,
      data: validated.data,
    });
  } catch (error) {
    console.error('Error updating expense:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update expense',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update expense',
        details: 'Unknown error occurred',
      });
    }
  }
});

// DELETE /api/expenses/:id - 경비 삭제 (Soft Delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Soft Delete: deletedAt 업데이트
    const [deletedExpense] = await db
      .update(expenses)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        version: sql`${expenses.version} + 1`, // ✅ version 증가 (Local-First)
      })
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
      .returning();

    if (!deletedExpense) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Expense not found',
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting expense:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete expense',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete expense',
        details: 'Unknown error occurred',
      });
    }
  }
});

export default router;
