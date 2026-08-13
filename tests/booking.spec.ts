import type { Browser, Page } from 'playwright';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BOOKING_CREATE_ERROR, BOOKING_REQUIRED_ERROR } from '../src/lib/messages';
import {
  fixtureBooking,
  fixtureFlights,
  mockCreateBookingApi,
  mockFlightByIdApi,
  mockFlightByIdApiError,
} from './helpers/apiMocks';
import { createBrowserPage } from './helpers/browser';

async function fillPassenger(
  page: Page,
  index: number,
  values: {
    firstName: string;
    lastName: string;
    dob: string;
    document: string;
  },
) {
  await page.getByTestId(`passenger-${index}-firstName`).fill(values.firstName);
  await page.getByTestId(`passenger-${index}-lastName`).fill(values.lastName);
  await page.getByTestId(`passenger-${index}-dob`).fill(values.dob);
  await page.getByTestId(`passenger-${index}-document`).fill(values.document);
}

async function fillValidBookingForm(page: Page) {
  await page.getByTestId('contact-email').fill('ivan@example.com');
  await page.getByTestId('contact-phone').fill('+79991234567');
  await fillPassenger(page, 0, {
    firstName: 'Иван',
    lastName: 'Петров',
    dob: '1990-05-20',
    document: '4509 123456',
  });
}

