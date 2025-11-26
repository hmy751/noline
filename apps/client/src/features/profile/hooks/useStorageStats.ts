import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import MapboxGL from '@rnmapbox/maps';

export interface StorageStats {
  dbSize: string;
  mapPackSize: string;
  totalSize: string;
}

export function useStorageStats() {
  const [stats, setStats] = useState<StorageStats>({
    dbSize: '0 B',
    mapPackSize: '0 B',
    totalSize: '0 B',
  });

  useEffect(() => {
    calculateStorage();
  }, []);

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const calculateStorage = async () => {
    let dbSizeBytes = 0;
    let mapSizeBytes = 0;

    try {
      // 1. SQLite DB 용량
      // Expo SQLite는 문서 디렉토리의 SQLite 폴더에 .db 확장자로 파일을 생성합니다.
      // 보통 경로는 ${FileSystem.documentDirectory}SQLite/noline.db 입니다.
      const dbDir = `${FileSystem.documentDirectory}SQLite`;
      const dbInfo = await FileSystem.getInfoAsync(dbDir);

      if (dbInfo.exists && dbInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(dbDir);
        for (const file of files) {
          if (file.endsWith('.db') || file.endsWith('.db-wal') || file.endsWith('.db-shm')) {
            const fileInfo = await FileSystem.getInfoAsync(`${dbDir}/${file}`);
            if (fileInfo.exists) {
              dbSizeBytes += fileInfo.size;
            }
          }
        }
      }

      // 2. Mapbox 오프라인 팩 용량 (Mapbox에서 직접 조회)
      // MapboxGL.offlineManager.getPacks()로 팩 목록을 가져온 후,
      // 각 팩의 status()를 호출하여 completedResourceSize를 합산합니다.
      const packs = await MapboxGL.offlineManager.getPacks();

      for (const pack of packs) {
        try {
          const status = await pack.status();
          if (status && typeof status.completedResourceSize === 'number') {
            mapSizeBytes += status.completedResourceSize;
          }
        } catch (err) {
          console.warn('Failed to get status for pack:', pack.name, err);
        }
      }

      setStats({
        dbSize: formatBytes(dbSizeBytes),
        mapPackSize: formatBytes(mapSizeBytes),
        totalSize: formatBytes(dbSizeBytes + mapSizeBytes),
      });
    } catch (error) {
      console.warn('Failed to calculate storage stats:', error);
      // Fallback display
      setStats({
        dbSize: formatBytes(dbSizeBytes),
        mapPackSize: formatBytes(mapSizeBytes),
        totalSize: formatBytes(dbSizeBytes + mapSizeBytes),
      });
    }
  };

  return { stats, refresh: calculateStorage };
}
