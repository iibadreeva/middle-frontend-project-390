import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  useWatch,
  type UseFormReturn,
} from 'react-hook-form';
import type { City } from '@shared/api';
import { useLatestRef } from '@shared/hooks/useLatestRef';
import { createCachedResolver } from '@shared/lib/createCachedResolver';
import {
  searchFormResolverCacheKey,
  searchSchemaForCities,
} from '../parseSearchForm';
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
  // Resolver видит актуальный список городов без пересоздания useForm.
  const citiesRef = useLatestRef(cities);
  const onSubmitRef = useLatestRef(onSubmit);

  // Resolver и syncSearchFormErrors делят searchSchemaForCities / parseSearchForm.
  const resolver = useMemo(
    () =>
      createCachedResolver<SearchFormValues, string>(
        (formValues) =>
          searchFormResolverCacheKey(citiesRef.current, formValues.origin),
        (formValues) =>
          zodResolver(
            searchSchemaForCities(citiesRef.current, formValues.origin),
          ),
      ),
    [citiesRef],
  );

  const form = useForm<SearchFormValues>({
    defaultValues: values,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    resolver,
  });

  useSearchFormSync(form, values, cities);

  const origin = useWatch({ control: form.control, name: 'origin' });
  const originZone = resolveTimeZoneByCode(cities, origin);

  const submit = form.handleSubmit((nextValues) => {
    onSubmitRef.current?.(nextValues);
  });

  return { form, originZone, submit };
}
