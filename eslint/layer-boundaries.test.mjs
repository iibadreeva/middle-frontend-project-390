import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Linter, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import {
  createLayerBoundariesPlugin,
  featureDeepImportPatterns,
  isFeaturesAlias,
} from './layer-boundaries.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const featuresDir = path.join(rootDir, 'src', 'features');
const appDir = path.join(rootDir, 'src', 'app');
const featureSet = new Set(['search', 'booking']);

const plugin = createLayerBoundariesPlugin({
  rootDir,
  featuresDir,
  appDir,
  featureSet,
});

const rule = plugin.rules['no-illegal-import'];

const featureOptions = {
  currentFeature: 'search',
  forbidApp: true,
  forbidSelfBarrel: true,
};

const sharedOptions = {
  forbidFeatures: true,
  forbidApp: true,
};

const searchFile = path.join(
  rootDir,
  'src',
  'features',
  'search',
  'FlightCard',
  'FlightCard.tsx',
);

const sharedFile = path.join(rootDir, 'src', 'shared', 'lib', 'format.ts');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('layer-boundaries/no-illegal-import', rule, {
  valid: [
    {
      code: `import { FlightCard } from '../FlightCard/FlightCard';`,
      filename: searchFile,
      options: [featureOptions],
    },
    {
      code: `import { formatPrice } from '@shared/lib/format';`,
      filename: searchFile,
      options: [featureOptions],
    },
    {
      code: `import { totalMoney } from './money';`,
      filename: sharedFile,
      options: [sharedOptions],
    },
  ],
  invalid: [
    {
      code: `import { BookingForm } from '@features/booking';`,
      filename: searchFile,
      options: [featureOptions],
      errors: [{ messageId: 'crossFeature' }],
    },
    {
      code: `import { useFlightSearch } from '@features/search';`,
      filename: searchFile,
      options: [featureOptions],
      errors: [{ messageId: 'selfBarrel' }],
    },
    {
      code: `import { routePaths } from '../../../app/routes';`,
      filename: searchFile,
      options: [featureOptions],
      errors: [{ messageId: 'forbidApp' }],
    },
    {
      code: `import { BookingForm } from '../../booking/BookingForm/BookingForm';`,
      filename: searchFile,
      options: [featureOptions],
      errors: [{ messageId: 'crossFeature' }],
    },
    {
      code: `import { SearchForm } from '@features/search';`,
      filename: sharedFile,
      options: [sharedOptions],
      errors: [{ messageId: 'forbidFeatures' }],
    },
    {
      code: `import { SearchForm } from '../../features/search/index.ts';`,
      filename: sharedFile,
      options: [sharedOptions],
      errors: [{ messageId: 'forbidFeatures' }],
    },
    {
      code: `import { routePaths } from '../../app/routes';`,
      filename: sharedFile,
      options: [sharedOptions],
      errors: [{ messageId: 'forbidFeatures' }],
    },
    {
      code: `const m = await import('@features/booking');`,
      filename: searchFile,
      options: [featureOptions],
      errors: [{ messageId: 'crossFeature' }],
    },
    {
      code: `export { BookingForm } from '@features/booking';`,
      filename: searchFile,
      options: [featureOptions],
      errors: [{ messageId: 'crossFeature' }],
    },
    {
      code: `export * from '@features/booking';`,
      filename: searchFile,
      options: [featureOptions],
      errors: [{ messageId: 'crossFeature' }],
    },
  ],
});

describe('isFeaturesAlias', () => {
  it('matches bare and scoped @features aliases only', () => {
    expect(isFeaturesAlias('@features')).toBe(true);
    expect(isFeaturesAlias('@features/search')).toBe(true);
    expect(isFeaturesAlias('@features/search/index')).toBe(true);
    expect(isFeaturesAlias('@featuresFoo')).toBe(false);
    expect(isFeaturesAlias('@shared/lib')).toBe(false);
  });
});

describe('featureDeepImportPatterns', () => {
  it('flags deep imports from app while allowing the public barrel', () => {
    const linter = new Linter({ configType: 'flat' });
    const config = [
      {
        files: ['**/*.{ts,tsx}'],
        rules: {
          'no-restricted-imports': [
            'error',
            { patterns: featureDeepImportPatterns(['search', 'booking']) },
          ],
        },
      },
    ];

    const deep = linter.verify(
      `import { FlightCard } from '@features/search/FlightCard/FlightCard';`,
      config,
      { filename: path.join(rootDir, 'src/app/pages/SearchPage.tsx') },
    );
    expect(deep).toHaveLength(1);
    expect(deep[0]?.ruleId).toBe('no-restricted-imports');

    const barrel = linter.verify(
      `import { FlightResults } from '@features/search';`,
      config,
      { filename: path.join(rootDir, 'src/app/pages/SearchPage.tsx') },
    );
    expect(barrel).toHaveLength(0);
  });
});
