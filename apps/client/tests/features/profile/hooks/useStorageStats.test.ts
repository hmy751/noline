import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as FileSystem from 'expo-file-system';
import type { FileInfo } from 'expo-file-system';
import MapboxGL from '@rnmapbox/maps';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useStorageStats } from '@/features/profile/hooks/useStorageStats';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
}));

jest.mock('@rnmapbox/maps', () => ({
  __esModule: true,
  default: {
    offlineManager: {
      getPacks: jest.fn(),
    },
  },
}));

const dbDirectory = 'file:///documents/SQLite';
const getInfoAsyncMock = FileSystem.getInfoAsync as jest.MockedFunction<typeof FileSystem.getInfoAsync>;
const readDirectoryAsyncMock = FileSystem.readDirectoryAsync as jest.MockedFunction<
  typeof FileSystem.readDirectoryAsync
>;

interface TestPack {
  name: string;
  status: jest.Mock<() => Promise<{ completedResourceSize: number }>>;
}

const getPacksMock = MapboxGL.offlineManager.getPacks as unknown as jest.Mock<() => Promise<TestPack[]>>;

function existingInfo(uri: string, size: number, isDirectory = false): FileInfo {
  return {
    exists: true,
    uri,
    size,
    isDirectory,
    modificationTime: 0,
  };
}

function arrangeDbFiles(files: Array<[name: string, result: number | Error]>) {
  readDirectoryAsyncMock.mockResolvedValue(files.map(([name]) => name));
  getInfoAsyncMock.mockImplementation(async (uri: string) => {
    if (uri === dbDirectory) {
      return existingInfo(uri, 0, true);
    }

    const name = uri.slice(`${dbDirectory}/`.length);
    const result = files.find(([fileName]) => fileName === name)?.[1];

    if (result instanceof Error) {
      throw result;
    }

    return existingInfo(uri, result ?? 0);
  });
}