describe('booking', () => {
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
  });

  it('opens /booking/:id directly and shows the flight summary', async () => {
    await mockFlightByIdApi(page, 'fl_1', fixtureFlights[0]);

    await page.goto(`${appUrl}/booking/fl_1`, { waitUntil: 'load' });
    await page.getByTestId('booking-form').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="booking-flight"]');
      return el?.textContent?.includes('Аэрофлот · SU1234') ?? false;
    });

    expect(await page.getByTestId('booking-form').isVisible()).toBe(true);
    expect(await page.getByTestId('booking-flight').textContent()).toContain(
      'Аэрофлот · SU1234',
    );
    expect(await page.getByTestId('booking-submit').isEnabled()).toBe(true);
  });

  it('shows flight-not-found for an unknown flight id', async () => {
    await mockFlightByIdApiError(page, 'unknown', 404, {
      code: 'not_found',
      message: 'Flight not found',
    });

    await page.goto(`${appUrl}/booking/unknown`, { waitUntil: 'load' });
    await page.getByTestId('flight-not-found').waitFor({ state: 'visible' });

    expect(await page.getByTestId('flight-not-found').isVisible()).toBe(true);
    expect(await page.getByTestId('booking-form').count()).toBe(0);
  });

  it('does not submit when required fields are empty', async () => {
    await mockFlightByIdApi(page, 'fl_1', fixtureFlights[0]);

    let createCalls = 0;
    await mockCreateBookingApi(page, () => {
      createCalls += 1;
      return { status: 201, body: fixtureBooking() };
    });

    await page.goto(`${appUrl}/booking/fl_1`, { waitUntil: 'load' });
    await page.getByTestId('booking-submit').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const button = document.querySelector(
        '[data-testid="booking-submit"]',
      ) as HTMLButtonElement | null;
      return Boolean(button && !button.disabled);
    });

    await page.getByTestId('booking-submit').click();

    expect(createCalls).toBe(0);
    expect(await page.getByTestId('booking-error').textContent()).toContain(
      BOOKING_REQUIRED_ERROR,
    );
  });

  it('adds a passenger and posts both passengers with contact', async () => {
    await mockFlightByIdApi(page, 'fl_1', fixtureFlights[0]);

    let posted: unknown = null;
    await mockCreateBookingApi(page, (body) => {
      posted = body;
      return {
        status: 201,
        body: fixtureBooking({
          passengers: [
            {
              firstName: 'Иван',
              lastName: 'Петров',
              dateOfBirth: '1990-05-20',
              documentNumber: '4509 123456',
            },
            {
              firstName: 'Анна',
              lastName: 'Сидорова',
              dateOfBirth: '1992-03-15',
              documentNumber: '4510 654321',
            },
          ],
        }),
      };
    });

    await page.goto(`${appUrl}/booking/fl_1`, { waitUntil: 'load' });
    await page.waitForFunction(() => {
      const button = document.querySelector(
        '[data-testid="booking-submit"]',
      ) as HTMLButtonElement | null;
      return Boolean(button && !button.disabled);
    });

    await page.getByTestId('add-passenger').click();
    expect(await page.getByTestId('passenger-1-firstName').isVisible()).toBe(
      true,
    );

    const normalize = (value: string | null) =>
      (value ?? '').replace(/\u00a0|\u202f/g, ' ');
    expect(
      normalize(await page.getByTestId('booking-flight-total-price').textContent()),
    ).toContain('Итого:');
    expect(
      normalize(await page.getByTestId('booking-form-total-price').textContent()),
    ).toContain('Итого:');

    await page.getByTestId('contact-email').fill('ivan@example.com');
    await page.getByTestId('contact-phone').fill('+79991234567');
    await fillPassenger(page, 0, {
      firstName: 'Иван',
      lastName: 'Петров',
      dob: '1990-05-20',
      document: '4509 123456',
    });
    await fillPassenger(page, 1, {
      firstName: 'Анна',
      lastName: 'Сидорова',
      dob: '1992-03-15',
      document: '4510 654321',
    });

    await page.getByTestId('booking-submit').click();
    await page.getByTestId('booking-success').waitFor({ state: 'visible' });

    expect(posted).toEqual({
      flightId: 'fl_1',
      contact: {
        email: 'ivan@example.com',
        phone: '+79991234567',
      },
      passengers: [
        {
          firstName: 'Иван',
          lastName: 'Петров',
          dateOfBirth: '1990-05-20',
          documentNumber: '4509 123456',
        },
        {
          firstName: 'Анна',
          lastName: 'Сидорова',
          dateOfBirth: '1992-03-15',
          documentNumber: '4510 654321',
        },
      ],
    });
  });

  it('shows booking-success with a 6-character booking code', async () => {
    await mockFlightByIdApi(page, 'fl_1', fixtureFlights[0]);
    await mockCreateBookingApi(page, () => ({
      status: 201,
      body: fixtureBooking({ code: 'AB12CD' }),
    }));

    await page.goto(`${appUrl}/booking/fl_1`, { waitUntil: 'load' });
    await page.waitForFunction(() => {
      const button = document.querySelector(
        '[data-testid="booking-submit"]',
      ) as HTMLButtonElement | null;
      return Boolean(button && !button.disabled);
    });

    await fillValidBookingForm(page);
    await page.getByTestId('booking-submit').click();

    await page.getByTestId('booking-success').waitFor({ state: 'visible' });
    const code = (await page.getByTestId('booking-code').textContent()) ?? '';
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(await page.getByTestId('booking-form').count()).toBe(0);
  });

  it('shows booking-error with the server validation message', async () => {
    await mockFlightByIdApi(page, 'fl_1', fixtureFlights[0]);
    await mockCreateBookingApi(page, () => ({
      status: 400,
      body: {
        code: 'validation_error',
        message: 'Укажите корректный документ пассажира',
      },
    }));

    await page.goto(`${appUrl}/booking/fl_1`, { waitUntil: 'load' });
    await page.waitForFunction(() => {
      const button = document.querySelector(
        '[data-testid="booking-submit"]',
      ) as HTMLButtonElement | null;
      return Boolean(button && !button.disabled);
    });

    await fillValidBookingForm(page);
    await page.getByTestId('booking-submit').click();

    await page.getByTestId('booking-error').waitFor({ state: 'visible' });
    expect(await page.getByTestId('booking-error').textContent()).toContain(
      'Укажите корректный документ пассажира',
    );
    expect(await page.getByTestId('booking-success').count()).toBe(0);
  });

  it('shows booking-error when the create request fails', async () => {
    await mockFlightByIdApi(page, 'fl_1', fixtureFlights[0]);
    await page.route('**/api/bookings', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      await route.abort('failed');
    });

    await page.goto(`${appUrl}/booking/fl_1`, { waitUntil: 'load' });
    await page.waitForFunction(() => {
      const button = document.querySelector(
        '[data-testid="booking-submit"]',
      ) as HTMLButtonElement | null;
      return Boolean(button && !button.disabled);
    });

    await fillValidBookingForm(page);
    await page.getByTestId('booking-submit').click();

    await page.getByTestId('booking-error').waitFor({ state: 'visible' });
    expect(await page.getByTestId('booking-error').textContent()).toContain(
      BOOKING_CREATE_ERROR,
    );
  });
});
