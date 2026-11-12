type MutationTable = 'trips' | 'schedules' | 'expenses';

const VARCHAR_LIMITS: Record<MutationTable, Record<string, number>> = {
  expenses: { title: 200, currency: 3 },
  trips: { name: 200, destination: 200, country: 100, baseCurrency: 10 },
  schedules: {},
};
const DATE_FIELDS = ['date', 'scheduledAt', 'startDate', 'endDate'] as const;
const DECIMAL_PATTERN = /^[\t\n\r ]*[+-]?(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?[\t\n\r ]*$/;
const MAX_LOCAL_DIGITS = 1000;
const MAX_LOCAL_EXPONENT = 1000;

/** PostgreSQL text에는 NUL과 단독 UTF-16 surrogate를 저장할 수 없다. */
const isPostgresText = (value: string): boolean => {
  for (const character of value) {
    const code = character.codePointAt(0);

    if (code === 0 || (code !== undefined && code >= 0xd800 && code <= 0xdfff)) {
      return false;
    }
  }

  return true;
};

const hasPostgresStrings = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return isPostgresText(value);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).every(hasPostgresStrings);
  }

  return true;
};

/** 요청 스키마를 통과한 문자열에 PostgreSQL 컬럼 길이 제한을 적용한다. */
export const hasStorableMutationText = (table: MutationTable, input: Record<string, unknown>): boolean => {
  if (!hasPostgresStrings(input)) {
    return false;
  }

  return Object.entries(VARCHAR_LIMITS[table]).every(([key, limit]) => {
    const value = input[key];

    // VARCHAR는 길이를 넘긴 부분이 U+0020 공백만으로 이뤄졌을 때 이를 잘라 저장한다.
    return (
      typeof value !== 'string' ||
      Array.from(value)
        .slice(limit)
        .every((character) => character === ' ')
    );
  });
};

export const hasStorableMutationDates = (input: Record<string, unknown>): boolean => {
  // JavaScript가 파싱하는 0년은 PostgreSQL의 서기 날짜에 들어가지 않는다.
  return DATE_FIELDS.every((key) => typeof input[key] !== 'string' || new Date(input[key]).getUTCFullYear() >= 1);
};

/** numeric(precision, scale)의 반올림 후 자릿수를 문자열로 확인한다.
 * 기기에서 단정할 수 없는 NaN·큰 지수 표기는 해당 요청의 서버 판정까지 큐에 보존한다.
 */
const fitsNumeric = (value: unknown, precision: number, scale: number): boolean => {
  if (value == null) {
    return true;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false;
  }

  const match = DECIMAL_PATTERN.exec(String(value));

  if (!match) {
    return false;
  }

  const [, integerPart = '', fractionAfterInteger, fractionOnly, exponentPart = '0'] = match;
  const exponent = Number(exponentPart);

  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > MAX_LOCAL_EXPONENT) {
    return false;
  }

  const digits = integerPart + (fractionAfterInteger ?? fractionOnly ?? '');

  if (digits.length > MAX_LOCAL_DIGITS) {
    return false;
  }

  const significantDigits = digits.replace(/^0+/, '');

  if (!significantDigits) {
    return true;
  }

  const leadingZeroCount = digits.length - significantDigits.length;
  const retainedDigitCount = integerPart.length + exponent + scale - leadingZeroCount;

  if (retainedDigitCount > precision) {
    return false;
  }
  if (retainedDigitCount < precision) {
    return true;
  }

  // 최대 자릿수가 전부 9라면 다음 자릿수의 반올림이 정밀도를 초과할 수 있다.
  const retainedDigits = significantDigits.slice(0, retainedDigitCount);
  const roundingDigit = significantDigits[retainedDigitCount] ?? '0';

  return !(/^9+$/.test(retainedDigits) && roundingDigit >= '5');
};

/** 일괄 삭제로 정리해도 되는 입력이면 true다. false면 원문을 보존하고 서버에 개별 전송한다. */
export const canConfirmMutationStorageLocally = (table: MutationTable, input: Record<string, unknown>): boolean => {
  if (!hasStorableMutationText(table, input) || !hasStorableMutationDates(input)) {
    return false;
  }
  if (table === 'expenses' && input.amount !== undefined && !fitsNumeric(input.amount, 10, 2)) {
    return false;
  }
  if (table !== 'expenses' && (!fitsNumeric(input.latitude, 10, 7) || !fitsNumeric(input.longitude, 10, 7))) {
    return false;
  }
  if (
    table === 'trips' &&
    input.cityId != null &&
    (typeof input.cityId !== 'number' ||
      !Number.isInteger(input.cityId) ||
      input.cityId < -2147483648 ||
      input.cityId > 2147483647)
  ) {
    return false;
  }

  return true;
};
