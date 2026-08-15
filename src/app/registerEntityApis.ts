/**
 * Side-effect импорты ниже выполняют injectEndpoints при загрузке модуля.
 * Импортируйте этот файл до первого использования store в UI.
 * Добавляйте сюда import нового entity-слайса (достаточно barrel `@entities/<name>`).
 */
import '@entities/booking';
import '@entities/city';
import '@entities/flight';

/** Гарантирует загрузку модуля с side-effect регистрацией endpoint'ов. */
export function registerEntityApis(): void {}
