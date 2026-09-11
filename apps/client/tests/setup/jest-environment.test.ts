import { useState } from 'react';
import { act, renderHook } from '@testing-library/react-native';

describe('client Jest environment', () => {
  it('renders and updates a React hook', () => {
    const { result } = renderHook(() => useState(0));

    act(() => {
      result.current[1](1);
    });

    expect(result.current[0]).toBe(1);
  });
});
