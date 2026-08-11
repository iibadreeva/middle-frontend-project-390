import styles from './Page.module.css';

export function SearchPage() {
  return (
    <section className={styles.page} data-testid="search-page">
      <h1 className={styles.title} data-testid="home-heading">
        Поиск рейсов
      </h1>
      <p className={styles.placeholder} data-testid="search-placeholder">
        Здесь будет форма поиска: города из /api/cities, дата и число пассажиров.
      </p>
    </section>
  );
}
