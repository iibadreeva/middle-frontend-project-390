import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import {
  createBoundariesDependenciesRule,
  createBoundariesSettings,
  ENTITIES,
  FEATURES,
} from './eslint/boundaries-config.mjs';
import {
  bareEntitiesImportPaths,
  entitySelfBarrelPatterns,
  featureSelfBarrelPatterns,
  toastLibImportPaths,
  toastPublicBarrelPatterns,
} from './eslint/restricted-imports.mjs';

function restrictedImportsConfig({ extraPaths = [], extraPatterns = [] } = {}) {
  return [
    'error',
    {
      paths: [...bareEntitiesImportPaths(), ...extraPaths],
      patterns: [...toastPublicBarrelPatterns(), ...extraPatterns],
    },
  ];
}

function featureSelfBarrelConfigs(features = FEATURES) {
  return features.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': restrictedImportsConfig({
        extraPaths: toastLibImportPaths(),
        extraPatterns: featureSelfBarrelPatterns(feature),
      }),
    },
  }));
}

function entitySelfBarrelConfigs(entities = ENTITIES) {
  return entities.map((entity) => ({
    files: [`src/entities/${entity}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': restrictedImportsConfig({
        extraPatterns: entitySelfBarrelPatterns(entity),
      }),
    },
  }));
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
    files: ['src/features/*/index.ts', 'src/entities/*/index.ts'],
    rules: {
      // Публичные barrels экспортируют и компоненты, и хуки/типы вместе.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/shared/ui/Toast/ToastProvider.tsx'],
    rules: {
      // Provider + useToast в одном модуле — обычный паттерн контекста.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: {
      // RHF watch() в тестовых harness — не прод-код.
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: createBoundariesSettings(),
    rules: {
      'boundaries/dependencies': createBoundariesDependenciesRule(),
      'no-restricted-imports': restrictedImportsConfig(),
    },
  },
  ...featureSelfBarrelConfigs(),
  ...entitySelfBarrelConfigs(),
  eslintConfigPrettier,
);
