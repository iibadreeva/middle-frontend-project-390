import { z } from 'zod';
import { isValidIsoDate, todayIsoDate } from '@shared/lib/format';
import {
  SEARCH_CITY_REQUIRED_ERROR,
  SEARCH_DATE_PAST_ERROR,
  SEARCH_DATE_REQUIRED_ERROR,
  SEARCH_PASSENGERS_ERROR,
} from '@shared/lib/messages';

export type SearchSchemaOptions = {
  timeZone: string;
};

export function createSearchSchema({ timeZone }: SearchSchemaOptions) {
  return z
    .object({
      origin: z.string().min(1, { message: SEARCH_CITY_REQUIRED_ERROR }),
      destination: z.string().min(1, { message: SEARCH_CITY_REQUIRED_ERROR }),
      date: z
        .string()
        .trim()
        .min(1, { message: SEARCH_DATE_REQUIRED_ERROR })
        .refine((value) => isValidIsoDate(value), {
          message: SEARCH_DATE_REQUIRED_ERROR,
        })
        .refine((value) => value >= todayIsoDate(timeZone), {
          message: SEARCH_DATE_PAST_ERROR,
        }),
      passengers: z
        .number({ error: SEARCH_PASSENGERS_ERROR })
        .refine(
          (value) =>
            Number.isFinite(value) &&
            Number.isInteger(value) &&
            value >= 1 &&
            value <= 9,
          { message: SEARCH_PASSENGERS_ERROR },
        ),
    });
}

export type SearchFormValues = z.infer<ReturnType<typeof createSearchSchema>>;
