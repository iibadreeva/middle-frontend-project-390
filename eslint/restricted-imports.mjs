/**
 * Узкие ограничения, которые boundaries не закрывает надёжно:
 * - bare `@entities` (без слайса) — только через paths (exact name)
 * - self-barrel внутри слайса
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
