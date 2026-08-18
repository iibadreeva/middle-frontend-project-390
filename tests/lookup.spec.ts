import type { Browser, Page } from 'playwright';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BOOKING_NOT_FOUND } from '@shared/lib/messages';
import {
  fixtureBooking,
  mockCancelBookingApi,
  mockCitiesApi,
  mockGetBookingApi,
  normalizeSpaces,
} from './helpers/apiMocks';
import { createBrowserPage } from './helpers/browser';

describe('booking lookup', () => {
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

  it('opens /lookup from nav-lookup and shows the form', async () => {
    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('nav-lookup').click();
    await page.waitForURL(/\/lookup(?:\?|$)/);
    await page.getByTestId('booking-lookup-form').waitFor({ state: 'visible' });
    expect(await page.getByTestId('lookup-code').isVisible()).toBe(true);
    expect(await page.getByTestId('lookup-lastName').isVisible()).toBe(true);
    expect(await page.getByTestId('lookup-submit').isVisible()).toBe(true);
  });

  it('shows booking details for a valid code and lastName', async () => {
    const booking = fixtureBooking();
    await mockGetBookingApi(page, ({ code, lastName }) => {
      if (code === booking.code && lastName === 'Петров') {
        return { status: 200, body: booking };
      }
      return {
        status: 404,
        body: { code: 'not_found', message: 'missing' },
      };
    });

    await page.goto(appUrl, { waitUntil: 'load' });
    await page.getByTestId('nav-lookup').click();
    await page.getByTestId('lookup-code').fill(booking.code);
    await page.getByTestId('lookup-lastName').fill('Петров');
    await page.getByTestId('lookup-submit').click();

    await page.getByTestId('booking-details').waitFor({ state: 'visible' });
    expect(await page.getByTestId('booking-code').textContent()).toContain(
      booking.code,
    );
    expect(
      await page.getByTestId('booking-status').getAttribute('data-status'),
    ).toBe('confirmed');
    expect(
      normalizeSpaces(
        (await page.getByTestId('booking-route').textContent()) ?? '',
      ),
    ).toContain('Москва');
    expect(
      (await page.getByTestId('booking-passengers').textContent()) ?? '',
    ).toContain('Иван Петров');
    expect(
      normalizeSpaces(
        (await page.getByTestId('booking-total').textContent()) ?? '',
      ),
    ).toContain('5 400');
    expect(await page.getByTestId('cancel-booking').isVisible()).toBe(true);
  });

  it('shows booking-not-found for invalid credentials', async () => {
    await mockGetBookingApi(page, () => ({
      status: 404,
      body: { code: 'not_found', message: 'missing' },
    }));

    await page.goto(`${appUrl}/lookup`, { waitUntil: 'load' });
    await page.getByTestId('lookup-code').fill('WRONG1');
    await page.getByTestId('lookup-lastName').fill('Нет');
    await page.getByTestId('lookup-submit').click();

    await page.getByTestId('booking-not-found').waitFor({ state: 'visible' });
    expect(await page.getByTestId('booking-not-found').textContent()).toContain(
      BOOKING_NOT_FOUND,
    );
    expect(await page.getByTestId('booking-details').count()).toBe(0);
  });

  it('cancels a confirmed booking and hides the cancel button', async () => {
    const booking = fixtureBooking();
    const cancelled = fixtureBooking({ status: 'cancelled' });
    let current = booking;

    await mockGetBookingApi(page, ({ code, lastName }) => {
      if (code === booking.code && lastName === 'Петров') {
        return { status: 200, body: current };
      }
      return {
        status: 404,
        body: { code: 'not_found', message: 'missing' },
      };
    });
    await mockCancelBookingApi(page, ({ code, lastName }) => {
      if (code === booking.code && lastName === 'Петров') {
        current = cancelled;
        return { status: 200, body: cancelled };
      }
      return {
        status: 404,
        body: { code: 'not_found', message: 'missing' },
      };
    });

    await page.goto(
      `${appUrl}/lookup?code=${booking.code}&lastName=${encodeURIComponent('Петров')}`,
      { waitUntil: 'load' },
    );
    await page.getByTestId('booking-details').waitFor({ state: 'visible' });
    page.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await page.getByTestId('cancel-booking').click();

    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="booking-status"]');
      return el?.getAttribute('data-status') === 'cancelled';
    });
    expect(await page.getByTestId('cancel-booking').count()).toBe(0);
  });
});
