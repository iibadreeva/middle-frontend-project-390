const supportedZones = new Map<string, boolean>();
const warnedZones = new Set<string>();

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

/** @internal Сброс warn-once между тестами. */
export function clearWarnedTimeZones(): void {
  warnedZones.clear();
}
