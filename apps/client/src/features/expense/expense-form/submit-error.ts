import { APIError } from '@/shared/api/fetcher';
import { ConfirmedUpdateError } from '@/shared/services/edit-stamp/errors';
import { OfflineError } from '@/shared/services/offline-prep/errors';
import { AuthRequiredError } from '@/shared/store/auth';

/** 저장 결과 확인·실패 안내. 내부 schema/SQLite 진단은 화면으로 노출하지 않는다. */
export const expenseSubmitError = (error: unknown): string => {
  return error instanceof OfflineError ||
    error instanceof AuthRequiredError ||
    error instanceof APIError ||
    error instanceof ConfirmedUpdateError
    ? error.message
    : '경비를 저장하지 못했어요. 입력은 유지되니 다시 시도해주세요.';
};
