import type { Money } from '../model/types';

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
