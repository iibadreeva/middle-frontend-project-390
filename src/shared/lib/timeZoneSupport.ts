const supportedZones = new Map<string, boolean>();
const warnedZones = new Set<string>();
const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

/** Кеширует проверку IANA-имени для Intl.DateTimeFormat. */
export function isSupportedTimeZone(timeZone: string): boolean {
  const cached = supportedZones.get(timeZone);
  if (cached !== undefined) {
    return cached;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    supportedZones.set(timeZone, true);
    return true;
  } catch {
    supportedZones.set(timeZone, false);
    return false;
  }
}

/** Предупреждает один раз на зону — иначе консоль забивается на каждом рендере. */
export function warnUnknownTimeZone(timeZone: string, detail: string): void {
  if (warnedZones.has(timeZone)) {
    return;
  }
  warnedZones.add(timeZone);
  console.warn(detail);
}

/**
 * Возвращает IANA-зону, если её поддерживает Intl; иначе предупреждает и отдаёт fallback.
 */
export function resolveSupportedTimeZone(
  timeZone: string,
  fallback: string,
  detail: string,
): string {
  if (isSupportedTimeZone(timeZone)) {
    return timeZone;
  }

  warnUnknownTimeZone(timeZone, detail);
  return fallback;
}

/** Кешированный Intl.DateTimeFormat по locale + options. */
export function getCachedDateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}\0${JSON.stringify(options)}`;
  const cached = dateTimeFormatters.get(key);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat(locale, options);
  dateTimeFormatters.set(key, formatter);
  return formatter;
}

/**
 * Парсит ICU `longOffset` (`GMT`, `GMT+5`, `GMT-05:30`) в минуты east of UTC.
 * Нераспознанное значение → 0.
 */
export function parseGmtOffsetMinutes(raw: string): number {
  if (!raw || raw === 'GMT') {
    return 0;
  }

  const match = raw.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) {
    return 0;
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');
  return sign * (hours * 60 + minutes);
}

/** @internal Сброс warn-once между тестами. */
export function clearWarnedTimeZones(): void {
  warnedZones.clear();
}
