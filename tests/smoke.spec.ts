import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('smoke', () => {
  let browser: Browser;
  let page: Page;
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  let appUrl: string;

  beforeAll(async () => {
    appUrl = process.env.APP_URL ?? '';
    if (!appUrl) {
      throw new Error(
        'APP_URL is not set. Run via `make test` or `APP_URL=http://localhost:5173 npm run test`.',
      );
    }

    browser = await chromium.launch();
    page = await browser.newPage();

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
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
