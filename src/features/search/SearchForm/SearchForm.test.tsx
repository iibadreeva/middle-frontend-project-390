import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { City } from '@entities/city';
import { DEFAULT_CITY_TIME_ZONE } from '@shared/data/cityTimeZones';
import { todayIsoDate } from '@shared/lib/format';
import { resolveTimeZoneByCode } from '@shared/lib/resolveCityTimeZone';
import {
  SEARCH_CITY_REQUIRED_ERROR,
  SEARCH_DATE_PAST_ERROR,
  SEARCH_PASSENGERS_ERROR,
} from '@shared/lib/messages';
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('shows field errors for invalid values from props synchronously on mount', () => {
    render(
      <SearchForm
        values={{ ...baseValues, origin: '' }}
        cities={cities}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('search-origin-error')).toHaveTextContent(
      SEARCH_CITY_REQUIRED_ERROR,
    );
  });

  it('remaps dirty draft cities when they disappear from the list', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SearchForm
        values={{ ...baseValues, origin: 'MOW', destination: 'LED' }}
        cities={cities}
        onSubmit={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByTestId('search-origin'), 'LED');
    expect(screen.getByTestId('search-origin')).toHaveValue('LED');

    rerender(
      <SearchForm
        values={{ ...baseValues, origin: 'MOW', destination: 'AER' }}
        cities={[
          { code: 'MOW', name: 'Москва', country: 'Россия' },
          { code: 'AER', name: 'Сочи', country: 'Россия' },
        ]}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('search-origin')).toHaveValue('MOW');
    expect(screen.getByTestId('search-destination')).toHaveValue('AER');
    expect(screen.queryByTestId('search-origin-error')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('search-destination-error'),
    ).not.toBeInTheDocument();
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

    expect(screen.getByTestId('search-passengers-error')).toHaveTextContent(
      SEARCH_PASSENGERS_ERROR,
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits when origin and destination are the same', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SearchForm
        values={{ ...baseValues, origin: 'MOW', destination: 'MOW' }}
        cities={cities}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByTestId('search-submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      origin: 'MOW',
      destination: 'MOW',
      date: baseValues.date,
      passengers: 1,
    });
  });

  it('revalidates date when origin timezone boundary changes', async () => {
    // 2026-08-12 20:30 UTC — ещё 12-е в Москве (UTC+3), уже 13-е в Екатеринбурге (UTC+5).
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-08-12T20:30:00Z'));

    const zonedCities: City[] = [
      { code: 'MOW', name: 'Москва', country: 'Россия' },
      { code: 'SVX', name: 'Екатеринбург', country: 'Россия' },
      { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
    ];

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <SearchForm
        values={{
          origin: 'MOW',
          destination: 'LED',
          date: '2026-08-12',
          passengers: 1,
        }}
        cities={zonedCities}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('search-date-error')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByTestId('search-origin'), 'SVX');

    expect(screen.getByTestId('search-date-error')).toHaveTextContent(
      SEARCH_DATE_PAST_ERROR,
    );

    await user.clear(screen.getByTestId('search-date'));
    await user.type(screen.getByTestId('search-date'), '2026-08-13');

    expect(screen.queryByTestId('search-date-error')).not.toBeInTheDocument();
  });

  it('clears passengers error on change without submit after sync from props', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SearchForm values={baseValues} cities={cities} onSubmit={vi.fn()} />,
    );

    await user.clear(screen.getByTestId('search-passengers'));
    await user.type(screen.getByTestId('search-passengers'), '12');

    // Смена cities при грязном draft сохраняет passengers и синкает ошибки.
    rerender(
      <SearchForm
        values={{ ...baseValues, passengers: 2 }}
        cities={[
          { code: 'MOW', name: 'Москва', country: 'Россия' },
          { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
          { code: 'AER', name: 'Сочи', country: 'Россия' },
          { code: 'KZN', name: 'Казань', country: 'Россия' },
        ]}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('search-passengers-error')).toHaveTextContent(
      SEARCH_PASSENGERS_ERROR,
    );

    await user.clear(screen.getByTestId('search-passengers'));
    await user.type(screen.getByTestId('search-passengers'), '2');

    expect(
      screen.queryByTestId('search-passengers-error'),
    ).not.toBeInTheDocument();
  });
});
