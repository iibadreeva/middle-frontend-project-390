import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { BookingPage } from './pages/BookingPage';
import { BookingViewPage } from './pages/BookingViewPage';
import { FlightsPage } from './pages/FlightsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SearchPage } from './pages/SearchPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<SearchPage />} />
        <Route path="flights" element={<FlightsPage />} />
        <Route path="booking/:flightId" element={<BookingPage />} />
        <Route path="bookings" element={<BookingViewPage />} />
        <Route
          path="bookings/:code/confirmation"
          element={<BookingConfirmationPage />}
        />
        <Route path="bookings/:code" element={<BookingViewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
