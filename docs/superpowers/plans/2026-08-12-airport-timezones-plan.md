# Airport-local timezones — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: test-driven-development.  
> Spec: `docs/superpowers/specs/2026-08-12-airport-timezones-design.md`

**Goal:** Departure/arrival wall times use airport-local zones (origin/destination); search “today” and past-date rules use the **origin** zone; zones come from a client dictionary with optional API `City.timeZone` override.

**Tech notes:**

- No OpenAPI / Prism changes.
- Do not duplicate zones onto every `FALLBACK_CITIES` entry.
- Do not auto-rewrite draft date when origin changes.
- Prefer `git add -f` for anything under `docs/` (gitignored).

---

## Task 1: City type + timezone dictionary + resolver

**Files:**

- Modify: `src/api.ts` — add optional `timeZone?: string` on `City`
- Create: `src/data/cityTimeZones.ts`
- Create: `src/lib/resolveCityTimeZone.ts`
- Create: `src/lib/resolveCityTimeZone.test.ts`

**Step 1: Failing tests for resolver**

```ts
import { describe, expect, it } from 'vitest';
import { resolveCityTimeZone } from './resolveCityTimeZone';

describe('resolveCityTimeZone', () => {
  it('prefers API timeZone over the dictionary', () => {
    expect(
      resolveCityTimeZone({ code: 'MOW', timeZone: 'Asia/Yekaterinburg' }),
    ).toBe('Asia/Yekaterinburg');
  });

  it('uses the dictionary when API omits timeZone', () => {
    expect(resolveCityTimeZone({ code: 'SVX' })).toBe('Asia/Yekaterinburg');
  });

  it('falls back to Europe/Moscow for unknown codes', () => {
    expect(resolveCityTimeZone({ code: 'XXX' })).toBe('Europe/Moscow');
  });

  it('ignores empty API timeZone', () => {
    expect(resolveCityTimeZone({ code: 'SVX', timeZone: '  ' })).toBe(
      'Asia/Yekaterinburg',
    );
  });
});
```

**Step 2: Run — expect FAIL** (`resolveCityTimeZone` missing)

```bash
npx vitest run src/lib/resolveCityTimeZone.test.ts
```

**Step 3: Minimal implementation**

`cityTimeZones.ts` — map at least:

| code | IANA |
| --- | --- |
| MOW, LED, AER, KZN | `Europe/Moscow` |
| SVX | `Asia/Yekaterinburg` |

`resolveCityTimeZone`: trim API value → dictionary → `Europe/Moscow`.

**Step 4: Run — expect PASS**

```bash
npx vitest run src/lib/resolveCityTimeZone.test.ts
```

**Step 5: Commit**

```bash
git add src/api.ts src/data/cityTimeZones.ts src/lib/resolveCityTimeZone.ts src/lib/resolveCityTimeZone.test.ts
git commit -m "Add city timezone dictionary and resolver."
```

---

## Task 2: Parameterize `formatDateTime` and `todayIsoDate`

**Files:**

- Modify: `src/lib/format.ts`
- Modify: `src/lib/format.test.ts`

**Step 1: Failing tests**

Extend `format.test.ts`:

- `formatDateTime(iso, timeZone)` requires `timeZone` (breaking change — update all call sites in later tasks; for this task only test the function).
- Same UTC instant formats differently in `Europe/Moscow` vs `Asia/Yekaterinburg`.
- Result includes a short suffix (`MSK` or `UTC+…`).
- Invalid ISO → `время неизвестно` (no suffix required).
- Invalid timezone argument does not throw; falls back to Moscow formatting.
- `todayIsoDate(timeZone)` returns `YYYY-MM-DD`; with `vi.useFakeTimers` / fixed `Date`, two zones near a day boundary can differ if you pick a careful instant — at minimum assert format and that `todayIsoDate('Asia/Yekaterinburg')` equals the `Intl` parts for that zone.

