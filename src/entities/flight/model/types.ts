import type { City } from '@entities/city';

export type Money = {
  amount: number;
  currency: string;
};

export type Airline = {
  code: string;
  name: string;
};

export type Flight = {
  id: string;
  flightNumber: string;
  airline: Airline;
  origin: City;
  destination: City;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  /** Цена за одного пассажира, см. contract/openapi.yaml. */
  price: Money;
  seatsAvailable: number;
};

export type FlightSearchArgs = {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
};
