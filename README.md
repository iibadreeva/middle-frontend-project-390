# ✈️ Flight Booking Frontend

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/FSD-Architecture-blue?style=for-the-badge" alt="FSD" />
</p>

---

[![Actions Status](https://github.com/iibadreeva/middle-frontend-project-390/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/iibadreeva/middle-frontend-project-390/actions)

Современное клиентское приложение для поиска и бронирования авиабилетов. Построено с использованием методологии **Feature-Sliced Design (FSD)** для обеспечения масштабируемости и поддерживаемости кода.

🔗 **Демо приложения:** [https://middle-frontend-project-390-bbr2.onrender.com](https://middle-frontend-project-390-bbr2.onrender.com)

---

## 🚀 Быстрый старт

Для запуска приложения локально выполните следующие шаги:

1. **Установка зависимостей:**
   ```bash
   make install
   ```

2. **Запуск API-сервера:**
   Приложение работает с реальным сервером `@hexlet/frontend-flight-booking-server` (порт 8080).
   ```bash
   npx frontend-flight-booking-server start
   ```

3. **Запуск в режиме разработки:**
   ```bash
   make dev
   ```
   Приложение будет доступно по адресу [http://localhost:5173](http://localhost:5173). Все запросы к `/api` проксируются на сервер.

### 🏗️ Сборка для продакшена
Если нужно проверить работу SPA в связке с API на одном источнике (как в деплое):
```bash
make build
make start
```
Приложение откроется на [http://localhost:8080](http://localhost:8080).

---

## 📐 Архитектура проекта (`src/`)

Мы используем **feature-based** подход (FSD) с жёсткими границами между слоями. За соблюдением правил следит ESLint.

- **`app/`** — инициализация приложения: роутер, глобальные стили и провайдеры.
- **`pages/`** — композиционные страницы приложения.
- **`features/`** — изолированные части функциональности с собственной логикой и UI.
- **`entities/`** — бизнес-сущности (рейсы, бронирования, пассажиры).
- **`shared/`** — переиспользуемые компоненты, хуки, API-клиент и типы.

**Ключевые правила:**
- Фичи не зависят друг от друга.
- `shared` не знает о существовании верхних слоев.
- Направленный поток зависимостей (только сверху вниз).

---

## ✨ Функциональные возможности

### 🔍 Поиск рейсов
- Интерактивная форма поиска (откуда, куда, дата, количество пассажиров).
- Автоматическая подстановка городов и обработка ошибок загрузки.
- Отображение времени в формате **местного времени аэропорта**.
- Динамический расчет стоимости.

### 📝 Оформление брони
- Пошаговое заполнение данных пассажиров (до 9 человек).
- Валидация данных в реальном времени (**React Hook Form + Zod**).
- Контроль наличия свободных мест.
- Уникальный код бронирования после успеха.

### 📂 Управление бронированием
- Поиск существующей брони по коду и фамилии.
- Просмотр деталей рейса и текущего статуса (`confirmed` / `cancelled`).
- Возможность отмены бронирования.

---

## 🧪 Тестирование

Проект покрыт различными типами тестов для обеспечения стабильности.

| Тип теста | Команда | Инструменты |
| :--- | :--- | :--- |
| **Unit & Integration** | `npm run test` | Vitest, React Testing Library |
| **E2E (Browser)** | `npx playwright test` | Playwright |
| **Check All** | `make test` | Full validation cycle |

*Перед запуском тестов `make test` убедитесь, что выполнена сборка `make build` и запущен сервер `make start`.*

---

## ⚙️ CI/CD

Настроен **GitHub Actions**, который при каждом push и pull request:
1. Линтит код и проверяет типы.
2. Собирает проект.
3. Запускает полный цикл тестов.

Непрерывный деплой (CD) настроен на [**Render**](https://render.com/): при каждом пуше в `main` сервис автоматически пересобирается.

---
Разработано с ❤️ в рамках обучения на [Hexlet](https://ru.hexlet.io).
