import {
  BOOKING_DOB_ERROR,
  BOOKING_EMAIL_ERROR,
  BOOKING_PASSENGERS_ERROR,
  BOOKING_PHONE_ERROR,
  BOOKING_REQUIRED_ERROR,
  BOOKING_SEATS_ERROR,
} from './messages';
import { isValidIsoDate, todayIsoDate } from './format';

export type BookingPassengerValues = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentNumber: string;
};

export type BookingFormValues = {
  email: string;
  phone: string;
  passengers: BookingPassengerValues[];
};

export type BookingValidationOptions = {
  seatsAvailable?: number;
};

export type BookingValidationResult = {
  message: string | null;
  invalidFields: string[];
};

export const MAX_BOOKING_PASSENGERS = 9;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value: string): boolean {
  return value.trim() === '';
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function isFutureIsoDate(value: string): boolean {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return value > todayIsoDate(localZone);
}

export function validateBooking(
  values: BookingFormValues,
  options: BookingValidationOptions = {},
): BookingValidationResult {
  const invalidFields: string[] = [];
  let hasRequired = false;
  let hasEmailFormat = false;
  let hasPhoneFormat = false;
  let hasFutureDob = false;

  if (isBlank(values.email)) {
    invalidFields.push('email');
    hasRequired = true;
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    invalidFields.push('email');
    hasEmailFormat = true;
  }

  if (isBlank(values.phone)) {
    invalidFields.push('phone');
    hasRequired = true;
  } else if (!isValidPhone(values.phone.trim())) {
    invalidFields.push('phone');
    hasPhoneFormat = true;
  }

  if (values.passengers.length === 0) {
    hasRequired = true;
  }

  if (values.passengers.length > MAX_BOOKING_PASSENGERS) {
    return { message: BOOKING_PASSENGERS_ERROR, invalidFields: [] };
  }

  const { seatsAvailable } = options;
  if (
    seatsAvailable != null &&
    values.passengers.length > seatsAvailable
  ) {
    return { message: BOOKING_SEATS_ERROR, invalidFields: [] };
  }

  values.passengers.forEach((passenger, index) => {
    const prefix = `passengers.${index}`;

    if (isBlank(passenger.firstName)) {
      invalidFields.push(`${prefix}.firstName`);
      hasRequired = true;
    }
    if (isBlank(passenger.lastName)) {
      invalidFields.push(`${prefix}.lastName`);
      hasRequired = true;
    }
    if (isBlank(passenger.dateOfBirth) || !isValidIsoDate(passenger.dateOfBirth)) {
      invalidFields.push(`${prefix}.dateOfBirth`);
      hasRequired = true;
    } else if (isFutureIsoDate(passenger.dateOfBirth)) {
      invalidFields.push(`${prefix}.dateOfBirth`);
      hasFutureDob = true;
    }
    if (isBlank(passenger.documentNumber)) {
      invalidFields.push(`${prefix}.documentNumber`);
      hasRequired = true;
    }
  });

  if (invalidFields.length === 0 && !hasRequired) {
    return { message: null, invalidFields: [] };
  }

  let message = BOOKING_REQUIRED_ERROR;
  if (!hasRequired) {
    if (hasEmailFormat) {
      message = BOOKING_EMAIL_ERROR;
    } else if (hasPhoneFormat) {
      message = BOOKING_PHONE_ERROR;
    } else if (hasFutureDob) {
      message = BOOKING_DOB_ERROR;
    }
  }

  return { message, invalidFields };
}
