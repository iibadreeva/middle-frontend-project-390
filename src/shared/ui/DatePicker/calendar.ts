import { isValidIsoDate } from '@shared/lib/format';

export type CalendarDay = {
  iso: string;
  day: number;
  inMonth: boolean;
};

export const MONTH_NAMES = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
] as const;

export const MONTH_NAMES_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
] as const;

export const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

const DEFAULT_YEAR_BACK = 120;
const DEFAULT_YEAR_FORWARD = 15;
export const YEARS_PER_PAGE = 24;
/** Совпадает с `.popover` width: 17.5rem при 16px. */
export const POPOVER_FALLBACK_WIDTH_PX = 280;
export const POPOVER_FALLBACK_HEIGHT_PX = 320;

export function toIsoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function toClampedIsoDate(
  year: number,
  month: number,
  day: number,
): string {
  return toIsoDate(
    year,
    month,
    Math.min(Math.max(day, 1), daysInMonth(year, month)),
  );
}

export function asIsoBound(
  value: string | number | readonly string[] | undefined,
): string | undefined {
  if (typeof value === 'string' && value !== '') {
    return value;
  }
  return undefined;
}

export function parseIsoDate(
  value: string,
): { year: number; month: number; day: number } | null {
  if (!isValidIsoDate(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split('-');
  return {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  };
}

export function localTodayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Monday = 0 … Sunday = 6, calendar date in UTC so TZ does not shift the weekday. */
function weekdayMondayFirst(year: number, month: number, day: number): number {
  const utcWeekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (utcWeekday + 6) % 7;
}

export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const startOffset = weekdayMondayFirst(year, month, 1);
  const monthLength = daysInMonth(year, month);
  const prev = shiftMonth(year, month, -1);
  const prevLength = daysInMonth(prev.year, prev.month);
  const next = shiftMonth(year, month, 1);
  const cells: CalendarDay[] = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    const day = prevLength - i;
    cells.push({
      iso: toIsoDate(prev.year, prev.month, day),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= monthLength; day += 1) {
    cells.push({
      iso: toIsoDate(year, month, day),
      day,
      inMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      iso: toIsoDate(next.year, next.month, nextDay),
      day: nextDay,
      inMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = ((index % 12) + 12) % 12;
  return { year: nextYear, month: nextMonth + 1 };
}

export function yearRange(
  min: string | undefined,
  max: string | undefined,
  todayYear: number,
): { start: number; end: number } {
  return {
    start: parseIsoDate(min ?? '')?.year ?? todayYear - DEFAULT_YEAR_BACK,
    end: parseIsoDate(max ?? '')?.year ?? todayYear + DEFAULT_YEAR_FORWARD,
  };
}

export function yearPage(
  year: number,
  startBound: number,
  endBound: number,
): number[] {
  const safeYear = Math.min(Math.max(year, startBound), endBound);
  const pageStart = Math.max(startBound, safeYear - (YEARS_PER_PAGE - 1));
  return Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i).filter(
    (pageYear) => pageYear <= endBound,
  );
}

export function isIsoOutOfRange(
  iso: string,
  min: string | undefined,
  max: string | undefined,
): boolean {
  return Boolean((min && iso < min) || (max && iso > max));
}

export function isMonthOutOfRange(
  year: number,
  month: number,
  min: string | undefined,
  max: string | undefined,
): boolean {
  const start = toIsoDate(year, month, 1);
  const end = toIsoDate(year, month, daysInMonth(year, month));
  return Boolean((min && end < min) || (max && start > max));
}

export function isYearOutOfRange(
  year: number,
  min: string | undefined,
  max: string | undefined,
): boolean {
  return isMonthOutOfRange(year, 1, min, max) && isMonthOutOfRange(year, 12, min, max);
}

export function shiftIsoDate(iso: string, days: number): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) {
    return iso;
  }

  const date = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day + days),
  );
  return toIsoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

export function startOfIsoWeek(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) {
    return iso;
  }
  return shiftIsoDate(
    iso,
    -weekdayMondayFirst(parsed.year, parsed.month, parsed.day),
  );
}

export function nearestEnabledIso(
  from: string,
  stepDays: number,
  min: string | undefined,
  max: string | undefined,
  limit = 42,
): string {
  let current = from;
  for (let i = 0; i < limit; i += 1) {
    const next = shiftIsoDate(current, stepDays);
    if (!isIsoOutOfRange(next, min, max)) {
      return next;
    }
    current = next;
  }
  return from;
}

export function weeksOf(grid: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }
  return weeks;
}

export function placePopover(
  input: {
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
  },
  popover: { width: number; height: number },
  viewport: { width: number; height: number },
  gap = 4,
): { top: number; left: number } {
  let left = input.left;
  if (left + popover.width > viewport.width) {
    left = Math.max(0, input.right - popover.width);
  }
  if (left < 0) {
    left = 0;
  }

  const below = input.bottom + gap;
  const fitsBelow = below + popover.height <= viewport.height;
  const top = fitsBelow
    ? below
    : Math.max(0, input.top - gap - popover.height);

  return { top, left };
}

/** Тот же объект, если пиксели не съехали — `setState` не разбудит попап. */
export function mergePopoverCoords(
  prev: { top: number; left: number },
  next: { top: number; left: number },
): { top: number; left: number } {
  if (prev.top === next.top && prev.left === next.left) {
    return prev;
  }
  return next;
}
