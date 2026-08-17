export type { Airline, Flight, FlightSearchArgs, Money } from './model/types';
export {
  AirlineSchema,
  FlightSchema,
  FlightsResponseSchema,
  MoneySchema,
} from './model/schemas';
export { formatDuration, formatPrice, totalMoney } from './lib/format';
export {
  flightApi,
  getFlight,
  getFlights,
  useGetFlightQuery,
  useGetFlightsQuery,
} from './api';
