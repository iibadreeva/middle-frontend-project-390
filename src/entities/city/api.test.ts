import { describe, expect, it } from 'vitest';
import { getQueryErrorPolicy } from '@shared/store/queryErrorPolicy';
import { cityApi } from './api';

describe('city query error policy', () => {
  it('registers getCities as a silent toast endpoint', () => {
    expect(getQueryErrorPolicy(cityApi.endpoints.getCities.name)).toEqual({
      silent: true,
    });
  });
});
