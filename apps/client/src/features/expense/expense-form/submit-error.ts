import { APIError } from '@/shared/api/fetcher';
import { AuthRequiredError } from '@/shared/store/auth';
import { OfflineError } from '@/shared/services/offline-prep/errors';

/** 경비 초안의 저장 실패 안내. 내부 schema/SQLite 진단은 화면으로 노출하지 않는다. */
export function expenseSubmitError(error: unknown): string {
  return error instanceof OfflineError || error instanceof AuthRequiredError || error instanceof APIError
    ? error.message
    : '경비를 저장하지 못했어요. 입력은 유지되니 다시 시도해주세요.';
}
