import { expenses, schedules, trips, type SyncTableName } from '@/shared/db';

export const SYNC_TABLES = { trips, schedules, expenses };

export const isSyncTable = (name: string): name is SyncTableName => Object.hasOwn(SYNC_TABLES, name);
