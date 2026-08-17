import { z } from 'zod';

export const CitySchema = z.object({
  code: z.string(),
  name: z.string(),
  country: z.string().optional(),
  /** IANA-зона, напр. Europe/Moscow. Опционально; если нет — клиентский словарь. */
  timeZone: z.string().optional(),
});

export const CitiesResponseSchema = z.array(CitySchema);

export type City = z.infer<typeof CitySchema>;
