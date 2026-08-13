import type { Money } from '../api';
import {
  DEFAULT_CITY_TIME_ZONE,
  TIME_ZONE_ABBREVIATIONS,
} from '../data/cityTimeZones';
import {
  isSupportedTimeZone,
  warnUnknownTimeZone,
} from './timeZoneSupport';

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();
const todayFormatters = new Map<string, Intl.DateTimeFormat>();
const offsetFormatters = new Map<string, Intl.DateTimeFormat>();

function resolveTimeZone(timeZone: string): string {
  if (isSupportedTimeZone(timeZone)) {
    return timeZone;
  }

  warnUnknownTimeZone(
    timeZone,
    `Неизвестная IANA-зона «${timeZone}»; показываем ${DEFAULT_CITY_TIME_ZONE}.`,
  );
  return DEFAULT_CITY_TIME_ZONE;
}

function getDateTimeFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = dateTimeFormatters.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
  dateTimeFormatters.set(timeZone, formatter);
  return formatter;
}

function getTodayFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = todayFormatters.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  todayFormatters.set(timeZone, formatter);
  return formatter;
}

function getOffsetFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = offsetFormatters.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  });
  offsetFormatters.set(timeZone, formatter);
  return formatter;
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = getOffsetFormatter(timeZone).formatToParts(date);
  const raw = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
  const match = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) {
    return 0;
  }
  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');
  return sign * (hours * 60 + minutes);
}

function formatOffsetSuffix(date: Date, timeZone: string): string {
  const offsetMinutes = getTimeZoneOffsetMinutes(date, timeZone);
  if (offsetMinutes === 0) {
    return 'UTC';
  }

  const sign = offsetMinutes > 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  return minutes === 0
    ? `UTC${sign}${hours}`
    : `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

/** Короткий суффикс: MSK / YEKT из словаря; иначе UTC±H[:MM]. */
function formatTimeZoneSuffix(date: Date, timeZone: string): string {
  const known = TIME_ZONE_ABBREVIATIONS[timeZone];
  if (known) {
    return known;
  }

  return formatOffsetSuffix(date, timeZone);
}

export function formatDateTime(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'время неизвестно';
  }

  const zone = resolveTimeZone(timeZone);
  const formatted = getDateTimeFormatter(zone).format(date);

  return `${formatted} ${formatTimeZoneSuffix(date, zone)}`;
}

export function formatPrice(money: Money): string {
  const amount = new Intl.NumberFormat('ru-RU').format(money.amount);
  const currency = money.currency === 'RUB' ? '₽' : money.currency;
  return `${amount} ${currency}`;
}

export function totalMoney(unit: Money, passengers: number): Money {
  return {
    amount: unit.amount * passengers,
    currency: unit.currency,
  };
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return 'длительность неизвестна';
  }

  const wholeMinutes = Math.round(minutes);
  const hours = Math.floor(wholeMinutes / 60);
  const restMinutes = wholeMinutes % 60;

  if (hours === 0) {
    return `${restMinutes} мин`;
  }

  return restMinutes === 0 ? `${hours} ч` : `${hours} ч ${restMinutes} мин`;
}

export function todayIsoDate(timeZone: string): string {
  const zone = resolveTimeZone(timeZone);
  const parts = getTodayFormatter(zone).formatToParts(new Date());

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/** Проверяет календарную дату в формате YYYY-MM-DD. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
