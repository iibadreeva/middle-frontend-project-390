import { describe, expect, it } from 'vitest';
import { cityApi } from '@entities/city';
import { createTestStore } from './store';

describe('createTestStore', () => {
  it('seeds getCities cache for injected endpoint', () => {
    const cities = [
      {
        code: 'SVX',
        name: 'Екатеринбург',
        timeZone: 'Asia/Yekaterinburg',
      },
    ];
    const store = createTestStore({ cities });
    const selected = cityApi.endpoints.getCities.select(undefined)(
      store.getState(),
    );
    expect(selected.data).toEqual(cities);
    expect(selected.status).toBe('fulfilled');
  });
});
