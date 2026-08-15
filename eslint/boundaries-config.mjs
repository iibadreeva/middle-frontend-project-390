import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const featuresDir = path.join(rootDir, 'src', 'features');
const entitiesDir = path.join(rootDir, 'src', 'entities');

export const FEATURES = fs
  .readdirSync(featuresDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

export const ENTITIES = fs.existsSync(entitiesDir)
  ? fs
      .readdirSync(entitiesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  : [];

/** DAG: booking → flight → city (и booking → city). */
export const entityAllowedDeps = {
  city: [],
  flight: ['city'],
  booking: ['flight', 'city'],
};

export function assertEntityAllowedDeps(entities, allowedDeps) {
  const known = new Set(entities);
  for (const name of entities) {
    if (!(name in allowedDeps)) {
      throw new Error(
        `eslint entityAllowedDeps: нет записи для entities/${name}`,
      );
    }
  }
  for (const [name, deps] of Object.entries(allowedDeps)) {
    if (!known.has(name)) {
      throw new Error(
        `eslint entityAllowedDeps: неизвестный слайс "${name}" (нет в src/entities)`,
      );
    }
    for (const dep of deps) {
      if (!known.has(dep)) {
        throw new Error(
          `eslint entityAllowedDeps["${name}"]: неизвестная зависимость "${dep}"`,
        );
      }
    }
  }
}

assertEntityAllowedDeps(ENTITIES, entityAllowedDeps);

/** Public entry: index.ts / index.tsx у слайса (micromatch). */
const publicEntry = {
  fileInternalPath: 'index.ts?(x)',
};

function entityPublicTarget(elementName) {
  return {
    element: {
      type: 'entity',
      captured: { elementName },
      ...publicEntry,
    },
  };
}

function buildEntityPolicies(allowedDeps) {
  return Object.entries(allowedDeps).map(([name, deps]) => ({
    from: {
      element: { type: 'entity', captured: { elementName: name } },
    },
    allow: {
      to: [
        { element: { type: 'shared' } },
        ...deps.map((dep) => entityPublicTarget(dep)),
      ],
    },
    message:
      'entities/{{ from.element.captured.elementName }} может импортировать только shared и разрешённые entities через public index',
  }));
}

/**
 * Декларативные FSD-политики для eslint-plugin-boundaries.
 * Self-barrel / bare `@entities` — в restricted-imports.mjs.
 */
export function createBoundariesPolicies() {
  const appAllowTo = [
    { element: { type: 'feature', ...publicEntry } },
    { element: { type: 'entity', ...publicEntry } },
    { element: { type: 'shared' } },
    // main.tsx → ./app/* (слой app)
    { element: { type: 'app' } },
  ];

  return [
    // app → features | entities | shared (только public API слайсов)
    {
      from: { element: { type: 'app' } },
      allow: { to: appAllowTo },
    },
    // src/main.tsx — тот же контракт, что у app (файл, не папка → category)
    {
      from: { file: { categories: 'app-entry' } },
      allow: { to: appAllowTo },
    },
    // feature → entities | shared (не другие features, не app)
    {
      from: { element: { type: 'feature' } },
      allow: {
        to: [
          { element: { type: 'entity', ...publicEntry } },
          { element: { type: 'shared' } },
        ],
      },
    },
    // entity DAG + shared
    ...buildEntityPolicies(entityAllowedDeps),
    // shared-test → entities (public) | shared
    {
      from: { element: { type: 'shared-test' } },
      allow: {
        to: [
          { element: { type: 'entity', ...publicEntry } },
          { element: { type: 'shared' } },
          { element: { type: 'shared-test' } },
        ],
      },
    },
    // production shared → только shared (не entities/features/app/shared-test)
    {
      from: { element: { type: 'shared' } },
      allow: {
        to: { element: { type: 'shared' } },
      },
    },
    // *.test.* могут импортировать shared/test (поверх остальных allow)
    {
      from: { file: { categories: 'test' } },
      allow: {
        to: { element: { type: 'shared-test' } },
      },
    },
    // production-код не тянет shared/test
    {
      from: { file: { categories: { noneOf: ['test', 'shared-test-lib'] } } },
      disallow: {
        to: { file: { categories: 'shared-test-lib' } },
      },
      message:
        'shared/test только для тестов; не импортируйте из production-кода.',
    },
  ];
}

export function createBoundariesSettings() {
  return {
    'boundaries/include': ['src/**/*.{ts,tsx}'],
    'boundaries/ignore': ['**/*.module.css', 'src/styles/**'],
    'boundaries/elements-single-match': true,
    'boundaries/elements': [
      // более специфичные — раньше
      { type: 'shared-test', pattern: 'shared/test' },
      {
        type: 'feature',
        pattern: 'features/*',
        capture: ['elementName'],
      },
      {
        type: 'entity',
        pattern: 'entities/*',
        capture: ['elementName'],
      },
      { type: 'shared', pattern: 'shared' },
      { type: 'app', pattern: 'app' },
    ],
    'boundaries/files': [
      { pattern: 'src/shared/test/**', category: 'shared-test-lib' },
      { pattern: 'src/main.tsx', category: 'app-entry' },
      { pattern: '**/*.{test,spec}.{ts,tsx}', category: 'test' },
    ],
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: path.join(rootDir, 'tsconfig.json'),
      },
    },
  };
}

export function createBoundariesDependenciesRule() {
  return [
    'error',
    {
      default: 'disallow',
      checkUnknownLocals: true,
      // self-barrel через alias — no-restricted-imports (restricted-imports.mjs)
      checkInternals: false,
      policies: createBoundariesPolicies(),
    },
  ];
}

export { rootDir };
