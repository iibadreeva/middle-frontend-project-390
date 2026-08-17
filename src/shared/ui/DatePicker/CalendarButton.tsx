import styles from './DatePicker.module.css';

type CalendarButtonProps = {
  open: boolean;
  dialogId: string;
  disabled?: boolean;
  onOpen: () => void;
};

export function CalendarButton({
  open,
  dialogId,
  disabled,
  onOpen,
}: CalendarButtonProps) {
  return (
    <button
      className={styles.calendarButton}
      type="button"
      aria-label="Открыть календарь"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? dialogId : undefined}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onOpen}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
      >
        <rect
          x="1.5"
          y="2.5"
          width="13"
          height="12"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M1.5 6h13M5 1.5v2.5M11 1.5v2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
