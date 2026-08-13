import type { Page } from 'playwright';

export {
  fixtureBooking,
  fixtureCities,
  fixtureFlights,
  futureIsoDate,
  pastIsoDate,
} from '../../src/test/fixtures';

import { fixtureCities } from '../../src/test/fixtures';

function isFlightsListUrl(url: URL): boolean {
  return /\/api\/flights\/?$/.test(url.pathname);
}

export async function mockCitiesApi(page: Page) {
  await page.route('**/api/cities', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixtureCities),
    });
  });
}

export async function mockCitiesApiError(page: Page) {
  await page.route('**/api/cities', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'server_error',
        message: 'Cities unavailable',
      }),
    });
  });
}

export async function mockFlightsApi(
  page: Page,
  handler: (url: URL) => { status: number; body: unknown },
) {
  await page.route('**/api/flights**', async (route) => {
    const url = new URL(route.request().url());
    if (!isFlightsListUrl(url)) {
      await route.fallback();
      return;
    }

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
      await route.fallback();
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
