import { describe, expect, it } from '@jest/globals';
import { useState } from 'react';
import { act, renderHook } from '@testing-library/react-native';

describe('클라이언트 Jest 실행 환경', () => {
  it('React hook을 렌더링하고 상태를 갱신한다', () => {
    const { result } = renderHook(() => useState(0));

    act(() => {
      result.current[1](1);
    });

    expect(result.current[0]).toBe(1);
  });
});
