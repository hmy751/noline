import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// 파일 열기와 SQL 실행만 대체한다. 실제 기기 DB의 데이터 보존 검사는 아니다.
jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }));
jest.mock('drizzle-orm/expo-sqlite', () => ({ drizzle: jest.fn() }));

let database: typeof import('@/shared/db');
let openDatabase: ReturnType<typeof jest.fn>;
let execSync: ReturnType<typeof jest.fn>;
let createClient: ReturnType<typeof jest.fn>;
const client = { select: jest.fn() };

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.isolateModules(() => {
    const sqlite = jest.requireMock<{ openDatabaseSync: ReturnType<typeof jest.fn> }>('expo-sqlite');
    const orm = jest.requireMock<{ drizzle: ReturnType<typeof jest.fn> }>('drizzle-orm/expo-sqlite');
    execSync = jest.fn();
    openDatabase = sqlite.openDatabaseSync.mockReset().mockReturnValue({ execSync });
    createClient = orm.drizzle.mockReset().mockReturnValue(client);
    database = jest.requireActual<typeof import('@/shared/db')>('@/shared/db');
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function expectNoDataDeletion() {
  for (const [sql] of execSync.mock.calls) {
    expect(sql).not.toMatch(/(?:^|;)\s*(?:DROP|DELETE|TRUNCATE)\b/i);
  }
}

describe('재시도 가능한 앱 DB 준비', () => {
  it('준비 전 접근은 DB를 열지 않고 명확한 오류로 거절한다', () => {
    expect(() => database.getDatabase()).toThrow('로컬 DB 준비가 완료되지 않았습니다.');
    expect(openDatabase).not.toHaveBeenCalled();
  });

  it('SQL 준비 중과 실패 뒤에는 클라이언트를 공개하지 않고 재시도 성공 뒤에만 제공한다', async () => {
    execSync.mockImplementationOnce(() => {
      expect(() => database.getDatabase()).toThrow('로컬 DB 준비가 완료되지 않았습니다.');
      throw new Error('SQL 실패');
    });
    await expect(database.initializeDatabase()).rejects.toThrow('SQL 실패');
    expect(() => database.getDatabase()).toThrow('로컬 DB 준비가 완료되지 않았습니다.');

    await database.initializeDatabase();
    expect(database.getDatabase()).toBe(client);
  });

  it('reset 도중 실패하면 이전 준비 완료 상태를 버리고 재준비 성공 뒤에만 접근을 허용한다', async () => {
    await database.initializeDatabase();
    execSync.mockImplementationOnce(() => {
      expect(() => database.getDatabase()).toThrow('로컬 DB 준비가 완료되지 않았습니다.');
      throw new Error('reset 실패');
    });

    await expect(database.resetDatabase()).rejects.toThrow('reset 실패');
    expect(() => database.getDatabase()).toThrow('로컬 DB 준비가 완료되지 않았습니다.');
    await database.initializeDatabase();
    expect(database.getDatabase()).toBe(client);
  });

  it('모듈을 불러올 때는 DB를 열지 않고 초기화 요청 안에서 연다', async () => {
    expect(openDatabase).not.toHaveBeenCalled();
    await database.initializeDatabase();

    expect(openDatabase).toHaveBeenCalledTimes(1);
    expect(openDatabase).toHaveBeenCalledWith('noline.db');
    expect(database.getDatabase()).toBe(client);
    expectNoDataDeletion();
  });

  it('DB 열기에 실패하면 호출자에게 전달하고 다음 초기화에서 다시 열 수 있다', async () => {
    openDatabase.mockImplementationOnce(() => {
      throw new Error('파일 열기 실패');
    });
    await expect(database.initializeDatabase()).rejects.toThrow('파일 열기 실패');
    expect(execSync).not.toHaveBeenCalled();

    await expect(database.initializeDatabase()).resolves.toBeUndefined();
    expect(openDatabase).toHaveBeenCalledTimes(2);
    expect(database.getDatabase()).toBe(client);
    expectNoDataDeletion();
  });

  it('테이블 준비 도중 실패해도 데이터를 삭제하지 않고 다시 준비할 수 있다', async () => {
    execSync
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error('테이블 준비 실패');
      });
    await expect(database.initializeDatabase()).rejects.toThrow('테이블 준비 실패');
    await expect(database.initializeDatabase()).resolves.toBeUndefined();

    expect(database.getDatabase()).toBe(client);
    expectNoDataDeletion();
    expect(execSync.mock.calls.some(([sql]) => String(sql).includes('CREATE TABLE IF NOT EXISTS sync_queue'))).toBe(
      true,
    );
  });

  it('준비 성공 뒤 반복 초기화는 연결과 ORM 객체를 재생성하지 않는다', async () => {
    await database.initializeDatabase();
    const initializedClient = database.getDatabase();
    await database.initializeDatabase();

    expect(openDatabase).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(database.getDatabase()).toBe(initializedClient);
    expectNoDataDeletion();
  });

  it('기존 개발·로그아웃용 reset은 같은 연결에서 테이블을 다시 만들 수 있다', async () => {
    await database.initializeDatabase();
    execSync.mockClear();
    await database.resetDatabase();

    const statements = execSync.mock.calls.map(([sql]) => String(sql));
    expect(statements.some((sql) => sql.includes('DROP TABLE IF EXISTS trips'))).toBe(true);
    expect(statements.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS trips'))).toBe(true);
    expect(openDatabase).toHaveBeenCalledTimes(1);
    expect(database.getDatabase()).toBe(client);
  });
});
