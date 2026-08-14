import { useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  useWatch,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';
import type { City } from '@shared/api';
import { searchSchemaForCities } from '../parseSearchForm';
import { resolveTimeZoneByCode } from '@shared/lib/resolveCityTimeZone';
import type { SearchFormValues } from '../resolveSearchValues';
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
  // Resolver должен видеть актуальный список городов без пересоздания useForm.
  // eslint-disable-next-line react-hooks/refs -- актуальный prop в ref для async resolver
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
