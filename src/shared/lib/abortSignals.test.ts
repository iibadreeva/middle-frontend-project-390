import { describe, expect, it } from 'vitest';
import { mergeAbortSignals } from './abortSignals';

describe('mergeAbortSignals', () => {
  it('returns undefined when no signals are provided', () => {
    expect(mergeAbortSignals()).toBeUndefined();
    expect(mergeAbortSignals(undefined, undefined)).toBeUndefined();
  });

  it('returns the single signal as-is', () => {
    const controller = new AbortController();
    const merged = mergeAbortSignals(controller.signal);
    expect(merged?.signal).toBe(controller.signal);
  });

  it('aborts the merged signal when any source aborts', () => {
    const first = new AbortController();
    const second = new AbortController();
    const merged = mergeAbortSignals(first.signal, second.signal);

    expect(merged?.signal.aborted).toBe(false);
    first.abort('stop');
    expect(merged?.signal.aborted).toBe(true);
    expect(merged?.signal.reason).toBe('stop');
  });

  it('propagates an already-aborted source immediately', () => {
    const first = new AbortController();
    first.abort('already');
    const second = new AbortController();
    const merged = mergeAbortSignals(first.signal, second.signal);

    expect(merged?.signal.aborted).toBe(true);
    expect(merged?.signal.reason).toBe('already');
  });

  it('does not use AbortSignal.any', () => {
    const original = AbortSignal.any;
    let called = false;
    AbortSignal.any = ((...args: Parameters<typeof AbortSignal.any>) => {
      called = true;
      return original.apply(AbortSignal, args);
    }) as typeof AbortSignal.any;

    try {
      const first = new AbortController();
      const second = new AbortController();
      mergeAbortSignals(first.signal, second.signal);
      expect(called).toBe(false);
    } finally {
      AbortSignal.any = original;
    }
  });

  it('dispose removes abort listeners from source signals', () => {
    const first = new AbortController();
    const second = new AbortController();
    const merged = mergeAbortSignals(first.signal, second.signal);

    expect(merged).toBeDefined();
    merged?.dispose();

    first.abort('late');
    expect(merged?.signal.aborted).toBe(false);
  });
});
