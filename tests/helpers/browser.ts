import { chromium, type Browser, type Page } from 'playwright';

export function requireAppUrl(): string {
  const appUrl = process.env.APP_URL ?? '';
  if (!appUrl) {
    throw new Error(
      'APP_URL не задан. Запуск: `make test` / `npm run test` (дефолт в Makefile и scripts/run-tests.mjs) или `APP_URL=http://localhost:5173 npm run test`.',
    );
  }
  return appUrl;
}

export async function createBrowserPage(): Promise<{
  browser: Browser;
  page: Page;
  appUrl: string;
}> {
  const appUrl = requireAppUrl();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  return { browser, page, appUrl };
}
