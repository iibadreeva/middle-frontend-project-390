import { z } from 'zod';

/** OpenAPI `format: date` — YYYY-MM-DD. */
export const IsoDateSchema = z.iso.date();

/** OpenAPI `format: date-time` — RFC 3339 (`Z` or numeric offset). */
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });

/** OpenAPI `int32` + продуктовый floor: цена, длительность и места неотрицательные. */
export const NonNegativeInt32Schema = z.int32().min(0);