function createPack(name: string, completedResourceSize: number | Error) {
  return {
    name,
    status: jest.fn(async () => {
      if (completedResourceSize instanceof Error) {
        throw completedResourceSize;
      }

      return { completedResourceSize };
    }),
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe('저장 용량 통계', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('DB 디렉터리와 지도 팩이 비어 있으면 모든 용량을 0 B로 표시한다', async () => {
    arrangeDbFiles([]);
    getPacksMock.mockResolvedValue([]);

    const { result } = renderHook(() => useStorageStats());

    await waitFor(() => expect(getPacksMock).toHaveBeenCalledTimes(1));

    expect(result.current.stats).toEqual({
      dbSize: '0 B',
      mapPackSize: '0 B',
      totalSize: '0 B',
    });
  });

  it('DB 관련 파일과 지도 팩만 합산하고 무관한 파일은 제외한다', async () => {
    arrangeDbFiles([
      ['noline.db', 1024],
      ['noline.db-wal', 512],
      ['noline.db-shm', 0],
      ['notes.txt', 9999],
    ]);
    getPacksMock.mockResolvedValue([createPack('seoul', 1024)]);

    const { result } = renderHook(() => useStorageStats());

    await waitFor(() => {
      expect(result.current.stats).toEqual({
        dbSize: '1.5 KB',
        mapPackSize: '1 KB',
        totalSize: '2.5 KB',
      });
    });
    expect(getInfoAsyncMock).not.toHaveBeenCalledWith(`${dbDirectory}/notes.txt`);
  });

  it('DB 디렉터리가 없어도 지도 팩 용량은 계산한다', async () => {
    getInfoAsyncMock.mockResolvedValue({ exists: false, uri: dbDirectory, isDirectory: false });
    getPacksMock.mockResolvedValue([createPack('seoul', 1024)]);

    const { result } = renderHook(() => useStorageStats());

    await waitFor(() => {
      expect(result.current.stats).toEqual({
        dbSize: '0 B',
        mapPackSize: '1 KB',
        totalSize: '1 KB',
      });
    });
    expect(readDirectoryAsyncMock).not.toHaveBeenCalled();
  });

  it('native module이 반환한 유효하지 않은 용량은 합산하지 않는다', async () => {
    arrangeDbFiles([
      ['valid.db', 1024],
      ['invalid.db-wal', Number.NaN],
      ['negative.db-shm', -1],
    ]);
    getPacksMock.mockResolvedValue([
      createPack('valid', 512),
      createPack('invalid', Number.NaN),
      createPack('negative', -1),
    ]);

    const { result } = renderHook(() => useStorageStats());

    await waitFor(() => {
      expect(result.current.stats).toEqual({
        dbSize: '1 KB',
        mapPackSize: '512 B',
        totalSize: '1.5 KB',
      });
    });
  });

  it('DB 파일 조회 중 실패하면 부분 합계를 보존하고 Mapbox 조회를 시작하지 않는다', async () => {
    arrangeDbFiles([
      ['noline.db', 1024],
      ['noline.db-wal', new Error('WAL 파일을 읽을 수 없음')],
      ['noline.db-shm', 2048],
    ]);

    const { result } = renderHook(() => useStorageStats());

    await waitFor(() => {
      expect(result.current.stats).toEqual({
        dbSize: '1 KB',
        mapPackSize: '0 B',
        totalSize: '1 KB',
      });
    });
    expect(getInfoAsyncMock).not.toHaveBeenCalledWith(`${dbDirectory}/noline.db-shm`);
    expect(getPacksMock).not.toHaveBeenCalled();
  });

  it('지도 팩 목록 조회가 실패해도 DB 합계를 보존한다', async () => {
    arrangeDbFiles([['noline.db', 2048]]);
    getPacksMock.mockRejectedValue(new Error('지도 팩 목록을 불러올 수 없음'));

    const { result } = renderHook(() => useStorageStats());

    await waitFor(() => {
      expect(result.current.stats).toEqual({
        dbSize: '2 KB',
        mapPackSize: '0 B',
        totalSize: '2 KB',
      });
    });
  });

  it('개별 지도 팩 상태 조회가 실패해도 다음 팩을 계속 합산한다', async () => {
    arrangeDbFiles([]);
    const failedPack = createPack('failed', new Error('지도 팩 상태를 불러올 수 없음'));
    const availablePack = createPack('available', 512);
    getPacksMock.mockResolvedValue([failedPack, availablePack]);

    const { result } = renderHook(() => useStorageStats());

    await waitFor(() => {
      expect(result.current.stats).toEqual({
        dbSize: '0 B',
        mapPackSize: '512 B',
        totalSize: '512 B',
      });
    });
    expect(failedPack.status).toHaveBeenCalledTimes(1);
    expect(availablePack.status).toHaveBeenCalledTimes(1);
  });

  it('새로고침하면 DB와 지도 팩 용량을 다시 계산한다', async () => {
    let dbSize = 1024;
    let mapSize = 2048;

    readDirectoryAsyncMock.mockResolvedValue(['noline.db']);
    getInfoAsyncMock.mockImplementation(async (uri: string) =>
      existingInfo(uri, uri === dbDirectory ? 0 : dbSize, uri === dbDirectory),
    );
    getPacksMock.mockImplementation(async () => [createPack('seoul', mapSize)]);

    const { result } = renderHook(() => useStorageStats());

    await waitFor(() => expect(result.current.stats.totalSize).toBe('3 KB'));

    dbSize = 2048;
    mapSize = 3072;

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.stats).toEqual({
      dbSize: '2 KB',
      mapPackSize: '3 KB',
      totalSize: '5 KB',
    });
    expect(getPacksMock).toHaveBeenCalledTimes(2);
  });

  it('겹친 새로고침에서는 가장 최근 요청의 결과를 유지한다', async () => {
    arrangeDbFiles([]);
    getPacksMock.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useStorageStats());

    await waitFor(() => expect(getPacksMock).toHaveBeenCalledTimes(1));

    const olderPacks = createDeferred<TestPack[]>();
    getPacksMock.mockReturnValueOnce(olderPacks.promise).mockResolvedValueOnce([createPack('latest', 2048)]);

    let olderRefresh!: Promise<void>;
    act(() => {
      olderRefresh = result.current.refresh();
    });
    await waitFor(() => expect(getPacksMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.stats.mapPackSize).toBe('2 KB');

    olderPacks.resolve([createPack('older', 1024)]);
    await act(async () => {
      await olderRefresh;
    });

    expect(result.current.stats.mapPackSize).toBe('2 KB');
  });
});
