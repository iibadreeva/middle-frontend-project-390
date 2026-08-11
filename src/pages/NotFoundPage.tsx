import { Link } from 'react-router-dom';
import styles from './Page.module.css';

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Страница не найдена</h1>
      <p className={styles.placeholder}>
        Такой страницы нет. <Link to="/">Вернуться к поиску</Link>.
      </p>
    </section>
  );
}
