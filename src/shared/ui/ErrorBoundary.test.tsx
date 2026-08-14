import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

type BoomProps = {
  fail: boolean;
};

function Boom({ fail }: BoomProps) {
  if (fail) {
    throw new Error('boom');
  }
  return <p data-testid="boom-ok">ok</p>;
}

function RetryHarness() {
  const [fail, setFail] = useState(true);

  return (
    <>
      <button
        type="button"
        data-testid="fix-boom"
        onClick={() => setFail(false)}
      >
        fix
      </button>
      <ErrorBoundary>
        <Boom fail={fail} />
      </ErrorBoundary>
    </>
  );
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Boom fail={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('boom-ok')).toHaveTextContent('ok');
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });

  it('shows fallback when a child throws during render', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom fail />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary-retry')).toBeInTheDocument();
    expect(screen.queryByTestId('boom-ok')).not.toBeInTheDocument();
  });

  it('restores children after retry when the fault is cleared', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<RetryHarness />);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();

    await user.click(screen.getByTestId('fix-boom'));
    await user.click(screen.getByTestId('error-boundary-retry'));

    expect(screen.getByTestId('boom-ok')).toHaveTextContent('ok');
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });

  it('renders a custom fallback when provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<p data-testid="custom-fallback">custom</p>}>
        <Boom fail />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('custom');
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });

  it('calls onError instead of console.error when provided', () => {
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary onError={onError}>
        <Boom fail />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toEqual(expect.any(Error));
    expect(consoleError).not.toHaveBeenCalledWith(
      'ErrorBoundary caught a render error',
      expect.anything(),
      expect.anything(),
    );
  });
});
