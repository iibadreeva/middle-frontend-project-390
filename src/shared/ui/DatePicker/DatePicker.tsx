import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ChangeEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { assignRef } from './assignRef';
import { CalendarButton } from './CalendarButton';
import { CalendarPopover, type CalendarView } from './CalendarPopover';
import {
  asIsoBound,
  isIsoOutOfRange,
  isMonthOutOfRange,
  localTodayIso,
  parseIsoDate,
} from './calendar';
import { getTabbable } from './focusTrap';
import { useCalendarPopover } from './useCalendarPopover';
import { useCoarsePointer } from './useCoarsePointer';
import styles from './DatePicker.module.css';

export type DatePickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  type?: 'date';
  /** Календарный «сегодня» (YYYY-MM-DD); по умолчанию локальная дата. */
  today?: string;
};

function cursorFromValue(
  value: string,
  min: string | undefined,
  max: string | undefined,
): { year: number; month: number } {
  const fallback = parseIsoDate(localTodayIso());
  const parsed =
    parseIsoDate(value) ?? parseIsoDate(min ?? '') ?? fallback;
  const year = parsed?.year ?? new Date().getFullYear();
  const month = parsed?.month ?? 1;

  if (!isMonthOutOfRange(year, month, min, max)) {
    return { year, month };
  }

  const minParsed = parseIsoDate(min ?? '');
  if (minParsed && !isMonthOutOfRange(minParsed.year, minParsed.month, min, max)) {
    return { year: minParsed.year, month: minParsed.month };
  }

  const maxParsed = parseIsoDate(max ?? '');
  if (maxParsed) {
    return { year: maxParsed.year, month: maxParsed.month };
  }

  return { year, month };
}

