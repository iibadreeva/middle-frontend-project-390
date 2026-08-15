import path from 'node:path';
import { Linter } from 'eslint';
import boundaries from 'eslint-plugin-boundaries';
import { describe, expect, it } from 'vitest';
import {
  createBoundariesDependenciesRule,
  createBoundariesSettings,
  rootDir,
} from './boundaries-config.mjs';

function createLinter() {
  return new Linter({ configType: 'flat' });
}

function boundariesConfig() {
  return [
    {
      files: ['**/*.{ts,tsx}'],
      plugins: { boundaries },
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      settings: createBoundariesSettings(),
      rules: {
        'boundaries/dependencies': createBoundariesDependenciesRule(),
      },
    },
  ];
}

function lint(code, filename) {
  return createLinter().verify(code, boundariesConfig(), { filename });
}

function boundaryErrors(messages) {
  return messages.filter((msg) => msg.ruleId === 'boundaries/dependencies');
}

const searchFile = path.join(
  rootDir,
  'src/features/search/FlightCard/FlightCard.tsx',
);
const sharedFile = path.join(rootDir, 'src/shared/lib/format.ts');
const sharedTestFile = path.join(rootDir, 'src/shared/test/fixtures.ts');
const flightTypesFile = path.join(
  rootDir,
  'src/entities/flight/model/types.ts',
);
const cityTypesFile = path.join(rootDir, 'src/entities/city/model/types.ts');
const bookingTypesFile = path.join(
  rootDir,
  'src/entities/booking/model/types.ts',
);
const appFile = path.join(rootDir, 'src/app/Layout.tsx');
const mainFile = path.join(rootDir, 'src/main.tsx');

describe('boundaries/dependencies FSD policies', () => {
  it('allows feature → entity public API', () => {
    expect(
      boundaryErrors(
        lint(`import { City } from '@entities/city';`, searchFile),
      ),
    ).toHaveLength(0);
  });

  it('allows flight → city public API', () => {
    expect(
      boundaryErrors(
        lint(`import { City } from '@entities/city';`, flightTypesFile),
      ),
    ).toHaveLength(0);
  });

  it('allows booking → flight and city public API', () => {
    expect(
      boundaryErrors(
        lint(`import { Flight } from '@entities/flight';`, bookingTypesFile),
      ),
    ).toHaveLength(0);
    expect(
      boundaryErrors(
        lint(`import { City } from '@entities/city';`, bookingTypesFile),
      ),
    ).toHaveLength(0);
  });

  it('allows shared-test → entity public API', () => {
    expect(
      boundaryErrors(
        lint(`import { City } from '@entities/city';`, sharedTestFile),
      ),
    ).toHaveLength(0);
  });

  it('allows relative imports inside the same entity', () => {
    expect(
      boundaryErrors(
        lint(
          `import { Flight } from '../model/types';`,
          path.join(rootDir, 'src/entities/flight/lib/format.ts'),
        ),
      ),
    ).toHaveLength(0);
  });

  it('allows app → entity / feature public API', () => {
    expect(
      boundaryErrors(
        lint(`import { useGetCitiesQuery } from '@entities/city';`, appFile),
      ),
    ).toHaveLength(0);
    expect(
      boundaryErrors(
        lint(`import { SearchForm } from '@features/search';`, appFile),
      ),
    ).toHaveLength(0);
  });

  it('allows main → entity / feature / shared public API (same layer as app)', () => {
    expect(
      boundaryErrors(
        lint(`import { useGetCitiesQuery } from '@entities/city';`, mainFile),
      ),
    ).toHaveLength(0);
    expect(
      boundaryErrors(
        lint(`import { SearchForm } from '@features/search';`, mainFile),
      ),
    ).toHaveLength(0);
    expect(
      boundaryErrors(
        lint(`import { store } from '@shared/store';`, mainFile),
      ),
    ).toHaveLength(0);
  });

  it('forbids app deep import into feature', () => {
    const errors = boundaryErrors(
      lint(
        `import { SearchForm } from '@features/search/SearchForm/SearchForm';`,
        appFile,
      ),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('forbids main deep import into feature', () => {
    const errors = boundaryErrors(
      lint(
        `import { SearchForm } from '@features/search/SearchForm/SearchForm';`,
        mainFile,
      ),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('forbids city → flight (DAG)', () => {
    const errors = boundaryErrors(
      lint(`import { Flight } from '@entities/flight';`, cityTypesFile),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('forbids feature deep import into entity', () => {
    const errors = boundaryErrors(
      lint(
        `import { Flight } from '@entities/flight/model/types';`,
        searchFile,
      ),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('forbids relative deep import into entity from feature', () => {
    const errors = boundaryErrors(
      lint(
        `import { City } from '../../../entities/city/model/types';`,
        searchFile,
      ),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('forbids shared → entities', () => {
    const errors = boundaryErrors(
      lint(`import { City } from '@entities/city';`, sharedFile),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('forbids feature → another feature', () => {
    const errors = boundaryErrors(
      lint(`import { BookingForm } from '@features/booking';`, searchFile),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('forbids entity → feature', () => {
    const errors = boundaryErrors(
      lint(`import { SearchForm } from '@features/search';`, flightTypesFile),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('forbids entity deep import of another entity', () => {
    const errors = boundaryErrors(
      lint(
        `import { City } from '@entities/city/model/types';`,
        flightTypesFile,
      ),
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('no-restricted-imports complements (self-barrel / bare @entities)', () => {
  it('flags bare @entities via restricted-imports paths', async () => {
    const { bareEntitiesImportPaths } = await import(
      './restricted-imports.mjs'
    );
    const linter = createLinter();
    const config = [
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
        },
        rules: {
          'no-restricted-imports': [
            'error',
            { paths: bareEntitiesImportPaths() },
          ],
        },
      },
    ];
    const bare = linter.verify(`import { City } from '@entities';`, config, {
      filename: searchFile,
    });
    expect(bare.some((m) => m.ruleId === 'no-restricted-imports')).toBe(true);

    const slice = linter.verify(
      `import { City } from '@entities/city';`,
      config,
      { filename: searchFile },
    );
    expect(slice.some((m) => m.ruleId === 'no-restricted-imports')).toBe(
      false,
    );
  });

  it('flags feature self-barrel via restricted-imports patterns', async () => {
    const { featureSelfBarrelPatterns } = await import(
      './restricted-imports.mjs'
    );
    const linter = createLinter();
    const config = [
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
        },
        rules: {
          'no-restricted-imports': [
            'error',
            { patterns: featureSelfBarrelPatterns('search') },
          ],
        },
      },
    ];
    const messages = linter.verify(
      `import { FlightCard } from '@features/search';`,
      config,
      { filename: searchFile },
    );
    expect(messages.some((m) => m.ruleId === 'no-restricted-imports')).toBe(
      true,
    );
  });
});
