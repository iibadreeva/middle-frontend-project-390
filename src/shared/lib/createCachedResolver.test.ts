import { describe, expect, it, vi } from 'vitest';
import type { Resolver } from 'react-hook-form';
import { createCachedResolver } from './createCachedResolver';

type Values = { amount: number };

describe('createCachedResolver', () => {
  it('reuses the resolver while the cache key stays the same', async () => {
    const inner = vi.fn<Resolver<Values>>(async () => ({
      values: { amount: 1 },
      errors: {},
    }));
    const createResolver = vi.fn(() => inner);

    const resolver = createCachedResolver<Values, number>(
      (values) => values.amount,
      createResolver,
    );

    await resolver({ amount: 1 }, undefined, {
      criteriaMode: 'all',
      fields: {},
      shouldUseNativeValidation: false,
    });
    await resolver({ amount: 1 }, undefined, {
      criteriaMode: 'all',
      fields: {},
      shouldUseNativeValidation: false,
    });

    expect(createResolver).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledTimes(2);
  });

  it('rebuilds the resolver when the cache key changes', async () => {
    const createResolver = vi.fn(
      (values: Values): Resolver<Values> =>
        async () => ({
          values,
          errors: {},
        }),
    );

    const resolver = createCachedResolver<Values, number>(
      (values) => values.amount,
      createResolver,
    );

    const options = {
      criteriaMode: 'all' as const,
      fields: {},
      shouldUseNativeValidation: false,
    };

    await resolver({ amount: 1 }, undefined, options);
    await resolver({ amount: 2 }, undefined, options);

    expect(createResolver).toHaveBeenCalledTimes(2);
  });
});