Helper idea for suffix assertion: `expect(formatted).toMatch(/MSK$/)` for known zones (or exact `UTC+5:30` for others).

> **Implementation note (as built):** ICU returns `GMT+3` for `Europe/Moscow`, not `MSK`. Final code uses `TIME_ZONE_ABBREVIATIONS` in `cityTimeZones.ts` for MSK/YEKT and offset-based `UTC±H` otherwise — do not reintroduce Intl short-name parsing for RU zones.

**Step 2: Run — expect FAIL** (signature / suffix missing)

```bash
npx vitest run src/lib/format.test.ts
```

**Step 3: Implement**

- Remove module-level `DISPLAY_TIME_ZONE` as the only zone.
- Export `DEFAULT_TIME_ZONE = 'Europe/Moscow'` if needed by resolver/fallback.
- `formatDateTime(iso, timeZone)`:
  1. Parse date; invalid → placeholder.
  2. Resolve effective zone (try/catch or validate via `Intl` — on failure use default).
  3. Format date+time with `ru-RU`.
  4. Append short suffix from `TIME_ZONE_ABBREVIATIONS` (`MSK` / `YEKT`); otherwise format offset as `UTC±H` / `UTC±H:MM` (zero offset → `UTC`). Do **not** rely on ICU `timeZoneName: 'short'` for Russian zones.
- `todayIsoDate(timeZone)`: same `en-CA` + `formatToParts`, parameterized zone, fallback on bad zone.

**Step 4: Run — expect PASS**

```bash
npx vitest run src/lib/format.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "Format datetimes and today in an explicit IANA timezone."
```

---

## Task 3: Wire search “today” / past validation to origin zone

**Files:**

- Modify: `src/lib/searchValidation.ts`
- Modify: `src/lib/searchValidation.test.ts`
- Modify: `src/lib/resolveSearchValues.ts`
- Modify: `src/lib/resolveSearchValues.test.ts`
- Modify: `src/hooks/useFlightSearch.ts` (pass zone into validate)
- Modify: `src/components/SearchForm/SearchForm.tsx` (`min` from origin zone)
- Modify: `src/components/SearchForm/SearchForm.test.tsx`
- Possibly: `src/pages/SearchPage.tsx` if form needs cities for origin lookup (prefer resolve zone inside form from `cities` + `draft.origin`)

**Step 1: Failing tests**

- `validateSearchValues(values, timeZone)`: past relative to **that** zone (use `pastIsoDate` helpers carefully — or construct dates via known zone “today”).
- `resolveSearchValues`: when origin resolves to `SVX`, “today” / past rewrite uses `Asia/Yekaterinburg` (spy or compare against `todayIsoDate('Asia/Yekaterinburg')`).
- `SearchForm`: `min` attribute equals `todayIsoDate(resolveCityTimeZone(origin city))`.

**Step 2: Run — expect FAIL**

```bash
npx vitest run src/lib/searchValidation.test.ts src/lib/resolveSearchValues.test.ts src/components/SearchForm/SearchForm.test.tsx
```

**Step 3: Implement**

- `validateSearchValues(values, timeZone: string)`.
- In `resolveSearchValues`, after resolving `origin`, `const originZone = resolveCityTimeZone(cities.find(...) ?? { code: origin })`, use `todayIsoDate(originZone)`.
- `useFlightSearch`: `validateSearchValues(values, resolveCityTimeZone(...))`.
- `SearchForm`: compute `originZone` from `cities` + `draft.origin`, `min={todayIsoDate(originZone)}`.
- Update all unit callers of `todayIsoDate()` / `validateSearchValues` / `formatDateTime` that break the build.

**Step 4: Run — expect PASS** for search-related unit tests + full unit project if needed

```bash
npx vitest run --project unit
```

**Step 5: Commit**

