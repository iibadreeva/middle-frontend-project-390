import type { FieldValues, Resolver } from 'react-hook-form';

/**
 * Resolver с кэшем по ключу: `useForm` берёт resolver только при mount,
 * поэтому фабрика схемы должна читать актуальные данные сама (обычно из ref).
 */
export function createCachedResolver<TFieldValues extends FieldValues, TKey>(
  getCacheKey: (values: TFieldValues) => TKey,
  createResolver: (values: TFieldValues) => Resolver<TFieldValues>,
): Resolver<TFieldValues> {
  let cache: { key: TKey; resolver: Resolver<TFieldValues> } | null = null;

  return async (values, context, options) => {
    const key = getCacheKey(values);
    if (cache !== null && Object.is(cache.key, key)) {
      return cache.resolver(values, context, options);
    }

    const resolver = createResolver(values);
    cache = { key, resolver };
    return resolver(values, context, options);
  };
}
