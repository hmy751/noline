/**
 * 쉼표로 구분한 환경 변수 값을 목록으로 바꾼다. 앞뒤 공백과 빈 항목은 버린다.
 * 예: "a, b,," → ["a", "b"], undefined → []
 */
export function parseCommaList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
