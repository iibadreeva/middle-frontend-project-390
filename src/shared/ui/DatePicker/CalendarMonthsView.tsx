import { MONTH_NAMES, toClampedIsoDate, parseIsoDate } from './calendar';
import {
  monthDisabled,
  type CalendarCursor,
  type CalendarView,
  type YearBounds,
} from './calendarGrid';
import styles from './DatePicker.module.css';

type CalendarMonthsViewProps = {
  cursor: CalendarCursor;
  focusedIso: string;
  bounds: YearBounds;
  min?: string;
  max?: string;
  onCursorChange: (cursor: CalendarCursor) => void;
  onFocusedIsoChange: (iso: string) => void;
  onViewChange: (view: CalendarView) => void;
};

export function CalendarMonthsView({
  cursor,
  focusedIso,
  bounds,
  min,
  max,
  onCursorChange,
  onFocusedIsoChange,
  onViewChange,
}: CalendarMonthsViewProps) {
  return (
    <div className={styles.months}>
      {MONTH_NAMES.map((name, index) => {
        const month = index + 1;
        const selected = month === cursor.month;
        return (
          <button
            key={name}
            className={[styles.month, selected ? styles.selected : undefined]
              .filter(Boolean)
              .join(' ')}
            type="button"
            data-month={month}
            disabled={monthDisabled(cursor.year, month, bounds, min, max)}
            aria-pressed={selected}
            onClick={() => {
              onCursorChange({ ...cursor, month });
              const parsed = parseIsoDate(focusedIso);
              const iso = toClampedIsoDate(
                cursor.year,
                month,
                parsed?.day ?? 1,
              );
              onFocusedIsoChange(iso);
              onViewChange('days');
            }}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
