import { parseIsoDate, toClampedIsoDate } from './calendar';
import {
  yearDisabled,
  type CalendarCursor,
  type CalendarView,
  type YearBounds,
} from './calendarGrid';
import styles from './DatePicker.module.css';

type CalendarYearsViewProps = {
  years: number[];
  cursor: CalendarCursor;
  focusedIso: string;
  bounds: YearBounds;
  min?: string;
  max?: string;
  onCursorChange: (cursor: CalendarCursor) => void;
  onFocusedIsoChange: (iso: string) => void;
  onViewChange: (view: CalendarView) => void;
};

export function CalendarYearsView({
  years,
  cursor,
  focusedIso,
  bounds,
  min,
  max,
  onCursorChange,
  onFocusedIsoChange,
  onViewChange,
}: CalendarYearsViewProps) {
  return (
    <div className={styles.years}>
      {years.map((year) => {
        const selected = year === cursor.year;
        return (
          <button
            key={year}
            className={[styles.year, selected ? styles.selected : undefined]
              .filter(Boolean)
              .join(' ')}
            type="button"
            data-year={year}
            disabled={yearDisabled(year, bounds, min, max)}
            aria-pressed={selected}
            onClick={() => {
              onCursorChange({ ...cursor, year });
              const parsed = parseIsoDate(focusedIso);
              const iso = toClampedIsoDate(
                year,
                parsed?.month ?? cursor.month,
                parsed?.day ?? 1,
              );
              onFocusedIsoChange(iso);
              onViewChange('days');
            }}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}
