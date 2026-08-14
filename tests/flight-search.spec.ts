import type { Browser, Page } from 'playwright';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  fixtureFlights,
  futureIsoDate,
  mockCitiesApi,
  mockCitiesApiError,
  mockFlightsApi,
  normalizeSpaces,
  pastIsoDate,
} from './helpers/apiMocks';
import { createBrowserPage } from './helpers/browser';
import { todayIsoDate } from '@shared/lib/format';
import { DEFAULT_CITY_TIME_ZONE } from '@shared/data/cityTimeZones';

const searchDate = futureIsoDate();
const otherSearchDate = futureIsoDate(35);

describe('flight search', () => {
  let browser: Browser;
  let page: Page;
  let appUrl: string;

  beforeAll(async () => {
    ({ browser, page, appUrl } = await createBrowserPage());
  });

  afterAll(async () => {
    await browser?.close();
  });

  beforeEach(async () => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await mockCitiesApi(page);
  });

  it('loads flights on home page open with default params', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });

    expect(await page.getByTestId('flight-search-form').isVisible()).toBe(true);
    expect(await page.getByTestId('flight-result-item').count()).toBe(
      fixtureFlights.length,
    );
    expect(await page.getByText('SU1234').isVisible()).toBe(true);
    expect(await page.getByText('Аэрофлот').first().isVisible()).toBe(true);

    const priceText = normalizeSpaces(
      (await page.getByTestId('flight-result-item').first().textContent()) ?? '',
    );
    expect(priceText).toContain('5 400 ₽');
    expect(await page.getByTestId('book-flight').count()).toBe(
      fixtureFlights.length,
    );
  });

  it('sends city codes, date and passengers after submit', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });

    await page
      .getByTestId('search-origin')
      .selectOption({ label: 'Санкт-Петербург' });
    await page.getByTestId('search-destination').selectOption({ label: 'Сочи' });
    await page.getByTestId('search-date').fill(otherSearchDate);
    await page.getByTestId('search-passengers').fill('3');

    // Подписка до клика: запрос уходит из эффекта и может опередить смену URL.
    const searchRequest = page.waitForRequest((request) =>
      /\/api\/flights\/?$/.test(new URL(request.url()).pathname),
    );
    await page.getByTestId('search-submit').click();

    const query = new URL((await searchRequest).url()).searchParams;
    expect(query.get('origin')).toBe('LED');
    expect(query.get('destination')).toBe('AER');
    expect(query.get('date')).toBe(otherSearchDate);
    expect(query.get('passengers')).toBe('3');

    await page.waitForURL(
      (url) =>
        url.searchParams.get('origin') === 'LED' &&
        url.searchParams.get('destination') === 'AER',
    );
  });

  it('applies search params from the URL on open', async () => {
    const flightRequests: string[] = [];

    await mockFlightsApi(page, (url) => {
      flightRequests.push(url.search);
      return { status: 200, body: fixtureFlights };
    });

    await page.goto(
      `${appUrl}/?origin=LED&destination=AER&date=${searchDate}&passengers=2`,
      { waitUntil: 'load' },
    );
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });

    expect(await page.getByTestId('search-origin').inputValue()).toBe('LED');
    expect(await page.getByTestId('search-destination').inputValue()).toBe(
      'AER',
    );
    expect(await page.getByTestId('search-date').inputValue()).toBe(searchDate);
    expect(await page.getByTestId('search-passengers').inputValue()).toBe('2');

    const matched = flightRequests.some(
      (query) =>
        query.includes('origin=LED') &&
        query.includes('destination=AER') &&
        query.includes(`date=${searchDate}`) &&
        query.includes('passengers=2'),
    );
    expect(matched).toBe(true);
  });

  it('redirects /flights query to home with the same params', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(
      `${appUrl}/flights?origin=LED&destination=MOW&date=${searchDate}&passengers=2`,
      { waitUntil: 'load' },
    );

    await page.waitForURL((url) => {
      return (
        url.pathname === '/' &&
        url.searchParams.get('origin') === 'LED' &&
        url.searchParams.get('destination') === 'MOW'
      );
    });

    expect(page.url()).toContain('origin=LED');
    expect(page.url()).toContain('destination=MOW');
    expect(page.url()).toContain('passengers=2');
    expect(new URL(page.url()).pathname).toBe('/');
  });

  it('keeps city selects usable when cities API fails', async () => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await mockCitiesApiError(page);
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('cities-fallback-notice').waitFor({ state: 'visible' });
    await page.getByTestId('flight-search-form').waitFor({ state: 'visible' });
    // Поиск завершён (success/empty) — submit снова доступен.
    await page.waitForFunction(() => {
      const button = document.querySelector(
        '[data-testid="search-submit"]',
      ) as HTMLButtonElement | null;
      return Boolean(button && !button.disabled);
    });

    const originOptions = page.getByTestId('search-origin').locator('option');
    expect(await originOptions.count()).toBeGreaterThan(0);
    expect(await page.getByTestId('search-origin').isDisabled()).toBe(false);
    expect(await page.getByTestId('search-destination').isDisabled()).toBe(
      false,
    );

    await page
      .getByTestId('search-origin')
      .selectOption({ label: 'Санкт-Петербург' });
    await page
      .getByTestId('search-destination')
      .selectOption({ label: 'Москва' });
    expect(await page.getByTestId('search-submit').isEnabled()).toBe(true);
  });

  it('shows empty state when API returns no flights', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: [],
    }));

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('flights-empty').waitFor({ state: 'visible' });

    expect(await page.getByTestId('flights-empty').isVisible()).toBe(true);
    expect(await page.getByTestId('flight-results').count()).toBe(0);
  });

  it('shows error state when flights request fails', async () => {
    await mockFlightsApi(page, () => ({
      status: 500,
      body: { code: 'server_error', message: 'Сервер недоступен' },
    }));

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('flights-error').waitFor({ state: 'visible' });

    expect(await page.getByTestId('flights-error').isVisible()).toBe(true);
    expect(await page.getByTestId('flights-error').textContent()).toContain(
      'Не удалось выполнить поиск рейсов',
    );
  });

  it('shows loading state while flights request is pending', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    await page.route(
      (url) => /\/api\/flights\/?$/.test(new URL(url).pathname),
      async (route) => {
        await gate;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fixtureFlights),
        });
      },
    );

    const navigation = page.goto(appUrl, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('flights-loading').waitFor({ state: 'visible' });
    expect(await page.getByTestId('flights-loading').isVisible()).toBe(true);

    release();
    await navigation;
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });
    expect(await page.getByTestId('flight-results').isVisible()).toBe(true);
  });

  it('navigates to booking page via book-flight', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });
    await page.getByTestId('book-flight').first().click();
    await page.waitForURL(/\/booking\/fl_1/);

    expect(page.url()).toMatch(/\/booking\/fl_1/);
  });

  it('rewrites invalid URL params to resolved search values', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(
      `${appUrl}/?origin=XXX&destination=YYY&date=${searchDate}&passengers=0`,
      { waitUntil: 'load' },
    );

    await page.waitForURL((url) => {
      return (
        url.searchParams.get('origin') === 'MOW' &&
        url.searchParams.get('destination') === 'LED' &&
        url.searchParams.get('date') === searchDate &&
        url.searchParams.get('passengers') === '1'
      );
    });

    expect(await page.getByTestId('search-origin').inputValue()).toBe('MOW');
    expect(await page.getByTestId('search-destination').inputValue()).toBe(
      'LED',
    );
    expect(await page.getByTestId('search-passengers').inputValue()).toBe('1');
  });

  it('rewrites an invalid date param to today', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(
      `${appUrl}/?origin=MOW&destination=LED&date=not-a-date&passengers=1`,
      { waitUntil: 'load' },
    );

    await page.waitForURL((url) => {
      const date = url.searchParams.get('date') ?? '';
      return (
        url.searchParams.get('origin') === 'MOW' &&
        url.searchParams.get('destination') === 'LED' &&
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        date !== 'not-a-date'
      );
    });

    const dateValue = await page.getByTestId('search-date').inputValue();
    expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateValue).not.toBe('not-a-date');
  });

  it('shows a notice when cities API fails', async () => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await mockCitiesApiError(page);
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('cities-fallback-notice').waitFor({ state: 'visible' });

    expect(await page.getByTestId('cities-fallback-notice').textContent()).toContain(
      'Не удалось загрузить полный список городов',
    );
  });

  it('blocks submit when origin and destination are the same', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });

    const urlBefore = page.url();

    await page.getByTestId('search-origin').selectOption({ label: 'Москва' });
    await page
      .getByTestId('search-destination')
      .selectOption({ label: 'Москва' });
    await page.getByTestId('search-submit').click();

    expect(
      await page.getByTestId('search-destination-error').isVisible(),
    ).toBe(true);
    expect(page.url()).toBe(urlBefore);
  });

  it('blocks submit when date is empty', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });

    const urlBefore = page.url();
    await page.getByTestId('search-date').fill('');
    await page.getByTestId('search-submit').click();

    expect(await page.getByTestId('search-date-error').isVisible()).toBe(true);
    expect(await page.getByTestId('search-date-error').textContent()).toContain(
      'Укажите дату вылета',
    );
    expect(page.url()).toBe(urlBefore);
  });

  it('rewrites a past date param to today', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(
      `${appUrl}/?origin=MOW&destination=LED&date=${pastIsoDate()}&passengers=1`,
      { waitUntil: 'load' },
    );

    await page.waitForURL(
      (url) => url.searchParams.get('date') === todayIsoDate(DEFAULT_CITY_TIME_ZONE),
    );

    expect(await page.getByTestId('search-date').inputValue()).toBe(
      todayIsoDate(DEFAULT_CITY_TIME_ZONE),
    );
  });

  it('blocks submit when the picked date is in the past', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });

    const urlBefore = page.url();
    await page.getByTestId('search-date').fill(pastIsoDate(1));
    await page.getByTestId('search-submit').click();

    expect(await page.getByTestId('search-date-error').textContent()).toContain(
      'Дата вылета не может быть в прошлом',
    );
    expect(page.url()).toBe(urlBefore);
  });

  it('shows the per-passenger price and the total for several passengers', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: fixtureFlights,
    }));

    await page.goto(
      `${appUrl}/?origin=MOW&destination=LED&date=${searchDate}&passengers=3`,
      { waitUntil: 'load' },
    );
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });

    const price = normalizeSpaces(
      (await page.getByTestId('flight-price').first().textContent()) ?? '',
    );
    expect(price).toContain('5 400 ₽');
    expect(price).toContain('за пассажира');

    const total = normalizeSpaces(
      (await page.getByTestId('flight-total-price').first().textContent()) ?? '',
    );
    expect(total).toContain('16 200 ₽');
  });

  it('warns when a flight has fewer seats than requested passengers', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: [{ ...fixtureFlights[0], seatsAvailable: 2 }],
    }));

    await page.goto(
      `${appUrl}/?origin=MOW&destination=LED&date=${searchDate}&passengers=3`,
      { waitUntil: 'load' },
    );
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });

    expect(await page.getByTestId('flight-seats-warning').isVisible()).toBe(
      true,
    );
    expect(await page.getByTestId('flight-seats').textContent()).toContain('2');
    expect(await page.getByTestId('book-flight').isDisabled()).toBe(true);
  });

  it('shows departure and arrival in airport-local timezones', async () => {
    await mockFlightsApi(page, () => ({
      status: 200,
      body: [
        {
          ...fixtureFlights[0],
          origin: { code: 'MOW', name: 'Москва', country: 'Россия' },
          destination: {
            code: 'SVX',
            name: 'Екатеринбург',
            country: 'Россия',
          },
          departureAt: '2026-07-01T08:00:00Z',
          arrivalAt: '2026-07-01T10:00:00Z',
        },
      ],
    }));

    await page.goto(
      `${appUrl}/?origin=MOW&destination=SVX&date=${searchDate}&passengers=1`,
      { waitUntil: 'load' },
    );
    await page.getByTestId('flight-results').waitFor({ state: 'visible' });

    const departure =
      (await page.getByTestId('flight-departure').textContent()) ?? '';
    const arrival =
      (await page.getByTestId('flight-arrival').textContent()) ?? '';

    expect(departure).toMatch(/MSK$/);
    expect(arrival).toMatch(/YEKT$/);
    expect(departure).not.toEqual(arrival);
  });
});
