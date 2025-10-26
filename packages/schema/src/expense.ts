import { z } from 'zod';

// ========================================
// 1. Base Field Definitions (재사용 가능한 필드 그룹)
// ========================================

/**
 * 경비 핵심 정보 필드
 */
const expenseCoreFields = {
  title: z.string().min(1, 'Title is required'),
  amount: z.string().min(1, 'Amount is required'), // Decimal을 문자열로 처리
  currency: z.string().default('EUR'),
  category: z.string().min(1, 'Category is required'),
};

/**
 * 경비 추가 정보 필드
 */
const expenseOptionalFields = {
  scheduleId: z.string().ulid().nullable().optional(), // 일정 연결 (선택)
  hasReceipt: z.boolean().default(false),
  receiptUrl: z.string().nullable().optional(),
};

/**
 * 경비 날짜 필드
 * - date: 경비 지출 날짜 (ISO string)
 */
const expenseDateFields = {
  date: z.string().min(1, 'Date is required'), // ISO date string (e.g., "2024-03-15")
};

// ========================================
// 2. Entity Schema (DB)
// ========================================

/**
 * Expense Entity Schema (API 응답/로컬 DB용)
 * - 날짜: ISO 8601 datetime string
 * - 금액: string (decimal)
 * - API 응답 및 로컬 DB 저장 시 사용
 */
export const expenseSchema = z.object({
  id: z.string().ulid(),
  userId: z.string().ulid().nullable(), // 인증 추가 전까지 nullable
  tripId: z.string().ulid(),
  scheduleId: z.string().ulid().nullable(),
  title: z.string(),
  amount: z.string(), // DB decimal → string
  currency: z.string(),
  category: z.string(),
  date: z.string(), // ISO date string
  hasReceipt: z.boolean(),
  receiptUrl: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),

  // Phase 2: Local-First 필드 (선택적)
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  version: z.number().optional(),
});

// ========================================
// 3. Request Schemas (API 요청)
// ========================================

/**
 * 경비 생성 요청 스키마
 * - 클라이언트 → 서버
 * - 금액: string
 * - ✨ Echo 아키텍처: 클라이언트가 ID 생성 (Local-First)
 */
export const createExpenseRequestSchema = z.object({
  id: z.string().ulid(), // ✨ 클라이언트가 생성한 ULID
  userId: z.string().ulid().optional(), // 테스트용: 서버에서 기본값 사용
  tripId: z.string().ulid(),
  ...expenseCoreFields, // ⬅️ 상속: title, amount, currency, category
  ...expenseDateFields, // ⬅️ 상속: date
  ...expenseOptionalFields, // ⬅️ 상속: scheduleId, hasReceipt, receiptUrl
});

/**
 * 경비 수정 요청 스키마
 * - 클라이언트 → 서버
 * - 모든 필드 optional (partial update)
 */
export const updateExpenseRequestSchema = z
  .object({
    ...expenseCoreFields, // ⬅️ 상속
    ...expenseDateFields, // ⬅️ 상속
    scheduleId: z.string().ulid().nullable().optional(),
    hasReceipt: z.boolean().optional(),
    receiptUrl: z.string().nullable().optional(),
  })
  .partial(); // 모든 필드를 optional로

// ========================================
// 4. Response Schemas (API 응답)
// ========================================

/**
 * Expense 응답 데이터 스키마
 * - 서버 → 클라이언트
 * - 날짜: ISO 8601 datetime with timezone
 * - 금액: string (DB decimal 반환값)
 */
export const expenseResponseSchema = z.object({
  id: z.string().ulid(),
  userId: z.string().ulid().nullable(),
  tripId: z.string().ulid(),
  scheduleId: z.string().ulid().nullable(),
  title: z.string(),
  amount: z.string(), // API 응답은 string
  currency: z.string(),
  category: z.string(),
  date: z.string(), // ISO date string
  hasReceipt: z.boolean(),
  receiptUrl: z.string().nullable(),

  // ✅ ISO 8601 datetime with timezone
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),

  // Phase 2: Local-First 필드 (선택적)
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  version: z.number().optional(),
});

/**
 * 전체 경비 목록 조회 응답
 * GET /api/expenses
 */
export const getAllExpensesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(expenseResponseSchema),
});

/**
 * 경비 생성 응답
 * POST /api/expenses
 */
export const createExpenseResponseSchema = z.object({
  success: z.literal(true),
  data: expenseResponseSchema,
});

/**
 * 경비 수정 응답
 * PATCH /api/expenses/:id
 */
export const updateExpenseResponseSchema = z.object({
  success: z.literal(true),
  data: expenseResponseSchema,
});

/**
 * 경비 삭제 응답
 * DELETE /api/expenses/:id
 */
export const deleteExpenseResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

// ========================================
// 5. Types
// ========================================
export type Expense = z.infer<typeof expenseSchema>;
export type CreateExpenseRequest = z.infer<typeof createExpenseRequestSchema>;
export type UpdateExpenseRequest = z.infer<typeof updateExpenseRequestSchema>;
export type ExpenseResponse = z.infer<typeof expenseResponseSchema>;
export type GetAllExpensesResponse = z.infer<typeof getAllExpensesResponseSchema>;
export type CreateExpenseResponse = z.infer<typeof createExpenseResponseSchema>;
export type UpdateExpenseResponse = z.infer<typeof updateExpenseResponseSchema>;
export type DeleteExpenseResponse = z.infer<typeof deleteExpenseResponseSchema>;
