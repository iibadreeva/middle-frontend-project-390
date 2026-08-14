/** IANA-зоны для известных кодов городов. Поле API `City.timeZone` перекрывает словарь. */
export const CITY_TIME_ZONES: Readonly<Record<string, string>> = {
  MOW: 'Europe/Moscow',
  LED: 'Europe/Moscow',
  AER: 'Europe/Moscow',
  KZN: 'Europe/Moscow',
  SVX: 'Asia/Yekaterinburg',
};

export const DEFAULT_CITY_TIME_ZONE = 'Europe/Moscow';

/**
 * Короткие аббревиатуры: ICU для российских зон отдаёт GMT±H, а не MSK/YEKT.
 * Только для зон без перехода на летнее время — иначе подпись будет врать
 * половину года. Неизвестные зоны форматируются как UTC±H.
 */
export const TIME_ZONE_ABBREVIATIONS: Readonly<Record<string, string>> = {
  'Europe/Moscow': 'MSK',
  'Asia/Yekaterinburg': 'YEKT',
};
