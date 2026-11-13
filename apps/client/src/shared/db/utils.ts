import { runDatabaseTransaction } from './index';

/** entity 변경과 sync_queue 기록을 같은 transaction에서 실행한다. */
export async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return runDatabaseTransaction(callback);
}

export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/** Date는 ISO로 변환하고 문자열 입력은 검증 없이 그대로 반환한다. */
export function dateToISOString(date: Date | string | null): string | null {
  if (!date) {
    return null;
  }

  if (typeof date === 'string') {
    return date;
  }

  return date.toISOString();
}
