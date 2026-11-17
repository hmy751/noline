import { describe, expect, it } from 'vitest';

import { parseCommaList } from '../../src/config/env-list.js';

describe('parseCommaList', () => {
  it('값이 없으면 빈 목록이다', () => {
    expect(parseCommaList(undefined)).toEqual([]);
    expect(parseCommaList('')).toEqual([]);
  });

  it('쉼표가 없는 기존 단일 값은 그대로 한 항목이다', () => {
    expect(parseCommaList('ios-prod.apps.googleusercontent.com')).toEqual(['ios-prod.apps.googleusercontent.com']);
  });

  it('쉼표로 나누고 공백과 빈 항목을 버린다', () => {
    expect(parseCommaList(' ios-prod , ios-dev ,,')).toEqual(['ios-prod', 'ios-dev']);
  });
});
