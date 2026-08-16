import { Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { BookingsLegacyRedirect } from './pages/BookingsLegacyRedirect';
import { BookingPage } from './pages/BookingPage';
import { FlightsRedirect } from './pages/FlightsRedirect';
import { LookupPage } from './pages/LookupPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SearchPage } from './pages/SearchPage';
import { routePaths } from './routes';

export function App() {
  return (
    <Routes>
      <Route path={routePaths.home} element={<Layout />}>
        <Route index element={<SearchPage />} />
        <Route path={routePaths.flights} element={<FlightsRedirect />} />
        <Route path={routePaths.booking} element={<BookingPage />} />
        <Route path={routePaths.lookup} element={<LookupPage />} />
        <Route
          path={routePaths.bookingsLegacy}
          element={<BookingsLegacyRedirect />}
        />
        <Route
          path={routePaths.bookingViewLegacy}
          element={<BookingsLegacyRedirect />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
