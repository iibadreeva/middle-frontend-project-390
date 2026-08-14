import { Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { BookingPage } from './pages/BookingPage';
import { BookingViewPage } from './pages/BookingViewPage';
import { FlightsRedirect } from './pages/FlightsRedirect';
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
        <Route path={routePaths.bookings} element={<BookingViewPage />} />
        <Route path={routePaths.bookingView} element={<BookingViewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
