import { describe, expect, it } from 'vitest';
import {
  IsoDateSchema,
  IsoDateTimeSchema,
  NonNegativeInt32Schema,
} from './openApiSchemas';

describe('IsoDateSchema', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(IsoDateSchema.safeParse('1990-05-20').success).toBe(true);
  });

  it('rejects a dotted date', () => {
    expect(IsoDateSchema.safeParse('20.05.1990').success).toBe(false);
  });
});

describe('IsoDateTimeSchema', () => {
  it('accepts a UTC date-time with Z', () => {
    expect(IsoDateTimeSchema.safeParse('2026-07-01T08:00:00Z').success).toBe(
      true,
    );
  });

  it('accepts RFC 3339 offsets', () => {
    expect(
      IsoDateTimeSchema.safeParse('2026-07-01T11:00:00+03:00').success,
    ).toBe(true);
    expect(
      IsoDateTimeSchema.safeParse('2026-07-01T08:00:00+00:00').success,
    ).toBe(true);
  });

  it('rejects a date-time without a timezone offset', () => {
    expect(IsoDateTimeSchema.safeParse('2026-07-01T08:00:00').success).toBe(
      false,
    );
  });

  it('accepts fractional seconds', () => {
    expect(
      IsoDateTimeSchema.safeParse('2026-07-01T08:00:00.123Z').success,
    ).toBe(true);
  });
});

describe('NonNegativeInt32Schema', () => {
  it('accepts zero and int32 max', () => {
    expect(NonNegativeInt32Schema.safeParse(0).success).toBe(true);
    expect(NonNegativeInt32Schema.safeParse(2_147_483_647).success).toBe(true);
  });

  it('rejects negatives, fractions, and values above int32', () => {
    expect(NonNegativeInt32Schema.safeParse(-1).success).toBe(false);
    expect(NonNegativeInt32Schema.safeParse(1.5).success).toBe(false);
    expect(NonNegativeInt32Schema.safeParse(2_147_483_648).success).toBe(false);
  });
});
