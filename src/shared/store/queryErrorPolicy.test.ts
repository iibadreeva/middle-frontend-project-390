import { afterEach, describe, expect, it } from 'vitest';
import {
  getQueryErrorPolicy,
  isSilentQueryErrorPolicy,
  queryErrorPolicyMessage,
  registerQueryErrorPoliciesFromEndpoints,
  registerQueryErrorPolicy,
  resetQueryErrorPolicies,
} from './queryErrorPolicy';

describe('queryErrorPolicy', () => {
  afterEach(() => {
    resetQueryErrorPolicies();
  });

  it('returns undefined for an unknown endpoint', () => {
    expect(getQueryErrorPolicy('unknown')).toBeUndefined();
  });

  it('returns the registered policy', () => {
    registerQueryErrorPolicy('lookup', { message: 'Lookup failed' });
    expect(getQueryErrorPolicy('lookup')).toEqual({ message: 'Lookup failed' });
  });

  it('overwrites a policy on re-register', () => {
    registerQueryErrorPolicy('lookup', { message: 'first' });
    registerQueryErrorPolicy('lookup', { silent: true });
    expect(getQueryErrorPolicy('lookup')).toEqual({ silent: true });
  });

  it('clears registrations on reset', () => {
    registerQueryErrorPolicy('lookup', { message: 'Lookup failed' });
    resetQueryErrorPolicies();
    expect(getQueryErrorPolicy('lookup')).toBeUndefined();
  });

  it('treats only silent policies as silent', () => {
    expect(isSilentQueryErrorPolicy(undefined)).toBe(false);
    expect(isSilentQueryErrorPolicy({ message: 'Lookup failed' })).toBe(false);
    expect(isSilentQueryErrorPolicy({ silent: true })).toBe(true);
  });

  it('uses the policy message or the fallback', () => {
    expect(queryErrorPolicyMessage(undefined, 'fallback')).toBe('fallback');
    expect(queryErrorPolicyMessage({ silent: true }, 'fallback')).toBe(
      'fallback',
    );
    expect(
      queryErrorPolicyMessage({ message: 'Lookup failed' }, 'fallback'),
    ).toBe('Lookup failed');
  });

  it('registers errorPolicy from injectEndpoints extraOptions', () => {
    registerQueryErrorPoliciesFromEndpoints({
      lookup: {
        extraOptions: { errorPolicy: { message: 'Lookup failed' } },
      },
      getCities: {
        extraOptions: { errorPolicy: { silent: true } },
      },
      skipped: {},
    });

    expect(getQueryErrorPolicy('lookup')).toEqual({ message: 'Lookup failed' });
    expect(getQueryErrorPolicy('getCities')).toEqual({ silent: true });
    expect(getQueryErrorPolicy('skipped')).toBeUndefined();
  });
});
