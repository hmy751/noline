import { useCallback, useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import MapboxGL from '@rnmapbox/maps';

export interface StorageStats {
  dbSize: string;
  mapPackSize: string;
  totalSize: string;
}

interface DatabaseSizeResult {
  bytes: number;
  completed: boolean;
}

const DATABASE_DIRECTORY_NAME = 'SQLite';
const DATABASE_FILE_SUFFIXES = ['.db', '.db-wal', '.db-shm'] as const;
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const BYTES_PER_UNIT = 1024;

function isValidByteCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function formatBytes(bytes: number): string {
  if (!isValidByteCount(bytes) || bytes === 0) {
    return '0 B';
  }

  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT)), BYTE_UNITS.length - 1);
  const value = Number((bytes / BYTES_PER_UNIT ** unitIndex).toFixed(1));
  return `${value} ${BYTE_UNITS[unitIndex]}`;
}

function createStorageStats(databaseBytes: number, mapPackBytes: number): StorageStats {
  return {
    dbSize: formatBytes(databaseBytes),
    mapPackSize: formatBytes(mapPackBytes),
    totalSize: formatBytes(databaseBytes + mapPackBytes),
  };
}

function isDatabaseStorageFile(fileName: string): boolean {
  return DATABASE_FILE_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
}

async function collectDatabaseSize(): Promise<DatabaseSizeResult> {
  let bytes = 0;
  const documentsDirectory = FileSystem.documentDirectory;

  if (!documentsDirectory) {
    console.warn('SQLite 저장 용량을 계산할 수 없습니다: 문서 디렉터리를 사용할 수 없습니다.');
    return { bytes, completed: false };
  }

  const dbDirectory = `${documentsDirectory}${DATABASE_DIRECTORY_NAME}`;
  try {
    const directoryInfo = await FileSystem.getInfoAsync(dbDirectory);
    if (!directoryInfo.exists || !directoryInfo.isDirectory) {
      return { bytes, completed: true };
    }

    const files = await FileSystem.readDirectoryAsync(dbDirectory);
    for (const file of files) {
      if (!isDatabaseStorageFile(file)) {
        continue;
      }

      const fileInfo = await FileSystem.getInfoAsync(`${dbDirectory}/${file}`);
      if (fileInfo.exists && isValidByteCount(fileInfo.size)) {
        bytes += fileInfo.size;
      }
    }
  } catch (error) {
    console.warn('SQLite 저장 용량을 계산하지 못했습니다:', error);
    return { bytes, completed: false };
  }

  return { bytes, completed: true };
}

async function collectMapPackSize(): Promise<number> {
  let bytes = 0;
  const packs = await MapboxGL.offlineManager.getPacks();

  for (const pack of packs) {
    try {
      const status = await pack.status();
      if (status && isValidByteCount(status.completedResourceSize)) {
        bytes += status.completedResourceSize;
      }
    } catch (error) {
      console.warn('지도 팩 상태를 가져오지 못했습니다:', pack.name, error);
    }
  }

  return bytes;
}

async function calculateStorageStats(): Promise<StorageStats> {
  const database = await collectDatabaseSize();

  // DB 집계가 중단되면 부분 합계를 보존하고 Mapbox 조회는 시작하지 않습니다.
  if (!database.completed) {
    return createStorageStats(database.bytes, 0);
  }

  try {
    const mapPackBytes = await collectMapPackSize();
    return createStorageStats(database.bytes, mapPackBytes);
  } catch (error) {
    console.warn('오프라인 지도 저장 용량을 계산하지 못했습니다:', error);
    return createStorageStats(database.bytes, 0);
  }
}

export function useStorageStats() {
  const [stats, setStats] = useState<StorageStats>(() => createStorageStats(0, 0));
  const latestRequestId = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    const nextStats = await calculateStorageStats();

    if (requestId === latestRequestId.current) {
      setStats(nextStats);
    }
  }, []);

  useEffect(() => {
    refresh();

    return () => {
      // unmount 뒤 늦게 끝난 native 조회 결과는 상태에 반영하지 않습니다.
      latestRequestId.current += 1;
    };
  }, [refresh]);

  return { stats, refresh };
}
