# Airport-local timezones for flight search

Date: 2026-08-12  
Status: approved for planning

## Goal

Stop forcing all wall-clock times and calendar “today” into `Europe/Moscow`.  
Departure and arrival on a flight card must use the **airport local timezone** of origin and destination. Search “today” and “date not in the past” must use the **origin** city’s timezone.

## Decisions

| Topic | Choice |
| --- | --- |
| Display timezone | Airport local (origin for departure, destination for arrival) |
| Zone source | Hybrid: client dictionary by city `code`, optional `City.timeZone` from API overrides |
| OpenAPI | Do **not** require contract/Prism changes; `timeZone` is optional on the TypeScript `City` type |
| Calendar “today” / past validation | Origin city timezone |
| Time label on card | Short suffix: IANA short name when usable (`MSK`), else `UTC±H` / `UTC±H:MM` |
| Dictionary duplication | Single map in `src/data/cityTimeZones.ts`; do **not** duplicate zones on every `FALLBACK_CITIES` entry |

## Architecture

### Resolve

Add `resolveCityTimeZone(city: Pick<City, 'code' | 'timeZone'>): string`:

1. If `city.timeZone` is a non-empty string → use it  
2. Else look up `city.code` in `CITY_TIME_ZONES`  
3. Else fall back to `Europe/Moscow`

Dictionary covers at least the codes used by fallback cities and test fixtures (`MOW`, `LED`, `AER`, `KZN`, `SVX`, …). Prefer real IANA zones where they differ (e.g. `SVX → Asia/Yekaterinburg`) so demos are not all Moscow.

### Format

- Change `formatDateTime(iso, timeZone)` to format with `Intl` `ru-RU` in the given zone and append the short suffix described above.  
- Invalid ISO → existing placeholder `время неизвестно` (no throw).  
- Invalid / unsupported `timeZone` → fall back to `Europe/Moscow` without breaking the UI.  
- `todayIsoDate(timeZone)` returns `YYYY-MM-DD` for “today” in that zone (same `en-CA` / `formatToParts` approach as today, but parameterized).  
- `formatDuration` unchanged (elapsed minutes, not wall clock).

### UI

- `FlightCard`:  
  - departure → `formatDateTime(departureAt, resolveCityTimeZone(flight.origin))`  
  - arrival → `formatDateTime(arrivalAt, resolveCityTimeZone(flight.destination))`  
- Search form `min` and past-date validation use `todayIsoDate(resolveCityTimeZone(originCity))`.  
- Changing origin in the draft updates `min` and validation only; **do not** auto-rewrite the draft date when origin changes (YAGNI).

### Call sites

- `resolveSearchValues(params, cities)`: compute origin zone from the resolved origin city; use it for “today” and for rewriting past/invalid dates.  
- `validateSearchValues(values, timeZone)` (or equivalent): compare `values.date` to `todayIsoDate(timeZone)`.  
- `SearchForm`: pass origin zone into `min={todayIsoDate(originZone)}`.

## Testing

- Unit: `resolveCityTimeZone` priority (API → dictionary → fallback).  
- Unit: `formatDateTime` across zones + suffix; `todayIsoDate(zone)` with controlled clock where needed.  
- Unit: search resolve/validate with a non-Moscow origin.  
- Unit: `FlightCard` shows different suffixes when origin and destination zones differ.  
- Browser: one route with different origin/destination zones; assert suffix visible; search dates still tied to origin “today”.  
- Fixtures may include one city with explicit `timeZone` to cover API override.

## README

Replace the “everything is Europe/Moscow” note with:

- card times are airport-local + short suffix;  
- search “today” / past dates follow origin zone;  
- zones come from the client dictionary, optionally overridden by `City.timeZone` from the API.

## Out of scope

- Editing `contract/openapi.yaml` or Prism examples (optional later).  
- Auto-shifting draft date when origin changes.  
- User-selected display timezone / “convert to my time”.  
- Booking confirmation and other non-search datetime UIs beyond shared `formatDateTime` consumers.

## Success criteria

- No hardcoded single display zone for both departure and arrival.  
- Same flight can show two different local times/suffixes when cities differ in zone.  
- Past-date rules follow origin’s calendar day.  
- Missing API `timeZone` still works via dictionary; unknown codes degrade to Moscow without crashing.  
- Unit + browser suites stay green; README matches behavior.
