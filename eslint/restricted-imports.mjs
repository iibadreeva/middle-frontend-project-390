/**
 * Узкие ограничения, которые boundaries не закрывает надёжно:
 * - bare `@entities` (без слайса) — только через paths (exact name)
 * - self-barrel внутри слайса
 * - deep import shared UI сегментов вроде Toast
 * - features → @shared/lib/toast (шина только для store/тестов)
 */

/** Exact `@entities` root — не матчит `@entities/city`. */
export function bareEntitiesImportPaths() {
  return [
    {
      name: '@entities',
      message:
        'Импортируйте конкретный слайс (@entities/<name>), не корневой @entities',
    },
  ];
}

export function toastPublicBarrelPatterns() {
  return [
    {
      group: ['@shared/ui/Toast/*'],
      message:
        'Не импортируйте @shared/ui/Toast/* напрямую. Для UI — barrel @shared/ui/Toast; store и тесты — @shared/lib/toast.',
    },
  ];
}

/** Features не должны обходить UI-barrel и тянуть шину напрямую. */
export function toastLibImportPaths() {
  return [
    {
      name: '@shared/lib/toast',
      message:
        'В features импортируйте toast через публичный barrel @shared/ui/Toast; шина @shared/lib/toast — для store и тестов.',
    },
  ];
}

export function featureSelfBarrelPatterns(feature) {
  return [
    {
      group: [`@features/${feature}`, `@features/${feature}/*`],
      message: `Внутри фичи не импортируйте через @features/${feature} — только relative`,
    },
  ];
}

export function entitySelfBarrelPatterns(entity) {
  return [
    {
      group: [`@entities/${entity}`, `@entities/${entity}/*`],
      message: `Внутри слайса не импортируйте через @entities/${entity} — только relative`,
    },
  ];
}