function commitInputValue(input: HTMLInputElement, next: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(input, next);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function initialFocusedIso(
  selected: string,
  todayIso: string,
  min: string | undefined,
  max: string | undefined,
): string {
  if (selected && !isIsoOutOfRange(selected, min, max)) {
    return selected;
  }
  if (!isIsoOutOfRange(todayIso, min, max)) {
    return todayIso;
  }
  return min ?? max ?? todayIso;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker(
    {
      className,
      disabled,
      min,
      max,
      today,
      onChange,
      onBlur,
      onClick,
      onKeyDown,
      onMouseDown,
      id,
      ...inputProps
    },
    forwardedRef,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const restoreFocusRef = useRef(false);
    const pickingRef = useRef(false);
    const dialogId = useId();
    const minStr = asIsoBound(min);
    const maxStr = asIsoBound(max);
    const todayIso = asIsoBound(today) ?? localTodayIso();
    const isControlled = inputProps.value !== undefined;
    const controlledIso = asIsoBound(inputProps.value) ?? '';
    const initialValue = isControlled
      ? controlledIso
      : (asIsoBound(inputProps.defaultValue) ?? '');
    const nativePicker = useCoarsePointer();

    const [open, setOpen] = useState(false);
    const [view, setView] = useState<CalendarView>('days');
    const [cursor, setCursor] = useState(() =>
      cursorFromValue(initialValue, minStr, maxStr),
    );
    const [selectedIso, setSelectedIso] = useState(initialValue);
    const [focusedIso, setFocusedIso] = useState(() =>
      initialFocusedIso(initialValue, todayIso, minStr, maxStr),
    );
    const [focusGrid, setFocusGrid] = useState(false);
    const [modal, setModal] = useState(false);

    function closeCalendar(restoreInput: boolean) {
      setOpen(false);
      setView('days');
      setFocusGrid(false);
      setModal(false);
      restoreFocusRef.current = restoreInput;
    }

    function openCalendar(asModal = false) {
      if (disabled || nativePicker) {
        return;
      }
      const current = inputRef.current?.value ?? selectedIso;
      setSelectedIso(current);
      setCursor(cursorFromValue(current, minStr, maxStr));
      setFocusedIso(initialFocusedIso(current, todayIso, minStr, maxStr));
      setView('days');
      setOpen(true);
      setModal(asModal);
      setFocusGrid(asModal);
    }

    useEffect(() => {
      if (!isControlled) {
        return;
      }
      setSelectedIso(controlledIso);
      setCursor(cursorFromValue(controlledIso, minStr, maxStr));
      setFocusedIso(initialFocusedIso(controlledIso, todayIso, minStr, maxStr));
    }, [controlledIso, isControlled, maxStr, minStr, todayIso]);

    const coords = useCalendarPopover({
      open,
      modal,
      nativePicker,
      view,
      cursorYear: cursor.year,
      cursorMonth: cursor.month,
      focusedIso,
      focusGrid,
      rootRef,
      popoverRef,
      inputRef,
      restoreFocusRef,
      onClose: closeCalendar,
      onNativePicker: () => {
        setOpen(false);
        setView('days');
        setFocusGrid(false);
        setModal(false);
      },
      onFocusGridConsumed: () => setFocusGrid(false),
    });

    function handleMouseDown(event: MouseEvent<HTMLInputElement>) {
      onMouseDown?.(event);
      if (event.defaultPrevented || disabled || nativePicker || event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.currentTarget.focus();
      openCalendar();
    }

    function handleClick(event: MouseEvent<HTMLInputElement>) {
      onClick?.(event);
      if (event.defaultPrevented || disabled || nativePicker) {
        return;
      }
      event.preventDefault();
      openCalendar();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || nativePicker) {
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (open) {
          setModal(true);
          popoverRef.current
            ?.querySelector<HTMLElement>(`[data-iso="${focusedIso}"]`)
            ?.focus();
        } else {
          openCalendar(true);
        }
        return;
      }
      if (event.key === 'Tab' && open && !event.shiftKey) {
        const dialog = popoverRef.current;
        if (!dialog) {
          return;
        }
        event.preventDefault();
        setModal(true);
        const day = dialog.querySelector<HTMLElement>(
          `[data-iso="${focusedIso}"]`,
        );
        (day ?? getTabbable(dialog)[0])?.focus();
        return;
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        closeCalendar(true);
      }
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      onChange?.(event);
      if (open && !pickingRef.current) {
        closeCalendar(false);
      }
    }

    function pickDay(iso: string) {
      if (isIsoOutOfRange(iso, minStr, maxStr) || disabled) {
        return;
      }
      const input = inputRef.current;
      pickingRef.current = true;
      if (input) {
        commitInputValue(input, iso);
      }
      pickingRef.current = false;
      setSelectedIso(iso);
      closeCalendar(true);
    }

    const inputClassName = [styles.input, className].filter(Boolean).join(' ');
    const calendar = open && !nativePicker ? (
      <CalendarPopover
        ref={popoverRef}
        id={dialogId}
        view={view}
        cursor={cursor}
        selectedIso={selectedIso}
        focusedIso={focusedIso}
        todayIso={todayIso}
        min={minStr}
        max={maxStr}
        modal={modal}
        style={{ top: coords.top, left: coords.left }}
        onViewChange={setView}
        onCursorChange={setCursor}
        onFocusedIsoChange={setFocusedIso}
        onPickDay={pickDay}
        onClose={closeCalendar}
      />
    ) : null;

    return (
      <div
        ref={rootRef}
        className={nativePicker ? `${styles.root} ${styles.nativePicker}` : styles.root}
      >
        <input
          {...inputProps}
          ref={(node) => {
            inputRef.current = node;
            assignRef(forwardedRef, node);
          }}
          id={id}
          type="date"
          min={min}
          max={max}
          disabled={disabled}
          className={inputClassName}
          aria-haspopup={nativePicker ? undefined : 'dialog'}
          aria-expanded={nativePicker ? undefined : open}
          aria-controls={open ? dialogId : undefined}
          onChange={handleChange}
          onBlur={onBlur}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
        />
        {nativePicker ? null : (
          <CalendarButton
            open={open}
            dialogId={dialogId}
            disabled={disabled}
            onOpen={() => openCalendar(true)}
          />
        )}
        {calendar ? createPortal(calendar, document.body) : null}
      </div>
    );
  },
);
DatePicker.displayName = 'DatePicker';
