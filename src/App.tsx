import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BookingPage } from './pages/BookingPage';
import { BookingViewPage } from './pages/BookingViewPage';
import { FlightsRedirect } from './pages/FlightsRedirect';
import { NotFoundPage } from './pages/NotFoundPage';
import { SearchPage } from './pages/SearchPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<SearchPage />} />
        <Route path="flights" element={<FlightsRedirect />} />
        <Route path="booking/:flightId" element={<BookingPage />} />
        <Route path="bookings" element={<BookingViewPage />} />
        <Route path="bookings/:code" element={<BookingViewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
