import {
  MONTH_NAMES,
  WEEKDAY_LABELS,
  buildMonthGrid,
  isIsoOutOfRange,
  weeksOf,
} from './calendar';
import { dayLabel } from './calendarGrid';
import styles from './DatePicker.module.css';

type CalendarDaysViewProps = {
  year: number;
  month: number;
  selectedIso: string;
  focusedIso: string;
  todayIso: string;
  min?: string;
  max?: string;
  onPickDay: (iso: string) => void;
};

export function CalendarDaysView({
  year,
  month,
  selectedIso,
  focusedIso,
  todayIso,
  min,
  max,
  onPickDay,
}: CalendarDaysViewProps) {
  const grid = buildMonthGrid(year, month);

  return (
    <div
      className={styles.grid}
      role="grid"
      aria-label={`${MONTH_NAMES[month - 1]} ${year}`}
    >
      <div className={styles.weekdays} role="row">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className={styles.weekday} role="columnheader">
            {label}
          </span>
        ))}
      </div>
      {weeksOf(grid).map((week) => (
        <div key={week[0]?.iso} className={styles.week} role="row">
          {week.map((cell) => {
            const outOfRange = isIsoOutOfRange(cell.iso, min, max);
            const selected = cell.iso === selectedIso;
            return (
              <div
                key={cell.iso}
                role="gridcell"
                aria-selected={selected}
                aria-current={cell.iso === todayIso ? 'date' : undefined}
              >
                <button
                  className={[
                    styles.day,
                    cell.inMonth ? undefined : styles.outside,
                    selected ? styles.selected : undefined,
                    cell.iso === todayIso && !selected
                      ? styles.today
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="button"
                  data-iso={cell.iso}
                  tabIndex={cell.iso === focusedIso ? 0 : -1}
                  disabled={outOfRange}
                  aria-label={dayLabel(cell.iso)}
                  onClick={() => onPickDay(cell.iso)}
                >
                  {cell.day}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
