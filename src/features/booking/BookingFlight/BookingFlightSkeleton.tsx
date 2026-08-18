import styles from './BookingFlight.module.css';

/** Плейсхолдер карточки рейса на время загрузки. */
export function BookingFlightSkeleton() {
  return (
    <div
      className={styles.summary}
      data-testid="booking-flight-loading"
      role="status"
      aria-busy="true"
      aria-label="Загрузка рейса"
    >
      <span
        className={`${styles.bone} ${styles.boneAirline}`}
        aria-hidden="true"
      />
      <div className={styles.body}>
        <div className={styles.main}>
          <span
            className={`${styles.bone} ${styles.boneRoute}`}
            aria-hidden="true"
          />
          <span
            className={`${styles.bone} ${styles.boneSchedule}`}
            aria-hidden="true"
          />
        </div>
        <div className={styles.fares}>
          <span
            className={`${styles.bone} ${styles.bonePrice}`}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
