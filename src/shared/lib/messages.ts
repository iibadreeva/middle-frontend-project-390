export const FLIGHTS_SEARCH_ERROR =
  'Не удалось выполнить поиск рейсов. Попробуйте ещё раз.';

export const CITIES_FALLBACK_NOTICE =
  'Не удалось загрузить полный список городов. Показан запасной набор направлений.';

/** Toast при ошибке /api/cities: без утверждения, что fallback уже показан. */
export const CITIES_LOAD_ERROR = 'Не удалось загрузить полный список городов.';

export const SEARCH_CITY_REQUIRED_ERROR = 'Выберите город';

export const SEARCH_DATE_REQUIRED_ERROR = 'Укажите дату вылета';

export const SEARCH_DATE_PAST_ERROR = 'Дата вылета не может быть в прошлом';

export const SEARCH_PASSENGERS_ERROR =
  'Число пассажиров должно быть от 1 до 9';

export const FLIGHT_NOT_FOUND = 'Рейс не найден';

export const FLIGHT_LOAD_ERROR = 'Не удалось загрузить рейс';

export const REQUEST_FAILED =
  'Не удалось выполнить запрос. Попробуйте ещё раз.';

export const BOOKING_REQUIRED_ERROR = 'Заполните все обязательные поля';

export const BOOKING_EMAIL_ERROR = 'Укажите корректный email';

export const BOOKING_PHONE_ERROR = 'Укажите корректный телефон';

export const BOOKING_DOB_ERROR = 'Дата рождения не может быть в будущем';

export const BOOKING_DOB_INVALID_ERROR = 'Укажите корректную дату рождения';

export const BOOKING_PASSENGERS_ERROR =
  'Число пассажиров должно быть от 1 до 9';

export const BOOKING_SEATS_ERROR =
  'Пассажиров больше, чем свободных мест на рейсе';

export const BOOKING_CREATE_ERROR =
  'Не удалось оформить бронь. Попробуйте ещё раз.';

/** Sticky-якорь у формы, когда полный текст уже объявил toast. */
export const BOOKING_CREATE_ERROR_HINT =
  'Не удалось оформить бронь. Подробности — в уведомлении.';

export const BOOKING_NOT_FOUND = 'Бронь не найдена';

export const BOOKING_LOOKUP_ERROR = 'Не удалось загрузить бронь';

export const BOOKING_CANCEL_ERROR =
  'Не удалось отменить бронь. Попробуйте ещё раз.';

export const BOOKING_LOOKUP_REQUIRED_ERROR =
  'Укажите код бронирования и фамилию';

/** Подсказка у секции пассажиров на форме брони. */
export const BOOKING_PASSENGERS_HINT = 'Как в документе';

/** Заголовок карточки пассажира и префикс сводки ошибок (индекс с нуля). */
export function bookingPassengerLabel(index: number): string {
  return `Пассажир ${index + 1}`;
}
