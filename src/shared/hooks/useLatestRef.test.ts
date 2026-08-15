import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLatestRef } from './useLatestRef';

describe('useLatestRef', () => {
  it('keeps a stable ref identity while .current tracks the latest value', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useLatestRef(value),
      { initialProps: { value: 'a' } },
    );

    const first = result.current;
    expect(first.current).toBe('a');

    rerender({ value: 'b' });

    expect(result.current).toBe(first);
    expect(result.current.current).toBe('b');
  });
});
