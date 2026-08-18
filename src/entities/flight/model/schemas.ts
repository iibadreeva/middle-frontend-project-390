import { CitySchema } from '@entities/city';
import {
  IsoDateTimeSchema,
  NonNegativeInt32Schema,
} from '@shared/lib/openApiSchemas';
import { z } from 'zod';

export const MoneySchema = z.object({
  amount: NonNegativeInt32Schema,
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
  departureAt: IsoDateTimeSchema,
  arrivalAt: IsoDateTimeSchema,
  durationMinutes: NonNegativeInt32Schema,
  price: MoneySchema,
  seatsAvailable: NonNegativeInt32Schema,
});

export const FlightsResponseSchema = z.array(FlightSchema);

export type Money = z.infer<typeof MoneySchema>;
export type Airline = z.infer<typeof AirlineSchema>;
export type Flight = z.infer<typeof FlightSchema>;
