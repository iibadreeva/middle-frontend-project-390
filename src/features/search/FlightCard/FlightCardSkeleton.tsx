import styles from './FlightCard.module.css';

/** Плейсхолдер карточки рейса в списке результатов поиска. */
export function FlightCardSkeleton() {
  return (
    <article
      className={styles.card}
      data-testid="flight-card-skeleton"
      aria-hidden="true"
    >
      <div className={styles.main}>
        <span className={`${styles.bone} ${styles.boneAirline}`} />
        <span className={`${styles.bone} ${styles.boneRoute}`} />
        <span className={`${styles.bone} ${styles.boneSchedule}`} />
        <span className={`${styles.bone} ${styles.boneSeats}`} />
      </div>
      <div className={styles.aside}>
        <span className={`${styles.bone} ${styles.bonePrice}`} />
        <span className={`${styles.bone} ${styles.boneBook}`} />
      </div>
    </article>
  );
}
