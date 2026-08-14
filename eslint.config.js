import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import {
  createLayerBoundariesPlugin,
  featureDeepImportPatterns,
} from './eslint/layer-boundaries.mjs';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const featuresDir = path.join(rootDir, 'src', 'features');
const appDir = path.join(rootDir, 'src', 'app');

/** Список фич из `src/features/*` — без ручной синхронизации. */
const FEATURES = fs
  .readdirSync(featuresDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const featureSet = new Set(FEATURES);

const layerBoundaries = createLayerBoundariesPlugin({
  rootDir,
  featuresDir,
  appDir,
  featureSet,
});

/** Тестовые хелперы не должны попадать в production-модули. */
const sharedTestImportPatterns = [
  {
    group: [
      '**/shared/test',
      '**/shared/test/**',
      '@shared/test',
      '@shared/test/**',
    ],
    message:
      'shared/test только для тестов; не импортируйте из production-кода.',
  },
];

function featureBoundaryConfigs(features = FEATURES) {
  return features.flatMap((feature) => [
    {
      files: [`src/features/${feature}/**/*.{ts,tsx}`],
      ignores: [`src/features/${feature}/**/*.test.{ts,tsx}`],
      plugins: { 'layer-boundaries': layerBoundaries },
      rules: {
        'layer-boundaries/no-illegal-import': [
          'error',
          {
            currentFeature: feature,
            forbidApp: true,
            forbidSelfBarrel: true,
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            patterns: [...sharedTestImportPatterns],
          },
        ],
      },
    },
    {
      // Тесты фичи могут импортировать shared/test; cross-feature и app — нет.
      files: [`src/features/${feature}/**/*.test.{ts,tsx}`],
      plugins: { 'layer-boundaries': layerBoundaries },
      rules: {
        'layer-boundaries/no-illegal-import': [
          'error',
          {
            currentFeature: feature,
            forbidApp: true,
            forbidSelfBarrel: true,
          },
        ],
      },
    },
  ]);
}

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'scripts/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'vite.config.ts'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/features/*/index.ts'],
    rules: {
      // Публичные barrels экспортируют и компоненты, и хуки/типы вместе.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/main.tsx'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...featureDeepImportPatterns(FEATURES),
            ...sharedTestImportPatterns,
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/**/*.test.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: featureDeepImportPatterns(FEATURES) },
      ],
    },
  },
  ...featureBoundaryConfigs(),
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    ignores: ['src/shared/**/*.test.{ts,tsx}', 'src/shared/test/**'],
    plugins: { 'layer-boundaries': layerBoundaries },
    rules: {
      'layer-boundaries/no-illegal-import': [
        'error',
        { forbidFeatures: true, forbidApp: true },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [...sharedTestImportPatterns],
        },
      ],
    },
  },
  {
    // Тесты shared (вне shared/test): без features/app; shared/test разрешён.
    files: ['src/shared/**/*.test.{ts,tsx}'],
    ignores: ['src/shared/test/**'],
    plugins: { 'layer-boundaries': layerBoundaries },
    rules: {
      'layer-boundaries/no-illegal-import': [
        'error',
        { forbidFeatures: true, forbidApp: true },
      ],
    },
  },
  {
    // Хелперы shared/test тоже без features/app.
    files: ['src/shared/test/**/*.{ts,tsx}'],
    plugins: { 'layer-boundaries': layerBoundaries },
    rules: {
      'layer-boundaries/no-illegal-import': [
        'error',
        { forbidFeatures: true, forbidApp: true },
      ],
    },
  },
  eslintConfigPrettier,
);
