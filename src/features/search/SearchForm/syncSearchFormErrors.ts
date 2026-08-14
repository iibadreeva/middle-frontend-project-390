import type {
  FieldPath,
  UseFormClearErrors,
  UseFormGetValues,
  UseFormSetError,
} from 'react-hook-form';
import type { City } from '@shared/api';
import { parseSearchForm } from '../parseSearchForm';
import type { SearchFormValues } from '../resolveSearchValues';

export function citiesKeyOf(cities: City[]): string {
  return cities.map((city) => city.code).join('|');
}

/**
 * Синхронно выставляет field errors — без мигания на первом paint (в отличие от trigger()).
 * Та же `parseSearchForm` / `searchSchemaForCities`, что и у resolver в useSearchForm.
 */
export function syncSearchFormErrors(
  getValues: UseFormGetValues<SearchFormValues>,
  clearErrors: UseFormClearErrors<SearchFormValues>,
  setError: UseFormSetError<SearchFormValues>,
  cities: City[],
) {
  const values = getValues();
  const result = parseSearchForm(values, cities);

  clearErrors();
  if (result.success) {
    return;
  }

  for (const issue of result.error.issues) {
    if (issue.path.length === 0) {
      continue;
    }
    const name = issue.path.join('.') as FieldPath<SearchFormValues>;
    setError(name, { type: 'validate', message: issue.message });
  }
}
