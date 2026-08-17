import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from './toast';

describe('toast bus', () => {
  afterEach(() => {
    toast.dismissAll();
  });

  it('notifies subscribers on error', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    toast.error('Сеть недоступна', { tag: 'search' });

    expect(listener).toHaveBeenCalledWith({
      type: 'error',
      message: 'Сеть недоступна',
      tag: 'search',
    });
    unsubscribe();
  });

  it('notifies subscribers on dismiss by tag', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    toast.dismiss('search');

    expect(listener).toHaveBeenCalledWith({ type: 'dismiss', tag: 'search' });
    unsubscribe();
  });

  it('notifies subscribers on dismissAll', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    toast.dismissAll();

    expect(listener).toHaveBeenCalledWith({ type: 'dismissAll' });
    unsubscribe();
  });

  it('does not notify after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);
    unsubscribe();

    toast.error('offline');

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not throw when there are no subscribers', () => {
    expect(() => toast.error('offline')).not.toThrow();
    expect(() => toast.dismiss('search')).not.toThrow();
    expect(() => toast.dismissAll()).not.toThrow();
  });

  it('delivers queued errors to a late subscriber', () => {
    toast.error('offline', { tag: 'search' });
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    expect(listener).toHaveBeenCalledWith({
      type: 'error',
      message: 'offline',
      tag: 'search',
    });
    unsubscribe();
  });

  it('drops queued errors on dismissAll when there are no subscribers', () => {
    toast.error('offline');
    toast.dismissAll();
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});
