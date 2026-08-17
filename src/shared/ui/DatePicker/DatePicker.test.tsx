import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePicker } from './DatePicker';
import styles from './DatePicker.module.css';

function isInertTree(element: HTMLElement): boolean {
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    if (node.inert) {
      return true;
    }
  }
  return false;
}

function stubInertFocus() {
  const original = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (
    this: HTMLElement,
    options?: FocusOptions,
  ) {
    if (isInertTree(this)) {
      return;
    }
    original.call(this, options);
  };
  return () => {
    HTMLElement.prototype.focus = original;
  };
}

function stubPointerMedia(initialCoarse: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = {
    matches: initialCoarse,
    media: '(pointer: coarse)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(
      (type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === 'change' && typeof listener === 'function') {
          listeners.add(listener as (event: MediaQueryListEvent) => void);
        }
      },
    ),
    removeEventListener: vi.fn(
      (type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === 'change' && typeof listener === 'function') {
          listeners.delete(listener as (event: MediaQueryListEvent) => void);
        }
      },
    ),
    dispatchEvent: vi.fn(),
  };

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) =>
      query === '(pointer: coarse)'
        ? media
        : {
            ...media,
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          },
    ),
  );

  return {
    setCoarse(coarse: boolean) {
      media.matches = coarse;
      for (const listener of listeners) {
        listener({ matches: coarse } as MediaQueryListEvent);
      }
    },
  };
}

