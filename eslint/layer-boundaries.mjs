import path from 'node:path';

/** Alias `@features` или `@features/...` — не `@featuresFoo`. */
export function isFeaturesAlias(source) {
  return source === '@features' || source.startsWith('@features/');
}

function featureNameFromAlias(source) {
  if (source === '@features') {
    return null;
  }
  return source.slice('@features/'.length).split('/')[0] || null;
}

function resolveImportPath(source, filename, rootDir) {
  if (source.startsWith('.')) {
    return path.resolve(path.dirname(filename), source);
  }

  const normalized = source.replace(/\\/g, '/');
  const featuresIdx = normalized.indexOf('/features/');
  const appIdx = normalized.indexOf('/app/');

  if (featuresIdx !== -1) {
    return path.join(rootDir, 'src', normalized.slice(featuresIdx + 1));
  }
  if (appIdx !== -1) {
    return path.join(rootDir, 'src', normalized.slice(appIdx + 1));
  }
  if (normalized.startsWith('features/')) {
    return path.join(rootDir, 'src', normalized);
  }
  if (normalized.startsWith('app/')) {
    return path.join(rootDir, 'src', normalized);
  }
  return null;
}

function pathInsideDir(resolved, dir) {
  const rel = path.relative(dir, resolved);
  if (rel === '') {
    return { inside: true, firstSegment: null };
  }
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return { inside: false, firstSegment: null };
  }
  return { inside: true, firstSegment: rel.split(path.sep)[0] };
}

/**
 * Резолвит импорт относительно файла и проверяет границы фич/app.
 * Relative `../search` из вложенной папки фичи не даёт ложных срабатываний
 * (в отличие от regex по строке импорта).
 */
export function createLayerBoundariesPlugin({
  rootDir,
  featuresDir,
  appDir,
  featureSet,
}) {
  return {
    meta: { name: 'layer-boundaries' },
    rules: {
      'no-illegal-import': {
        meta: {
          type: 'problem',
          schema: [
            {
              type: 'object',
              properties: {
                currentFeature: { type: 'string' },
                forbidApp: { type: 'boolean' },
                forbidFeatures: { type: 'boolean' },
                forbidSelfBarrel: { type: 'boolean' },
              },
              additionalProperties: false,
            },
          ],
          messages: {
            crossFeature:
              '{{from}} не должен импортировать features/{{imported}}',
            selfBarrel:
              'Внутри фичи не импортируйте через @features/{{feature}} — только relative',
            forbidApp: '{{from}} не должен импортировать app',
            forbidFeatures: 'shared не должен импортировать features или app',
          },
        },
        create(context) {
          const options = context.options[0] ?? {};
          const {
            currentFeature = null,
            forbidApp = false,
            forbidFeatures = false,
            forbidSelfBarrel = false,
          } = options;
          const fromLabel = currentFeature
            ? `features/${currentFeature}`
            : forbidFeatures
              ? 'shared'
              : 'module';

          function reportFeatureImport(node, imported) {
            if (forbidFeatures) {
              context.report({
                node,
                messageId: 'forbidFeatures',
                data: { from: fromLabel },
              });
              return;
            }
            if (currentFeature && imported !== currentFeature) {
              context.report({
                node,
                messageId: 'crossFeature',
                data: { from: fromLabel, imported },
              });
            }
          }

          function checkFeaturesAlias(node, source) {
            if (
              forbidSelfBarrel &&
              currentFeature &&
              (source === `@features/${currentFeature}` ||
                source.startsWith(`@features/${currentFeature}/`))
            ) {
              context.report({
                node,
                messageId: 'selfBarrel',
                data: { feature: currentFeature },
              });
              return true;
            }

            if (!isFeaturesAlias(source)) {
              return false;
            }

            const imported = featureNameFromAlias(source);
            if (imported === null) {
              if (forbidFeatures) {
                context.report({
                  node,
                  messageId: 'forbidFeatures',
                  data: { from: fromLabel },
                });
              }
              return true;
            }

            if (!featureSet.has(imported)) {
              return true;
            }

            reportFeatureImport(node, imported);
            return true;
          }

          function checkResolvedPath(node, resolved) {
            const featureHit = pathInsideDir(resolved, featuresDir);
            if (featureHit.inside && featureHit.firstSegment) {
              const imported = featureHit.firstSegment;
              if (featureSet.has(imported)) {
                reportFeatureImport(node, imported);
                return;
              }
            }

            if (!forbidApp && !forbidFeatures) {
              return;
            }

            const appHit = pathInsideDir(resolved, appDir);
            if (appHit.inside) {
              context.report({
                node,
                messageId: forbidFeatures ? 'forbidFeatures' : 'forbidApp',
                data: { from: fromLabel },
              });
            }
          }

          function reportImport(node, source) {
            if (typeof source !== 'string' || source.length === 0) {
              return;
            }

            if (checkFeaturesAlias(node, source)) {
              return;
            }

            const resolved = resolveImportPath(
              source,
              context.filename,
              rootDir,
            );
            if (resolved) {
              checkResolvedPath(node, resolved);
            }
          }

          function visitSource(node) {
            if (!node) {
              return;
            }
            if (node.type === 'Literal' && typeof node.value === 'string') {
              reportImport(node, node.value);
            } else if (
              node.type === 'TemplateLiteral' &&
              node.expressions.length === 0 &&
              node.quasis.length === 1
            ) {
              reportImport(node, node.quasis[0].value.cooked);
            }
          }

          return {
            ImportDeclaration(node) {
              visitSource(node.source);
            },
            ImportExpression(node) {
              visitSource(node.source);
            },
            ExportNamedDeclaration(node) {
              visitSource(node.source);
            },
            ExportAllDeclaration(node) {
              visitSource(node.source);
            },
          };
        },
      },
    },
  };
}

/** Только публичный API фичи (index); запрет deep-import внутрь фичи. */
export function featureDeepImportPatterns(features) {
  return [
    {
      group: features.flatMap((name) => [
        `**/features/${name}/*`,
        `**/features/${name}/**`,
        `@features/${name}/*`,
        `@features/${name}/**`,
      ]),
      message: `Импортируйте фичи только через публичный index (${features
        .map((name) => `@features/${name}`)
        .join(' или ')}).`,
    },
  ];
}
