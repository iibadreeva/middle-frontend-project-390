import { useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  useWatch,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';
import type { City } from '../../api';
import { searchSchemaForCities } from '../../lib/parseSearchForm';
import { resolveTimeZoneByCode } from '../../lib/resolveCityTimeZone';
import type { SearchFormValues } from '../../lib/resolveSearchValues';
import { useSearchFormSync } from './useSearchFormSync';

export type UseSearchFormResult = {
  form: UseFormReturn<SearchFormValues>;
  originZone: string;
  submit: ReturnType<UseFormReturn<SearchFormValues>['handleSubmit']>;
};

export function useSearchForm(
  values: SearchFormValues,
  cities: City[],
  onSubmit?: (values: SearchFormValues) => void,
): UseSearchFormResult {
  const citiesRef = useRef(cities);
  citiesRef.current = cities;

  const resolverCacheRef = useRef<{
    timeZone: string;
    resolver: Resolver<SearchFormValues>;
  } | null>(null);

  // Resolver и syncSearchFormErrors делят searchSchemaForCities / parseSearchForm.
  const form = useForm<SearchFormValues>({
    defaultValues: values,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    resolver: async (formValues, context, options) => {
      const timeZone = resolveTimeZoneByCode(
        citiesRef.current,
        formValues.origin,
      );
      const cached = resolverCacheRef.current;
      if (cached && cached.timeZone === timeZone) {
        return cached.resolver(formValues, context, options);
      }

      const resolver = zodResolver(
        searchSchemaForCities(citiesRef.current, formValues.origin),
      );
      resolverCacheRef.current = { timeZone, resolver };
      return resolver(formValues, context, options);
    },
  });

  useSearchFormSync(form, values, cities);

  const origin = useWatch({ control: form.control, name: 'origin' });
  const originZone = resolveTimeZoneByCode(cities, origin);

  const submit = form.handleSubmit((nextValues) => {
    onSubmit?.(nextValues);
  });

  return { form, originZone, submit };
}
