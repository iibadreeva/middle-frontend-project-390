export type { Airline, Flight, FlightSearchArgs, Money } from './model/types';
export { formatDuration, formatPrice, totalMoney } from './lib/format';
export {
  flightApi,
  getFlight,
  getFlights,
  useGetFlightQuery,
  useGetFlightsQuery,
} from './api';
