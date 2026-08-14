import { createSearchSchema, type SearchFormValues } from './searchSchema';

/** Совместимость для хуков вне RHF (например, useFlightSearch). */
export function validateSearchValues(
  values: SearchFormValues,
  timeZone: string,
): string | null {
  const result = createSearchSchema({ timeZone }).safeParse(values);
  if (result.success) {
    return null;
  }

  return result.error.issues[0]?.message ?? null;
}