describe('DatePicker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.getElementById('root')?.remove();
  });

  it('forwards date input attributes used by forms and tests', () => {
    render(
      <DatePicker
        defaultValue="2026-08-15"
        min="2026-08-10"
        max="2026-12-31"
        className="field-input"
        data-testid="date"
        aria-invalid
      />,
    );

    const input = screen.getByTestId('date');
    expect(input).toHaveAttribute('type', 'date');
    expect(input).toHaveValue('2026-08-15');
    expect(input).toHaveAttribute('min', '2026-08-10');
    expect(input).toHaveAttribute('max', '2026-12-31');
    expect(input).toHaveClass('field-input');
    expect(input).toHaveClass(styles.input);
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('opens a day grid for the current value and picks a day', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DatePicker
        defaultValue="2026-08-15"
        onChange={onChange}
        data-testid="date"
      />,
    );

    await user.click(screen.getByTestId('date'));

    const calendar = screen.getByRole('dialog', { name: 'Календарь' });
    expect(within(calendar).getByRole('button', { name: 'Выбрать месяц' })).toHaveTextContent(
      'август',
    );
    expect(within(calendar).getByRole('button', { name: 'Выбрать год' })).toHaveTextContent(
      '2026',
    );

    await user.click(
      within(calendar).getByRole('button', { name: '20 августа 2026' }),
    );

    expect(screen.getByTestId('date')).toHaveValue('2026-08-20');
    expect(onChange).toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Календарь' })).not.toBeInTheDocument();
  });

  it('lets the user jump to a year and month before picking a day', async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue="2026-08-15" data-testid="date" />);

    await user.click(screen.getByTestId('date'));
    const calendar = screen.getByRole('dialog', { name: 'Календарь' });

    await user.click(within(calendar).getByRole('button', { name: 'Выбрать год' }));
    await user.click(within(calendar).getByRole('button', { name: 'Предыдущие годы' }));
    await user.click(within(calendar).getByRole('button', { name: '1990' }));
    await user.click(within(calendar).getByRole('button', { name: 'Выбрать месяц' }));
    await user.click(within(calendar).getByRole('button', { name: 'май' }));
    await user.click(
      within(calendar).getByRole('button', { name: '20 мая 1990' }),
    );

    expect(screen.getByTestId('date')).toHaveValue('1990-05-20');
  });

  it('clamps 29 February when jumping to a non-leap year', async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue="2024-02-29" data-testid="date" />);

    await user.click(screen.getByTestId('date'));
    await user.click(screen.getByRole('button', { name: 'Выбрать год' }));
    await user.click(screen.getByRole('button', { name: '2023' }));

    expect(
      screen.getByRole('button', { name: '28 февраля 2023' }),
    ).toHaveFocus();
  });

  it('does not select a day before min', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        defaultValue="2026-08-17"
        min="2026-08-17"
        data-testid="date"
      />,
    );

    await user.click(screen.getByTestId('date'));
    await user.click(screen.getByRole('button', { name: '16 августа 2026' }));

    expect(screen.getByTestId('date')).toHaveValue('2026-08-17');
    expect(screen.getByRole('dialog', { name: 'Календарь' })).toBeInTheDocument();
  });

  it('closes on Escape and does not open when disabled', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DatePicker defaultValue="2026-08-15" data-testid="date" />,
    );

    await user.click(screen.getByTestId('date'));
    expect(screen.getByRole('dialog', { name: 'Календарь' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Календарь' })).not.toBeInTheDocument();

    rerender(
      <DatePicker defaultValue="2026-08-15" data-testid="date" disabled />,
    );
    await user.click(screen.getByTestId('date'));
    expect(screen.queryByRole('dialog', { name: 'Календарь' })).not.toBeInTheDocument();
  });

  it('marks the dialog as modal and the selected day as selected', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        defaultValue="2026-08-15"
        today="2026-08-20"
        data-testid="date"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Открыть календарь' }));
    const calendar = screen.getByRole('dialog', { name: 'Календарь' });

    expect(calendar).toHaveAttribute('aria-modal', 'true');
    expect(
      within(calendar)
        .getByRole('button', { name: '15 августа 2026' })
        .closest('[role="gridcell"]'),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      within(calendar)
        .getByRole('button', { name: '20 августа 2026' })
        .closest('[role="gridcell"]'),
    ).toHaveAttribute('aria-current', 'date');
    expect(screen.getByTestId('date')).not.toHaveAttribute('today');
  });

  it('moves focus into the grid from the calendar button and selects a day with the keyboard', async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue="2026-08-15" data-testid="date" />);

    await user.click(screen.getByRole('button', { name: 'Открыть календарь' }));
    expect(
      screen.getByRole('button', { name: '15 августа 2026' }),
    ).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(
      screen.getByRole('button', { name: '16 августа 2026' }),
    ).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByTestId('date')).toHaveValue('2026-08-16');
    expect(screen.getByTestId('date')).toHaveFocus();
    expect(screen.queryByRole('dialog', { name: 'Календарь' })).not.toBeInTheDocument();
  });

  it('keeps Tab inside the dialog and restores focus on Escape', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DatePicker defaultValue="2026-08-15" data-testid="date" />
        <button type="button">Снаружи</button>
      </div>,
    );

    await user.click(screen.getByTestId('date'));
    const calendar = screen.getByRole('dialog', { name: 'Календарь' });
    await user.tab();

    for (let i = 0; i < 12; i += 1) {
      expect(calendar.contains(document.activeElement)).toBe(true);
      await user.tab();
    }

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Календарь' })).not.toBeInTheDocument();
    expect(screen.getByTestId('date')).toHaveFocus();
  });

  it('closes when clicking outside without moving focus back to the input', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DatePicker defaultValue="2026-08-15" data-testid="date" />
        <button type="button">Снаружи</button>
      </div>,
    );

    await user.click(screen.getByTestId('date'));
    await user.click(screen.getByRole('button', { name: 'Снаружи' }));

    expect(screen.queryByRole('dialog', { name: 'Календарь' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Снаружи' })).toHaveFocus();
  });

  it('opens the calendar when the associated label is clicked', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <label htmlFor="dob">Дата рождения</label>
        <DatePicker id="dob" defaultValue="2026-08-15" data-testid="date" />
      </div>,
    );

    await user.click(screen.getByText('Дата рождения'));

    expect(screen.getByRole('dialog', { name: 'Календарь' })).toBeInTheDocument();
  });

  it('lets the user type a date into the input without moving focus into the calendar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DatePicker
        defaultValue="2026-08-15"
        onChange={onChange}
        data-testid="date"
      />,
    );

    const input = screen.getByTestId('date');
    await user.clear(input);
    await user.type(input, '1990-05-20');

    expect(input).toHaveValue('1990-05-20');
    expect(input).toHaveFocus();
    expect(onChange).toHaveBeenCalled();
  });

  it('exposes a calendar button that opens the day grid', async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue="2026-08-15" data-testid="date" />);

    await user.click(screen.getByRole('button', { name: 'Открыть календарь' }));

    expect(
      screen.getAllByRole('button', { name: 'Открыть календарь' }),
    ).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Календарь' })).toBeInTheDocument();
  });

  it('leaves the native picker on coarse pointers', async () => {
    const user = userEvent.setup();
    stubPointerMedia(true);

    render(<DatePicker defaultValue="2026-08-15" data-testid="date" />);
    await user.click(screen.getByTestId('date'));

    expect(
      screen.queryByRole('dialog', { name: 'Календарь' }),
    ).not.toBeInTheDocument();
  });

  it('closes the custom calendar when the pointer becomes coarse', async () => {
    const user = userEvent.setup();
    const pointer = stubPointerMedia(false);

    render(<DatePicker defaultValue="2026-08-15" data-testid="date" />);
    await user.click(screen.getByTestId('date'));
    expect(screen.getByRole('dialog', { name: 'Календарь' })).toBeInTheDocument();

    act(() => {
      pointer.setCoarse(true);
    });

    expect(
      screen.queryByRole('dialog', { name: 'Календарь' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByTestId('date'));
    expect(
      screen.queryByRole('dialog', { name: 'Календарь' }),
    ).not.toBeInTheDocument();
  });

  it('inerts the app root, moves focus into the dialog, and restores it on Escape', async () => {
    const user = userEvent.setup();
    const root = document.createElement('div');
    root.id = 'root';
    document.body.append(root);

    render(<DatePicker defaultValue="2026-08-15" data-testid="date" />, {
      container: root,
    });
    await user.click(screen.getByRole('button', { name: 'Открыть календарь' }));

    expect(root).toHaveProperty('inert', true);
    expect(
      screen.getByRole('button', { name: '15 августа 2026' }),
    ).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Календарь' })).not.toBeInTheDocument();
    expect(screen.getByTestId('date')).toHaveFocus();
    expect(root).toHaveProperty('inert', false);
  });

  it('restores input focus only after the app shell is no longer inert', async () => {
    const user = userEvent.setup();
    const restoreFocus = stubInertFocus();
    const root = document.createElement('div');
    document.body.append(root);

    try {
      render(<DatePicker defaultValue="2026-08-15" data-testid="date" />, {
        container: root,
      });
      await user.click(screen.getByRole('button', { name: 'Открыть календарь' }));
      expect(root).toHaveProperty('inert', true);

      await user.keyboard('{Escape}');

      expect(
        screen.queryByRole('dialog', { name: 'Календарь' }),
      ).not.toBeInTheDocument();
      expect(root).toHaveProperty('inert', false);
      expect(screen.getByTestId('date')).toHaveFocus();
    } finally {
      restoreFocus();
      root.remove();
    }
  });

  it('inerts the app shell under document.body without a hardcoded root id', async () => {
    const user = userEvent.setup();
    const shell = document.createElement('div');
    document.body.append(shell);

    try {
      render(<DatePicker defaultValue="2026-08-15" data-testid="date" />, {
        container: shell,
      });
      await user.click(screen.getByRole('button', { name: 'Открыть календарь' }));

      expect(shell).toHaveProperty('inert', true);
      expect(document.getElementById('root')).toBeNull();

      await user.keyboard('{Escape}');
      expect(shell).toHaveProperty('inert', false);
    } finally {
      shell.remove();
    }
  });

  it('moves month focus with arrow keys', async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue="2026-08-15" data-testid="date" />);

    await user.click(screen.getByTestId('date'));
    await user.click(screen.getByRole('button', { name: 'Выбрать месяц' }));
    expect(screen.getByRole('button', { name: 'август' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'сентябрь' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'декабрь' })).toHaveFocus();
  });

  it('moves year focus with arrow keys', async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue="2026-08-15" data-testid="date" />);

    await user.click(screen.getByTestId('date'));
    await user.click(screen.getByRole('button', { name: 'Выбрать год' }));
    expect(screen.getByRole('button', { name: '2026' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: '2025' })).toHaveFocus();
  });

  it('closes the popover when Shift+Tab moves focus outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Перед</button>
        <DatePicker defaultValue="2026-08-15" data-testid="date" />
      </div>,
    );

    await user.click(screen.getByTestId('date'));
    expect(screen.getByRole('dialog', { name: 'Календарь' })).toBeInTheDocument();

    await user.tab({ shift: true });

    expect(
      screen.queryByRole('dialog', { name: 'Календарь' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Перед' })).toHaveFocus();
  });

  it('syncs the highlighted day when the controlled value changes while open', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DatePicker value="2026-08-15" onChange={() => undefined} data-testid="date" />,
    );

    await user.click(screen.getByTestId('date'));
    expect(
      screen
        .getByRole('button', { name: '15 августа 2026' })
        .closest('[role="gridcell"]'),
    ).toHaveAttribute('aria-selected', 'true');

    rerender(
      <DatePicker value="2026-09-01" onChange={() => undefined} data-testid="date" />,
    );

    expect(
      screen
        .getByRole('button', { name: '1 сентября 2026' })
        .closest('[role="gridcell"]'),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      within(screen.getByRole('dialog', { name: 'Календарь' })).getByRole(
        'button',
        { name: 'Выбрать месяц' },
      ),
    ).toHaveTextContent('сентябрь');
  });
});
