import { CitySchema } from '@entities/city';
import { z } from 'zod';

export const MoneySchema = z.object({
  amount: z.number(),
  currency: z.string(),
});

export const AirlineSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export const FlightSchema = z.object({
  id: z.string(),
  flightNumber: z.string(),
  airline: AirlineSchema,
  origin: CitySchema,
  destination: CitySchema,
  departureAt: z.string(),
  arrivalAt: z.string(),
  durationMinutes: z.number(),
  price: MoneySchema,
  seatsAvailable: z.number(),
});

export const FlightsResponseSchema = z.array(FlightSchema);

export type Money = z.infer<typeof MoneySchema>;
export type Airline = z.infer<typeof AirlineSchema>;
export type Flight = z.infer<typeof FlightSchema>;
