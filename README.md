### Hexlet tests and linter status:
[![Actions Status](https://github.com/iibadreeva/middle-frontend-project-390/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/iibadreeva/middle-frontend-project-390/actions)

## Flight Booking (frontend)

Клиентское приложение бронирования рейсов: React + Vite + TypeScript. API описывается в `contract/openapi.yaml`, локально его имитирует Prism.

### Запуск

```bash
make install          # npm ci
make mock             # Prism на http://localhost:4010
make dev              # Vite на http://localhost:5173, /api → мок
```

### Тесты

Browser smoke-тест (Vitest + Playwright) читает адрес **только** из `APP_URL` (в самом тесте хардкода нет). Дефолт `http://localhost:5173` задаётся в `Makefile` / `scripts/run-tests.mjs`.

Проверки smoke:

- приложение открывается по `APP_URL`
- нет ошибок `console` / `pageerror`
- виден `<h1>` (ARIA-роль + `data-testid="home-heading"`) с непустым текстом
- виден корневой контейнер `data-testid="app"`

```bash
make browsers                                 # один раз: Chromium для Playwright
make mock && make dev                         # в отдельных терминалах
make test                                     # APP_URL по умолчанию http://localhost:5173
APP_URL=http://localhost:4173 make test       # против vite preview
```

Юнит-тесты (`src/**/*.test.tsx`) и browser-тесты (`tests/**/*.spec.ts`) идут одной командой `make test`.

Ключевые `data-testid` на этом шаге: `app`, `app-header`, `app-brand`, `app-nav`, `app-main`, `search-page`, `home-heading`. Дальше по чеклисту Hexlet добавляйте атрибуты на новые интерактивные элементы.

### CI

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) на каждый push и pull request:

1. `npm ci`, установка Chromium
2. lint и production-сборка
3. подъём Prism-мока и `vite preview` (порт 4173)
4. `APP_URL=http://localhost:4173 make test`
