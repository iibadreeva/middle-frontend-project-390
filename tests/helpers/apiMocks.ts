import type { Page } from 'playwright';

export {
  fixtureBooking,
  fixtureCities,
  fixtureFlights,
  futureIsoDate,
  pastIsoDate,
} from '@shared/test/fixtures';

import { fixtureCities } from '@shared/test/fixtures';

async function routeCities(
  page: Page,
  fulfill: () => { status: number; body: unknown },
) {
  // unroute без активного route бросает — игнорируем.
  await page.unroute('**/api/cities').catch(() => undefined);
  await page.route('**/api/cities', async (route) => {
    const response = fulfill();
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });
}

export async function mockCitiesApi(page: Page) {
  await routeCities(page, () => ({ status: 200, body: fixtureCities }));
}

export async function mockCitiesApiError(page: Page) {
  await routeCities(page, () => ({
    status: 500,
    body: {
      code: 'server_error',
      message: 'Cities unavailable',
    },
  }));
}

export async function mockFlightsApi(
  page: Page,
  handler: (url: URL) => { status: number; body: unknown },
) {
  // Только список /api/flights[?…], не /api/flights/:id.
  // Без route.fallback() — иначе proxy на мёртвый Prism вешает тест.
  await page.route(/\/api\/flights(?:\?|$)/, async (route) => {
    const url = new URL(route.request().url());
    const response = handler(url);
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });
}

export async function mockFlightByIdApi(page: Page, flightId: string, body: unknown) {
  await page.route(`**/api/flights/${flightId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

export async function mockFlightByIdApiError(
  page: Page,
  flightId: string,
  status: number,
  body: unknown,
) {
  await page.route(`**/api/flights/${flightId}`, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

export async function mockCreateBookingApi(
  page: Page,
  handler: (body: unknown) => { status: number; body: unknown },
) {
  await page.route('**/api/bookings', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'method_not_allowed' }),
      });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(route.request().postData() ?? 'null');
    } catch {
      parsed = null;
    }

    const response = handler(parsed);
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });
}

export function normalizeSpaces(value: string): string {
  return value.replace(/\u00a0|\u202f/g, ' ');
}
