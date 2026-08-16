### Hexlet tests and linter status:
[![Actions Status](https://github.com/iibadreeva/middle-frontend-project-390/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/iibadreeva/middle-frontend-project-390/actions)

## Flight Booking (frontend)

Клиентское приложение бронирования рейсов: React + Vite + TypeScript. API описывается в `contract/openapi.yaml`; локально и в проверке работает реальный сервер `@hexlet/frontend-flight-booking-server` (тот же контракт `/api/...`).

### Структура `src/`

Feature-based раскладка с жёсткими границами (ESLint):

- `app/` — роутер (`routes.ts`), layout, страницы-композиции
- `features/*` — UI и доменная логика фич (список подхватывается из каталога при загрузке ESLint-конфига; после добавления новой фичи перезапустите ESLint / IDE); снаружи только через `@features/<name>` (`index.ts`)
- `shared/` — общее UI, хуки, lib, api, store, test-хелперы; снаружи через alias `@shared/*` (публичного barrel нет — deep-import осознан)

Фичи не импортируют друг друга (relative резолвится в реальный путь, без ложных срабатываний на локальные `../<name>`) и не зависят от `app`; внутри фичи запрещён self-import через `@features/<name>`. `shared` (включая `shared/test`) не зависит от фич и `app`. Deep-import фич запрещён в `app`, `main` и `tests`. Production-код не импортирует `shared/test` / `@shared/test`. Маршруты (`bookingHref` / `lookupHref` в `app/routes.ts`) задаёт только `app` и передаёт в фичи через props (`getBookHref` / `bookHref`, `viewBookingHref`). `lookupHref()` → `/lookup`; `lookupHref({ code, lastName })` добавляет query для автозагрузки брони. Устаревшие `/bookings` и `/bookings/:code` редиректят на `/lookup`.

### Запуск

```bash
make install                                          # npm ci
npx frontend-flight-booking-server start              # API на http://localhost:8080
make dev                                              # Vite на http://localhost:5173, /api → :8080
```

Собранное приложение и API на одном origin (как в проверке и деплое):

```bash
make build
make start            # SPA из dist + /api на http://localhost:8080
```

Опционально для работы только по контракту без реального бэкенда: `make mock` (Prism на `:4010`). Для обычной разработки и тестов нужен реальный сервер.

В `package.json` есть `overrides.ajv-formats` — optional peer `ajv-formats@^2` у `@hookform/resolvers` против `ajv-formats@3` из `@hexlet/frontend-flight-booking-server` (fastify). Peer ranges `@testing-library/*` закрыты явной зависимостью `@testing-library/dom`.

### Тесты

Browser smoke-тест (Vitest + Playwright) читает адрес **только** из `APP_URL` (в самом тесте хардкода нет). Дефолт `http://localhost:8080` задаётся в `Makefile` / `scripts/run-tests.mjs`.

Проверки smoke:

- приложение открывается по `APP_URL`
- нет ошибок `console` / `pageerror`
- виден `<h1>` (ARIA-роль + `data-testid="home-heading"`) с непустым текстом
- виден корневой контейнер `data-testid="app"`

```bash
make browsers                                 # один раз: Chromium для Playwright
make build && make start                      # в отдельном терминале: SPA + API на :8080
make test                                     # APP_URL по умолчанию http://localhost:8080
```

Юнит-тесты (`src/**/*.test.tsx`) и browser-тесты (`tests/**/*.spec.ts`) идут одной командой `make test`. Перед `make start` нужна свежая сборка (`make build`).
### Поиск рейсов

На главной (`/`) форма и список рейсов работают через API:

- `GET /api/cities` — названия городов в селектах (в запрос уходят **коды**). Если запрос падает или возвращает пустой список, форма остаётся на запасном наборе (`FALLBACK_CITIES`) и показывает `cities-fallback-notice`.
- `GET /api/flights?origin&destination&date&passengers` — поиск; пустой массив = «рейсов не найдено». Поиск стартует только после ответа `/api/cities` (или его ошибки), чтобы не слать лишний запрос по fallback-кодам.

Список загружается с разумными значениями по умолчанию (MOW → LED, сегодня, 1 пассажир). Параметры синхронизируются в query-строке. Старые ссылки `/flights?...` редиректят на `/?...`. Сетевые запросы ограничены таймаутом 15 с.

Даты и время: вылет/прилёт на карточке — **местное время аэропорта** (зона origin / destination) с коротким суффиксом (`MSK`, `YEKT`, `UTC+5`, …). Зона берётся из опционального `City.timeZone` в ответе API или из клиентского словаря `src/shared/data/cityTimeZones.ts` (неизвестный код → `Europe/Moscow`). «Сегодня» и проверка «дата не в прошлом» считаются в зоне **города вылета** (`resolveSearchValues` / `validateSearchValues`, у инпута `min`). Некорректная или прошедшая дата в query переписывается на «сегодня» в зоне origin.

Цена: `Flight.price` из контракта — **за одного пассажира**. Карточка так и подписывает её (`flight-price`), а при нескольких пассажирах добавляет итог (`flight-total-price`). Показываются свободные места (`flight-seats`); если их меньше, чем пассажиров в поиске, выводится предупреждение (`flight-seats-warning`).

Состояния результата: загрузка (`flights-loading`), список (`flight-results` / `flight-result-item`), пусто (`flights-empty`), ошибка (`flights-error`). Кнопка `book-flight` ведёт на `/booking/:id` (дальше — экран оформления).

Browser-тесты поиска (`tests/flight-search.spec.ts`) подменяют ответы API через `page.route`, поэтому не зависят от данных сервера. Общие фикстуры городов/рейсов и хелперы дат живут в `src/shared/test/fixtures.ts` — даты в тестах считаются от «сегодня», чтобы не устаревать.

Ключевые `data-testid` поиска: `flight-search-form`, `search-origin`, `search-destination`, `search-date`, `search-passengers`, `search-submit`, `search-origin-error`, `search-destination-error`, `search-date-error`, `search-passengers-error`, `search-form-error` (только внешние/серверные ошибки), `cities-fallback-notice`, `flight-results`, `flight-result-item`, `flights-empty`, `flights-error`, `flights-loading`, `flight-departure`, `flight-arrival`, `flight-price`, `flight-total-price`, `flight-duration`, `flight-seats`, `flight-seats-warning`, `book-flight`.

### Оформление брони

Адрес `/booking/:flightId` — часть контракта: ссылкой можно поделиться, страница открывается напрямую. Рейс подгружается через `GET /api/flights/{id}`; неизвестный id → состояние `flight-not-found`.

Форма собирает контакт (`email`, `phone`) и пассажиров (имя, фамилия, дата рождения, документ) с кнопкой «добавить пассажира» (не больше 9 и не больше `seatsAvailable`). При N > 1 в блоке рейса и у кнопки submit показывается «Итого» (`price × N`), как в карточках поиска. Клиентская валидация (React Hook Form + Zod) показывает ошибки у полей (`contact-email-error`, `passenger-<i>-*-error` и т.п.) и блокирует отправку, если пассажиров больше свободных мест. Пока рейс грузится, submit заблокирован. По submit уходит `POST /api/bookings`; при успехе (201) показывается панель с уникальным кодом брони (6 символов A–Z/0–9) и ссылкой на просмотр. Ошибки запроса и серверной валидации выводятся в `booking-error`. При ошибке загрузки рейса доступна кнопка «Повторить».

Browser-тесты оформления (`tests/booking.spec.ts`) тоже мокают API через `page.route`.

Ключевые `data-testid` брони: `booking-form`, `booking-flight`, `booking-flight-total-price`, `booking-flight-error`, `booking-flight-retry`, `contact-email`, `contact-phone`, `contact-email-error`, `contact-phone-error`, `passenger-<i>-firstName` / `-lastName` / `-dob` / `-document` (+ `-*-error`), `add-passenger`, `remove-passenger-<i>`, `booking-submit`, `booking-form-total-price`, `booking-success`, `booking-code`, `booking-view-link`, `booking-error` (внешние/серверные), `booking-seats-warning`, `flight-not-found`.

### Просмотр брони

Экран «Мои брони» (`/lookup`, ссылка `nav-lookup`): форма поиска по коду брони и фамилии. По submit (и при открытии `/lookup?code=…&lastName=…`) уходит `GET /api/bookings/{code}?lastName=…`. Успех — карточка с рейсом, пассажирами, статусом (`data-status` = `confirmed` / `cancelled`) и итогом. 404 (неверный код или фамилия) → `booking-not-found`. Сетевые/серверные ошибки → `booking-lookup-error` + toast и кнопка `booking-lookup-retry` (повторный submit с теми же данными тоже делает refetch). Для `confirmed` доступна отмена через `POST /api/bookings/{code}/cancel` (`cancel-booking`, с confirm); после успеха статус становится `cancelled`. Ошибка отмены → `booking-cancel-error` + toast. Старые URL `/bookings` и `/bookings/:code` редиректят на `/lookup` (query `lastName` сохраняется).

Browser-тесты: `tests/lookup.spec.ts`.

Ключевые `data-testid` lookup: `nav-lookup`, `booking-lookup-form`, `lookup-code`, `lookup-lastName`, `lookup-submit`, `lookup-form-error`, `booking-details`, `booking-code`, `booking-status`, `cancel-booking`, `booking-not-found`, `booking-lookup-error`, `booking-lookup-retry`, `booking-cancel-error`.

### CI

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) на каждый push и pull request:

1. `npm ci`, установка Chromium
2. lint и production-сборка
3. `make start` (SPA из `dist` + API на порту 8080)
4. `APP_URL=http://localhost:8080 make test`
