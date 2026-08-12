import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from 'playwright';
import { createBrowserPage } from './helpers/browser';

describe('smoke', () => {
  let browser: Browser;
  let page: Page;
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  let appUrl: string;

  beforeAll(async () => {
    ({ browser, page, appUrl } = await createBrowserPage());

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.route('**/api/cities', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { code: 'MOW', name: 'Москва', country: 'Россия' },
          { code: 'LED', name: 'Санкт-Петербург', country: 'Россия' },
        ]),
      });
    });

    await page.route('**/api/flights*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto(appUrl, { waitUntil: 'load' });
  });

  afterAll(async () => {
    await browser?.close();
  });

  it('opens the home page without console errors and shows a non-empty h1', async () => {
    expect(await page.getByTestId('app').isVisible()).toBe(true);

    const headingByRole = page.getByRole('heading', { level: 1 });
    const headingByTestId = page.getByTestId('home-heading');

    expect(await headingByRole.isVisible()).toBe(true);
    expect(await headingByTestId.isVisible()).toBe(true);

    const text = (await headingByTestId.textContent())?.trim() ?? '';
    expect(text.length).toBeGreaterThan(0);

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toEqual(
      [],
    );
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
  });
});
