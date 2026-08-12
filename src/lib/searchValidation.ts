import {
  SEARCH_DATE_PAST_ERROR,
  SEARCH_DATE_REQUIRED_ERROR,
  SEARCH_PASSENGERS_ERROR,
  SEARCH_SAME_CITIES_ERROR,
} from './messages';
import { isValidIsoDate, todayIsoDate } from './format';

type SearchValues = {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
};

export function validateSearchValues(
  values: SearchValues,
  timeZone: string,
): string | null {
  if (!isValidIsoDate(values.date)) {
    return SEARCH_DATE_REQUIRED_ERROR;
  }

  if (values.date < todayIsoDate(timeZone)) {
    return SEARCH_DATE_PAST_ERROR;
  }

  if (
    !Number.isFinite(values.passengers) ||
    values.passengers < 1 ||
    values.passengers > 9 ||
    !Number.isInteger(values.passengers)
  ) {
    return SEARCH_PASSENGERS_ERROR;
  }

  if (values.origin === values.destination) {
    return SEARCH_SAME_CITIES_ERROR;
  }

  return null;
}
