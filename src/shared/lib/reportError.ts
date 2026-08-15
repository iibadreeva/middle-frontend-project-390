/**
 * Единая точка логирования неожиданных ошибок UI.
 * Сейчас — console.error; позже можно подменить на телеметрию.
 */
export function reportError(message: string, ...details: unknown[]): void {
  console.error(message, ...details);
}
