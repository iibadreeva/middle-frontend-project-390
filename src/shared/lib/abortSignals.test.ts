import { describe, expect, it, vi } from 'vitest';
import { createTimeoutSignal, mergeAbortSignals } from './abortSignals';

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

  it('removes listeners from earlier sources when a later source is already aborted', () => {
    const first = new AbortController();
    const second = new AbortController();
    second.abort('already');

    const addSpy = vi.spyOn(first.signal, 'addEventListener');
    const removeSpy = vi.spyOn(first.signal, 'removeEventListener');
    const merged = mergeAbortSignals(first.signal, second.signal);

    expect(merged?.signal.aborted).toBe(true);
    expect(merged?.signal.reason).toBe('already');

    const abortAdds = addSpy.mock.calls.filter((call) => call[0] === 'abort');
    const abortRemoves = removeSpy.mock.calls.filter(
      (call) => call[0] === 'abort',
    );
    expect(abortRemoves.length).toBeGreaterThanOrEqual(abortAdds.length);

    addSpy.mockRestore();
    removeSpy.mockRestore();
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

describe('createTimeoutSignal', () => {
  it('does not use AbortSignal.timeout so dispose can clear the timer', () => {
    vi.useFakeTimers();
    const native = vi.spyOn(AbortSignal, 'timeout');

    try {
      const created = createTimeoutSignal(1000);
      expect(native).not.toHaveBeenCalled();

      created.dispose();
      vi.advanceTimersByTime(1000);
      expect(created.signal.aborted).toBe(false);
    } finally {
      native.mockRestore();
      vi.useRealTimers();
    }
  });

  it('aborts with TimeoutError after the delay', () => {
    vi.useFakeTimers();

    try {
      const created = createTimeoutSignal(1000);
      expect(created.signal.aborted).toBe(false);

      vi.advanceTimersByTime(1000);

      expect(created.signal.aborted).toBe(true);
      expect((created.signal.reason as { name?: string } | undefined)?.name).toBe(
        'TimeoutError',
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
