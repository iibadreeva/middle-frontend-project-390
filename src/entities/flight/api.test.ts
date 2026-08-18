import { describe, expect, it } from 'vitest';
import { FLIGHT_LOAD_ERROR, FLIGHTS_SEARCH_ERROR } from '@shared/lib/messages';
import { getQueryErrorPolicy } from '@shared/store/queryErrorPolicy';
import { flightApi } from './api';

describe('flight query error policy', () => {
  it('registers search and load error messages', () => {
    expect(getQueryErrorPolicy(flightApi.endpoints.getFlights.name)).toEqual({
      message: FLIGHTS_SEARCH_ERROR,
    });
    expect(getQueryErrorPolicy(flightApi.endpoints.getFlight.name)).toEqual({
      message: FLIGHT_LOAD_ERROR,
    });
  });
});
