export type City = {
  code: string;
  name: string;
  country?: string;
  /** IANA-зона, напр. Europe/Moscow. Опционально; если нет — клиентский словарь. */
  timeZone?: string;
};
