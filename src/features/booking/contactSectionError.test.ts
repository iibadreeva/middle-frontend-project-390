import { describe, expect, it } from 'vitest';
import {
  BOOKING_EMAIL_ERROR,
  BOOKING_PHONE_ERROR,
  BOOKING_REQUIRED_ERROR,
} from '@shared/lib/messages';
import { contactSectionMessage } from './contactSectionError';

describe('contactSectionMessage', () => {
  it('is undefined when both messages are missing', () => {
    expect(contactSectionMessage(undefined, undefined)).toBeUndefined();
  });

  it('returns the only present message', () => {
    expect(contactSectionMessage(BOOKING_EMAIL_ERROR, undefined)).toBe(
      BOOKING_EMAIL_ERROR,
    );
    expect(contactSectionMessage(undefined, BOOKING_PHONE_ERROR)).toBe(
      BOOKING_PHONE_ERROR,
    );
  });

  it('returns a shared required message once', () => {
    expect(
      contactSectionMessage(BOOKING_REQUIRED_ERROR, BOOKING_REQUIRED_ERROR),
    ).toBe(BOOKING_REQUIRED_ERROR);
  });

  it('joins distinct email and phone messages', () => {
    expect(
      contactSectionMessage(BOOKING_EMAIL_ERROR, BOOKING_PHONE_ERROR),
    ).toBe(`${BOOKING_EMAIL_ERROR}. ${BOOKING_PHONE_ERROR}`);
  });
});