```bash
git add src/lib/searchValidation.ts src/lib/searchValidation.test.ts src/lib/resolveSearchValues.ts src/lib/resolveSearchValues.test.ts src/hooks/useFlightSearch.ts src/hooks/useFlightSearch.test.tsx src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.test.tsx
git commit -m "Tie search today and past-date checks to origin timezone."
```

---

## Task 4: FlightCard local departure / arrival

**Files:**

- Modify: `src/components/FlightCard/FlightCard.tsx`
- Modify: `src/components/FlightCard/FlightCard.test.tsx`
- Modify: `src/test/fixtures.ts` (optional: destination with different zone via code `SVX`, or origin/destination codes that map differently)

**Step 1: Failing test**

- Build a flight with `origin.code = 'MOW'`, `destination.code = 'SVX'` (same UTC timestamps).
- Assert schedule text contains two different zone suffixes (`MSK` and `YEKT` via `TIME_ZONE_ABBREVIATIONS`, not engine-dependent Intl names).
- Prefer asserting via `data-testid` if you split departure/arrival spans:

```tsx
<span data-testid="flight-departure">{formatDateTime(...)}</span>
<span data-testid="flight-arrival">{formatDateTime(...)}</span>
```

**Step 2: Run — expect FAIL**

```bash
npx vitest run src/components/FlightCard/FlightCard.test.tsx
```

**Step 3: Implement**

- Call `resolveCityTimeZone` for origin/destination.
- Pass into `formatDateTime`.
- Add testids for stable browser/unit assertions.

**Step 4: Run — expect PASS**

```bash
npx vitest run src/components/FlightCard/FlightCard.test.tsx src/components/FlightResults/FlightResults.test.tsx
```

**Step 5: Commit**

```bash
git add src/components/FlightCard src/test/fixtures.ts
git commit -m "Show departure and arrival in airport-local timezones."
```

---

## Task 5: Fixtures override + browser coverage + README

**Files:**

- Modify: `src/test/fixtures.ts` — one city with explicit `timeZone` for override demo if useful; ensure flight fixtures can use `SVX` for dual-zone card
- Modify: `tests/helpers/apiMocks.ts` / `tests/flight-search.spec.ts` — one test: results show zone suffix; search `min`/rewrite still works with origin `SVX` if covered
- Modify: `README.md` — replace Moscow-only note with hybrid + origin calendar + card suffixes; list new testids if added
- Fix any remaining compile breaks (`formatDateTime` arity, `todayIsoDate` arity)

**Step 1: Failing browser assertion** (or unit-only if browser env hard)

```ts
// after loading results for MOW→SVX fixture
expect(await page.getByTestId('flight-departure').textContent()).toMatch(/MSK$/);
expect(await page.getByTestId('flight-arrival').textContent()).toMatch(/YEKT$/);
```

**Step 2–4:** implement README + fixtures + browser test; run:

```bash
npx vitest run --project unit
npx tsc --noEmit
npx eslint .
# with preview up:
$env:APP_URL='http://localhost:4173'; npx vitest run --project browser
```

**Step 5: Commit**

```bash
git add README.md src/test/fixtures.ts tests/flight-search.spec.ts tests/helpers/apiMocks.ts
git commit -m "Document airport-local times and cover them in browser tests."
```

---

## Task 6: Final verification

```bash
npx vitest run --project unit
npx tsc --noEmit
npx eslint .
npm run build
# preview + browser project as in CI
```

Confirm success criteria from the spec:

- [ ] No single hardcoded display zone for both legs  
- [ ] Dual-zone suffixes possible on one card  
- [ ] Past-date / today follow origin zone  
- [ ] Missing API `timeZone` works via dictionary  
- [ ] Unknown code → Moscow without crash  
- [ ] README matches behavior  
- [ ] Unit + browser green  

---

## Execution order

1 → 2 → 3 → 4 → 5 → 6  

Do not skip RED before GREEN on each task. Keep commits small and message-focused on **why**.
