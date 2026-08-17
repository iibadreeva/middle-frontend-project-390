import type { KeyboardEvent } from 'react';
import { MONTH_NAMES_GENITIVE, isMonthOutOfRange, isYearOutOfRange, parseIsoDate } from './calendar';

export type CalendarView = 'days' | 'months' | 'years';

export type CalendarCursor = {
  year: number;
  month: number;
};

export type YearBounds = {
  start: number;
  end: number;
};

export function dayLabel(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) {
    return iso;
  }
  return `${parsed.day} ${MONTH_NAMES_GENITIVE[parsed.month - 1]} ${parsed.year}`;
}

export function monthDisabled(
  year: number,
  month: number,
  bounds: YearBounds,
  min?: string,
  max?: string,
) {
  return (
    year < bounds.start ||
    year > bounds.end ||
    isMonthOutOfRange(year, month, min, max)
  );
}

export function yearDisabled(
  year: number,
  bounds: YearBounds,
  min?: string,
  max?: string,
) {
  return (
    year < bounds.start ||
    year > bounds.end ||
    isYearOutOfRange(year, min, max)
  );
}

function gridArrowDelta(key: string, columns: number): number | undefined {
  if (key === 'ArrowRight') {
    return 1;
  }
  if (key === 'ArrowLeft') {
    return -1;
  }
  if (key === 'ArrowDown') {
    return columns;
  }
  if (key === 'ArrowUp') {
    return -columns;
  }
  return undefined;
}

export function moveGridFocus(
  event: KeyboardEvent<HTMLDivElement>,
  selector: string,
  columns: number,
) {
  const delta = gridArrowDelta(event.key, columns);
  if (delta == null) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.matches(selector)) {
    return;
  }

  const buttons = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>(selector),
  ];
  const start = buttons.indexOf(target);
  if (start < 0) {
    return;
  }

  let index = start + delta;
  while (index >= 0 && index < buttons.length) {
    const next = buttons[index];
    if (!next.disabled) {
      event.preventDefault();
      next.focus();
      return;
    }
    index += delta;
  }
}
