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
                                              # (dev-сервер отдаёт свежий код сам)
make build && make preview                    # в отдельном терминале
APP_URL=http://localhost:4173 make test       # против vite preview; нужен свежий dist
```

Юнит-тесты (`src/**/*.test.tsx`) и browser-тесты (`tests/**/*.spec.ts`) идут одной командой `make test`.
Preview не подхватывает правки автоматически — перед тестами против 4173 пересоберите `make build` (или перезапустите preview после сборки).
### Поиск рейсов

На главной (`/`) форма и список рейсов работают через API:

- `GET /api/cities` — названия городов в селектах (в запрос уходят **коды**). Если запрос падает или возвращает пустой список, форма остаётся на запасном наборе (`FALLBACK_CITIES`) и показывает `cities-fallback-notice`.
- `GET /api/flights?origin&destination&date&passengers` — поиск; пустой массив = «рейсов не найдено». Поиск стартует только после ответа `/api/cities` (или его ошибки), чтобы не слать лишний запрос по fallback-кодам.

Список загружается с разумными значениями по умолчанию (MOW → LED, сегодня, 1 пассажир). Параметры синхронизируются в query-строке. Старые ссылки `/flights?...` редиректят на `/?...`. Сетевые запросы ограничены таймаутом 15 с.

Даты и время: вылет/прилёт на карточке — **местное время аэропорта** (зона origin / destination) с коротким суффиксом (`MSK`, `YEKT`, `UTC+5`, …). Зона берётся из опционального `City.timeZone` в ответе API или из клиентского словаря `src/data/cityTimeZones.ts` (неизвестный код → `Europe/Moscow`). «Сегодня» и проверка «дата не в прошлом» считаются в зоне **города вылета** (`resolveSearchValues` / `validateSearchValues`, у инпута `min`). Некорректная или прошедшая дата в query переписывается на «сегодня» в зоне origin.

Цена: `Flight.price` из контракта — **за одного пассажира**. Карточка так и подписывает её (`flight-price`), а при нескольких пассажирах добавляет итог (`flight-total-price`). Показываются свободные места (`flight-seats`); если их меньше, чем пассажиров в поиске, выводится предупреждение (`flight-seats-warning`).

Состояния результата: загрузка (`flights-loading`), список (`flight-results` / `flight-result-item`), пусто (`flights-empty`), ошибка (`flights-error`). Кнопка `book-flight` ведёт на `/booking/:id` (дальше — экран оформления).

Browser-тесты поиска (`tests/flight-search.spec.ts`) подменяют ответы API через `page.route`, поэтому не зависят от содержимого Prism. Общие фикстуры городов/рейсов и хелперы дат живут в `src/test/fixtures.ts` — даты в тестах считаются от «сегодня», чтобы не устаревать.

Ключевые `data-testid` поиска: `flight-search-form`, `search-origin`, `search-destination`, `search-date`, `search-passengers`, `search-submit`, `search-form-error`, `cities-fallback-notice`, `flight-results`, `flight-result-item`, `flights-empty`, `flights-error`, `flights-loading`, `flight-departure`, `flight-arrival`, `flight-price`, `flight-total-price`, `flight-duration`, `flight-seats`, `flight-seats-warning`, `book-flight`.

### Оформление брони

Адрес `/booking/:flightId` — часть контракта: ссылкой можно поделиться, страница открывается напрямую. Рейс подгружается через `GET /api/flights/{id}`; неизвестный id → состояние `flight-not-found`.

Форма собирает контакт (`email`, `phone`) и пассажиров (имя, фамилия, дата рождения, документ) с кнопкой «добавить пассажира» (не больше 9 и не больше `seatsAvailable`). При N > 1 в блоке рейса и у кнопки submit показывается «Итого» (`price × N`), как в карточках поиска. Клиентская валидация не даёт отправить пустые обязательные поля и блокирует отправку, если пассажиров больше свободных мест. Пока рейс грузится, submit заблокирован. По submit уходит `POST /api/bookings`; при успехе (201) показывается панель с уникальным кодом брони (6 символов A–Z/0–9) и ссылкой на просмотр. Ошибки запроса и серверной валидации выводятся в `booking-error`. При ошибке загрузки рейса доступна кнопка «Повторить».

Browser-тесты оформления (`tests/booking.spec.ts`) тоже мокают API через `page.route`.

Ключевые `data-testid` брони: `booking-form`, `booking-flight`, `booking-flight-total-price`, `booking-flight-error`, `booking-flight-retry`, `contact-email`, `contact-phone`, `passenger-<i>-firstName` / `-lastName` / `-dob` / `-document`, `add-passenger`, `remove-passenger-<i>`, `booking-submit`, `booking-form-total-price`, `booking-success`, `booking-code`, `booking-view-link`, `booking-error`, `booking-seats-warning`, `flight-not-found`.

### CI

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) на каждый push и pull request:

1. `npm ci`, установка Chromium
2. lint и production-сборка
3. подъём Prism-мока и `vite preview` (порт 4173)
4. `APP_URL=http://localhost:4173 make test`
