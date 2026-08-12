import { NavLink, Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.shell} data-testid="app">
      <header className={styles.header} data-testid="app-header">
        <h1 className={styles.title} data-testid="home-heading">
          Бронирование авиабилетов
        </h1>
        <nav
          className={styles.nav}
          aria-label="Основная навигация"
          data-testid="app-nav"
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            end
            data-testid="nav-search"
          >
            Поиск рейсов
          </NavLink>
          <NavLink
            to="/bookings"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            data-testid="nav-bookings"
          >
            Мои брони
          </NavLink>
        </nav>
      </header>
      <main className={styles.main} data-testid="app-main">
        <Outlet />
      </main>
    </div>
  );
}
