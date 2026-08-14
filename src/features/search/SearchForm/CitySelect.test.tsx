import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { City } from '@shared/api';
import { CitySelect } from './CitySelect';

const cities: City[] = [
  { code: 'MOW', name: 'Москва', country: 'Россия' },
  { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
];

describe('CitySelect', () => {
  it('exposes a displayName for DevTools', () => {
    expect(CitySelect.displayName).toBe('CitySelect');
  });

  it('forwards ref to the native select element', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <CitySelect
        ref={ref}
        label="Откуда"
        name="origin"
        value="MOW"
        cities={cities}
        testId="search-origin"
        onChange={vi.fn()}
      />,
    );

    expect(ref.current).toBe(screen.getByTestId('search-origin'));
  });

  it('wires invalid state and field error for assistive tech', () => {
    render(
      <CitySelect
        label="Откуда"
        name="origin"
        value="MOW"
        cities={cities}
        testId="search-origin"
        onChange={vi.fn()}
        invalid
        errorId="origin-error"
        errorMessage="Выберите город"
        errorTestId="search-origin-error"
      />,
    );

    const select = screen.getByTestId('search-origin');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', 'origin-error');
    expect(screen.getByTestId('search-origin-error')).toHaveTextContent(
      'Выберите город',
    );
  });

  it('calls onChange with the selected city code', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CitySelect
        label="Откуда"
        name="origin"
        value="MOW"
        cities={cities}
        testId="search-origin"
        onChange={onChange}
      />,
    );

    await user.selectOptions(screen.getByTestId('search-origin'), 'LED');

    expect(onChange).toHaveBeenCalledWith('LED');
  });
});
