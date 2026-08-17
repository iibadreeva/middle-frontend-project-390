export type { Airline, Flight, Money } from './schemas';

export type FlightSearchArgs = {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
};
