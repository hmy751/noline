/**
 * 국가-통화 매핑 유틸리티
 *
 * ISO 3166-1 alpha-2 국가 코드를 기반으로 해당 국가의 기본 통화를 반환합니다.
 * Geonames API의 countryCode (KR, JP, US 등)를 사용하여 통화를 추론합니다.
 */

/**
 * ISO 국가 코드 → 통화 코드 매핑
 * 주요 여행지 중심으로 구성
 */
const COUNTRY_CODE_TO_CURRENCY: Record<string, string> = {
  // 유럽
  FR: 'EUR', // France
  DE: 'EUR', // Germany
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain
  PT: 'EUR', // Portugal
  GR: 'EUR', // Greece
  NL: 'EUR', // Netherlands
  BE: 'EUR', // Belgium
  AT: 'EUR', // Austria
  IE: 'EUR', // Ireland
  FI: 'EUR', // Finland
  CH: 'CHF', // Switzerland
  GB: 'GBP', // United Kingdom
  NO: 'NOK', // Norway
  SE: 'SEK', // Sweden
  DK: 'DKK', // Denmark
  PL: 'PLN', // Poland
  CZ: 'CZK', // Czech Republic
  HU: 'HUF', // Hungary
  IS: 'ISK', // Iceland
  RO: 'RON', // Romania
  BG: 'BGN', // Bulgaria
  HR: 'EUR', // Croatia (uses EUR since 2023)

  // 아시아
  JP: 'JPY', // Japan
  KR: 'KRW', // South Korea
  CN: 'CNY', // China
  TW: 'TWD', // Taiwan
  HK: 'HKD', // Hong Kong
  SG: 'SGD', // Singapore
  TH: 'THB', // Thailand
  VN: 'VND', // Vietnam
  MY: 'MYR', // Malaysia
  ID: 'IDR', // Indonesia
  PH: 'PHP', // Philippines
  IN: 'INR', // India
  AE: 'AED', // United Arab Emirates
  TR: 'TRY', // Turkey
  SA: 'SAR', // Saudi Arabia
  IL: 'ILS', // Israel
  KW: 'KWD', // Kuwait
  QA: 'QAR', // Qatar

  // 북미
  US: 'USD', // United States
  CA: 'CAD', // Canada
  MX: 'MXN', // Mexico

  // 오세아니아
  AU: 'AUD', // Australia
  NZ: 'NZD', // New Zealand

  // 남미
  BR: 'BRL', // Brazil
  AR: 'ARS', // Argentina
  CL: 'CLP', // Chile
  PE: 'PEN', // Peru
  CO: 'COP', // Colombia
  UY: 'UYU', // Uruguay

  // 아프리카
  ZA: 'ZAR', // South Africa
  EG: 'EGP', // Egypt
  MA: 'MAD', // Morocco
  KE: 'KES', // Kenya
  NG: 'NGN', // Nigeria
};

/**
 * ISO 국가 코드로 통화 코드 가져오기
 *
 * @param countryCode - ISO 3166-1 alpha-2 국가 코드 (KR, JP, US 등)
 * @returns 통화 코드 (기본값: USD)
 *
 * @example
 * ```ts
 * getCurrencyByCountryCode('JP') // 'JPY'
 * getCurrencyByCountryCode('KR') // 'KRW'
 * getCurrencyByCountryCode('US') // 'USD'
 * getCurrencyByCountryCode('XX') // 'USD' (기본값)
 * ```
 */
export function getCurrencyByCountryCode(countryCode: string | null | undefined): string {
  if (!countryCode) {
    return 'USD'; // 기본값
  }

  // 대문자로 정규화
  const normalizedCode = countryCode.toUpperCase();

  return COUNTRY_CODE_TO_CURRENCY[normalizedCode] || 'USD';
}

/**
 * 지원하는 국가 코드인지 확인
 *
 * @param countryCode - ISO 국가 코드
 * @returns 지원 여부
 */
export function isSupportedCountryCode(countryCode: string): boolean {
  return countryCode.toUpperCase() in COUNTRY_CODE_TO_CURRENCY;
}

/**
 * 지원하는 모든 통화 코드 가져오기
 *
 * @returns 유니크한 통화 코드 배열 (알파벳순)
 */
export function getSupportedCurrencies(): string[] {
  const currencies = new Set(Object.values(COUNTRY_CODE_TO_CURRENCY));
  return Array.from(currencies).sort();
}

/**
 * 지원하는 모든 국가 코드 가져오기
 *
 * @returns 국가 코드 배열 (알파벳순)
 */
export function getSupportedCountryCodes(): string[] {
  return Object.keys(COUNTRY_CODE_TO_CURRENCY).sort();
}
