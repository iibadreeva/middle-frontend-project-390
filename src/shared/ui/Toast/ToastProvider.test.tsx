import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  TOAST_DURATION_MS,
  TOAST_MAX_VISIBLE,
  ToastProvider,
  useToast,
} from './ToastProvider';

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an error toast and allows dismiss', async () => {
    const user = userEvent.setup();

    function Probe() {
      const toast = useToast();
      return (
        <button
          type="button"
          onClick={() => toast.error('Сеть недоступна')}
        >
          show
        </button>
      );
    }

    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'show' }));

    const item = screen.getByTestId('toast-item');
    expect(item).toHaveTextContent('Сеть недоступна');
    expect(item).toHaveAttribute('role', 'alert');
    expect(screen.getByTestId('toast-viewport')).not.toHaveAttribute(
      'aria-live',
    );

    await user.click(screen.getByTestId('toast-dismiss'));
    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });

  it('keeps only the newest TOAST_MAX_VISIBLE toasts', () => {
    vi.useFakeTimers();

    function Probe() {
      const toast = useToast();
      return (
        <button
          type="button"
          onClick={() => {
            for (let i = 1; i <= TOAST_MAX_VISIBLE + 2; i += 1) {
              toast.error(`msg-${i}`);
            }
          }}
        >
          flood
        </button>
      );
    }

    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'flood' }).click();
    });

    const items = screen.getAllByTestId('toast-item');
    expect(items).toHaveLength(TOAST_MAX_VISIBLE);
    expect(items.map((node) => node.querySelector('p')?.textContent)).toEqual(
      Array.from(
        { length: TOAST_MAX_VISIBLE },
        (_, index) => `msg-${index + 3}`,
      ),
    );
  });

  it('replaces a previous toast with the same tag', () => {
    vi.useFakeTimers();

    function Probe() {
      const toast = useToast();
      return (
        <>
          <button
            type="button"
            onClick={() => toast.error('first', { tag: 'booking' })}
          >
            first
          </button>
          <button
            type="button"
            onClick={() => toast.error('second', { tag: 'booking' })}
          >
            second
          </button>
          <button
            type="button"
            onClick={() => toast.error('other', { tag: 'search' })}
          >
            other
          </button>
        </>
      );
    }

    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'first' }).click();
      screen.getByRole('button', { name: 'other' }).click();
      screen.getByRole('button', { name: 'second' }).click();
    });

    const items = screen.getAllByTestId('toast-item');
    expect(items).toHaveLength(2);
    expect(items.map((node) => node.querySelector('p')?.textContent)).toEqual(
      expect.arrayContaining(['other', 'second']),
    );
    expect(
      items.some((node) => node.querySelector('p')?.textContent === 'first'),
    ).toBe(false);
  });

  it('dismisses only toasts with the given tag', () => {
    vi.useFakeTimers();

    function Probe() {
      const toast = useToast();
      return (
        <>
          <button
            type="button"
            onClick={() => toast.error('booking', { tag: 'booking' })}
          >
            booking
          </button>
          <button
            type="button"
            onClick={() => toast.error('search', { tag: 'search' })}
          >
            search
          </button>
          <button type="button" onClick={() => toast.dismiss('booking')}>
            dismiss-booking
          </button>
        </>
      );
    }

    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'booking' }).click();
      screen.getByRole('button', { name: 'search' }).click();
    });
    expect(screen.getAllByTestId('toast-item')).toHaveLength(2);

    act(() => {
      screen.getByRole('button', { name: 'dismiss-booking' }).click();
    });

    expect(screen.getAllByTestId('toast-item')).toHaveLength(1);
    expect(screen.getByTestId('toast-item')).toHaveTextContent('search');
  });

  it('auto-dismisses after the timeout', () => {
    vi.useFakeTimers();

    function Probe() {
      const toast = useToast();
      return (
        <button type="button" onClick={() => toast.error('timeout')}>
          show
        </button>
      );
    }

    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'show' }).click();
    });

    expect(screen.getByTestId('toast-item')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS);
    });

    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });

  it('pauses auto-dismiss while hovered and resumes after leave', () => {
    vi.useFakeTimers();

    function Probe() {
      const toast = useToast();
      return (
        <button type="button" onClick={() => toast.error('hover')}>
          show
        </button>
      );
    }

    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'show' }).click();
    });

    const item = screen.getByTestId('toast-item');
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS - 1000);
    });

    fireEvent.mouseEnter(item);
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS);
    });
    expect(screen.getByTestId('toast-item')).toBeInTheDocument();

    fireEvent.mouseLeave(item);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });

  it('does not dismiss again after manual close when the timer fires', () => {
    vi.useFakeTimers();

    function Probe() {
      const toast = useToast();
      return (
        <button type="button" onClick={() => toast.error('manual')}>
          show
        </button>
      );
    }

    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'show' }).click();
    });
    act(() => {
      screen.getByTestId('toast-dismiss').click();
    });
    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS);
    });

    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });

  it('clears pending timers on unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    function Probe() {
      const toast = useToast();
      return (
        <button type="button" onClick={() => toast.error('unmount')}>
          show
        </button>
      );
    }

    const { unmount } = render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'show' }).click();
    });

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('dismisses all toasts', () => {
    vi.useFakeTimers();

    function Probe() {
      const toast = useToast();
      return (
        <>
          <button type="button" onClick={() => toast.error('one')}>
            show-one
          </button>
          <button type="button" onClick={() => toast.error('two')}>
            show-two
          </button>
          <button type="button" onClick={() => toast.dismissAll()}>
            dismiss-all
          </button>
        </>
      );
    }

    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'show-one' }).click();
      screen.getByRole('button', { name: 'show-two' }).click();
    });
    expect(screen.getAllByTestId('toast-item')).toHaveLength(2);

    act(() => {
      screen.getByRole('button', { name: 'dismiss-all' }).click();
    });

    expect(screen.queryByTestId('toast-item')).not.toBeInTheDocument();
  });

  it('throws when useToast is used outside the provider', () => {
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/);
  });
});
