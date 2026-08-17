import {
  forwardRef,
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { assignRef } from './assignRef';
import { CalendarDaysView } from './CalendarDaysView';
import { CalendarMonthsView } from './CalendarMonthsView';
import { CalendarYearsView } from './CalendarYearsView';
import {
  MONTH_NAMES,
  YEARS_PER_PAGE,
  isIsoOutOfRange,
  nearestEnabledIso,
  parseIsoDate,
  shiftIsoDate,
  shiftMonth,
  startOfIsoWeek,
  toClampedIsoDate,
  yearPage,
  yearRange,
} from './calendar';
import {
  monthDisabled,
  moveGridFocus,
  yearDisabled,
  type CalendarCursor,
  type CalendarView,
} from './calendarGrid';
import { trapTabKey } from './focusTrap';
import styles from './DatePicker.module.css';

export type { CalendarCursor, CalendarView };

type CalendarPopoverProps = {
  id: string;
  view: CalendarView;
  cursor: CalendarCursor;
  selectedIso: string;
  focusedIso: string;
  todayIso: string;
  min?: string;
  max?: string;
  modal?: boolean;
  style?: CSSProperties;
  onViewChange: (view: CalendarView) => void;
  onCursorChange: (cursor: CalendarCursor) => void;
  onFocusedIsoChange: (iso: string) => void;
  onPickDay: (iso: string) => void;
  onClose: (restoreInput: boolean) => void;
};

export const CalendarPopover = forwardRef<HTMLDivElement, CalendarPopoverProps>(
  function CalendarPopover(
    {
      id,
      view,
      cursor,
      selectedIso,
      focusedIso,
      todayIso,
      min,
      max,
      modal = false,
      style,
      onViewChange,
      onCursorChange,
      onFocusedIsoChange,
      onPickDay,
      onClose,
    },
    forwardedRef,
  ) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const todayYear = parseIsoDate(todayIso)?.year ?? cursor.year;
    const bounds = yearRange(min, max, todayYear);
    const years = yearPage(cursor.year, bounds.start, bounds.end);

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }
      const active = document.activeElement;
      const lostToDocument =
        active === document.body || active === document.documentElement;
      const insideDialog =
        active instanceof HTMLElement && dialog.contains(active);
      if (!insideDialog && !lostToDocument) {
        return;
      }
      const selector =
        view === 'days'
          ? `[data-iso="${focusedIso}"]`
          : view === 'months'
            ? `[data-month="${cursor.month}"]`
            : `[data-year="${cursor.year}"]`;
      dialog.querySelector<HTMLElement>(selector)?.focus();
    }, [view, focusedIso, cursor.month, cursor.year]);

    function focusIso(iso: string) {
      const parsed = parseIsoDate(iso);
      if (parsed) {
        onCursorChange({ year: parsed.year, month: parsed.month });
      }
      onFocusedIsoChange(iso);
    }

    function moveBy(days: number) {
      focusIso(nearestEnabledIso(focusedIso, days, min, max));
    }

    function moveMonth(delta: number) {
      const parsed = parseIsoDate(focusedIso);
      if (!parsed) {
        return;
      }
      const next = shiftMonth(parsed.year, parsed.month, delta);
      const iso = toClampedIsoDate(next.year, next.month, parsed.day);
      focusIso(
        isIsoOutOfRange(iso, min, max)
          ? nearestEnabledIso(iso, delta > 0 ? 1 : -1, min, max)
          : iso,
      );
    }

    function moveToWeekEdge(toEnd: boolean) {
      const start = startOfIsoWeek(focusedIso);
      const edge = toEnd ? shiftIsoDate(start, 6) : start;
      focusIso(
        isIsoOutOfRange(edge, min, max)
          ? nearestEnabledIso(edge, toEnd ? -1 : 1, min, max)
          : edge,
      );
    }

    function step(delta: number) {
      if (view === 'days') {
        const next = shiftMonth(cursor.year, cursor.month, delta);
        if (monthDisabled(next.year, next.month, bounds, min, max)) {
          return;
        }
        onCursorChange(next);
        const parsed = parseIsoDate(focusedIso);
        const iso = toClampedIsoDate(
          next.year,
          next.month,
          parsed?.day ?? 1,
        );
        onFocusedIsoChange(
          isIsoOutOfRange(iso, min, max)
            ? nearestEnabledIso(iso, delta > 0 ? 1 : -1, min, max)
            : iso,
        );
        return;
      }
      if (view === 'months') {
        const nextYear = cursor.year + delta;
        if (yearDisabled(nextYear, bounds, min, max)) {
          return;
        }
        onCursorChange({ ...cursor, year: nextYear });
        return;
      }
      onCursorChange({
        ...cursor,
        year: Math.min(
          Math.max(cursor.year + delta * YEARS_PER_PAGE, bounds.start),
          bounds.end,
        ),
      });
    }

    const prevMonth = shiftMonth(cursor.year, cursor.month, -1);
    const nextMonth = shiftMonth(cursor.year, cursor.month, 1);
    const prevDisabled =
      view === 'years'
        ? cursor.year - YEARS_PER_PAGE < bounds.start
        : view === 'months'
          ? yearDisabled(cursor.year - 1, bounds, min, max)
          : monthDisabled(prevMonth.year, prevMonth.month, bounds, min, max);
    const nextDisabled =
      view === 'years'
        ? cursor.year + 1 > bounds.end
        : view === 'months'
          ? yearDisabled(cursor.year + 1, bounds, min, max)
          : monthDisabled(nextMonth.year, nextMonth.month, bounds, min, max);

    const prevLabel =
      view === 'years'
        ? 'Предыдущие годы'
        : view === 'months'
          ? 'Предыдущий год'
          : 'Предыдущий месяц';
    const nextLabel =
      view === 'years'
        ? 'Следующие годы'
        : view === 'months'
          ? 'Следующий год'
          : 'Следующий месяц';

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      const dialog = dialogRef.current;
      if (modal && dialog) {
        trapTabKey(event.nativeEvent, dialog);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose(true);
        return;
      }
      if (view === 'months') {
        moveGridFocus(event, '[data-month]', 3);
        return;
      }
      if (view === 'years') {
        moveGridFocus(event, '[data-year]', 4);
        return;
      }
      const inGrid =
        event.target instanceof HTMLElement &&
        event.target.closest('[role="grid"]');
      if (!inGrid) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveBy(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveBy(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveBy(-7);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveBy(7);
      } else if (event.key === 'Home') {
        event.preventDefault();
        moveToWeekEdge(false);
      } else if (event.key === 'End') {
        event.preventDefault();
        moveToWeekEdge(true);
      } else if (event.key === 'PageUp') {
        event.preventDefault();
        moveMonth(-1);
      } else if (event.key === 'PageDown') {
        event.preventDefault();
        moveMonth(1);
      }
    }

    return (
      <div
        ref={(node) => {
          dialogRef.current = node;
          assignRef(forwardedRef, node);
        }}
        className={styles.popover}
        role="dialog"
        id={id}
        aria-label="Календарь"
        aria-modal={modal || undefined}
        style={style}
        onKeyDown={onKeyDown}
      >
        <div className={styles.header}>
          <button
            className={styles.navButton}
            type="button"
            aria-label={prevLabel}
            disabled={prevDisabled}
            onClick={() => step(-1)}
          >
            ‹
          </button>
          <div className={styles.caption}>
            <button
              className={styles.captionButton}
              type="button"
              aria-label="Выбрать месяц"
              aria-pressed={view === 'months'}
              onClick={() =>
                onViewChange(view === 'months' ? 'days' : 'months')
              }
            >
              {MONTH_NAMES[cursor.month - 1]}
            </button>
            <button
              className={styles.captionButton}
              type="button"
              aria-label="Выбрать год"
              aria-pressed={view === 'years'}
              onClick={() => onViewChange(view === 'years' ? 'days' : 'years')}
            >
              {cursor.year}
            </button>
          </div>
          <button
            className={styles.navButton}
            type="button"
            aria-label={nextLabel}
            disabled={nextDisabled}
            onClick={() => step(1)}
          >
            ›
          </button>
        </div>

        {view === 'days' ? (
          <CalendarDaysView
            year={cursor.year}
            month={cursor.month}
            selectedIso={selectedIso}
            focusedIso={focusedIso}
            todayIso={todayIso}
            min={min}
            max={max}
            onPickDay={onPickDay}
          />
        ) : null}

        {view === 'months' ? (
          <CalendarMonthsView
            cursor={cursor}
            focusedIso={focusedIso}
            bounds={bounds}
            min={min}
            max={max}
            onCursorChange={onCursorChange}
            onFocusedIsoChange={onFocusedIsoChange}
            onViewChange={onViewChange}
          />
        ) : null}

        {view === 'years' ? (
          <CalendarYearsView
            years={years}
            cursor={cursor}
            focusedIso={focusedIso}
            bounds={bounds}
            min={min}
            max={max}
            onCursorChange={onCursorChange}
            onFocusedIsoChange={onFocusedIsoChange}
            onViewChange={onViewChange}
          />
        ) : null}
      </div>
    );
  },
);
CalendarPopover.displayName = 'CalendarPopover';
