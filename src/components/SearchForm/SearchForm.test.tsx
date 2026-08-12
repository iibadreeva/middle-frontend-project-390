import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { City } from '../../api';
import { DEFAULT_CITY_TIME_ZONE } from '../../data/cityTimeZones';
import { todayIsoDate } from '../../lib/format';
import { resolveTimeZoneByCode } from '../../lib/resolveCityTimeZone';
import { SEARCH_PASSENGERS_ERROR } from '../../lib/messages';
import { SearchForm } from './SearchForm';

const cities: City[] = [
  { code: 'MOW', name: 'Москва', country: 'Россия' },
  { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
  { code: 'AER', name: 'Сочи', country: 'Россия' },
];

const baseValues = {
  origin: 'MOW',
  destination: 'LED',
  date: todayIsoDate(DEFAULT_CITY_TIME_ZONE),
  passengers: 1,
};

describe('SearchForm', () => {
  it('keeps uncommitted draft when resolved values change', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SearchForm values={baseValues} cities={cities} onSubmit={vi.fn()} />,
    );

    await user.selectOptions(
      screen.getByTestId('search-destination'),
      'AER',
    );
    expect(screen.getByTestId('search-destination')).toHaveValue('AER');

    rerender(
      <SearchForm
        values={{ ...baseValues, passengers: 2 }}
        cities={cities}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('search-destination')).toHaveValue('AER');
    expect(screen.getByTestId('search-passengers')).toHaveValue(1);
  });

  it('clears form error when dirty draft is reconciled against new cities', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SearchForm
        values={{ ...baseValues, origin: 'MOW', destination: 'LED' }}
        cities={cities}
        onSubmit={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByTestId('search-origin'), 'LED');
    await user.selectOptions(screen.getByTestId('search-destination'), 'LED');
    await user.click(screen.getByTestId('search-submit'));
    expect(screen.getByTestId('search-form-error')).toBeInTheDocument();

    rerender(
      <SearchForm
        values={{ ...baseValues, origin: 'MOW', destination: 'AER', passengers: 2 }}
        cities={[
          { code: 'MOW', name: 'Москва', country: 'Россия' },
          { code: 'AER', name: 'Сочи', country: 'Россия' },
        ]}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('search-form-error')).not.toBeInTheDocument();
  });

  it('does not allow picking a date before today in the origin timezone', () => {
    render(
      <SearchForm values={baseValues} cities={cities} onSubmit={vi.fn()} />,
    );

    expect(screen.getByTestId('search-date')).toHaveAttribute(
      'min',
      todayIsoDate(resolveTimeZoneByCode(cities, 'MOW')),
    );
  });

  it('shows styled passengers error instead of native constraint validation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SearchForm values={baseValues} cities={cities} onSubmit={onSubmit} />,
    );

    await user.clear(screen.getByTestId('search-passengers'));
    await user.type(screen.getByTestId('search-passengers'), '12');
    await user.click(screen.getByTestId('search-submit'));

    expect(screen.getByTestId('search-form-error')).toHaveTextContent(
      SEARCH_PASSENGERS_ERROR,
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
