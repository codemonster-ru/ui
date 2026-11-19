import ts from 'typescript';

const componentName = /^Cm[A-Za-z0-9]+$/u;
const componentMention = /\bCm[A-Za-z0-9]+\b/gu;

/** Reads the public names of Vue components re-exported by the adapter packages. */
export function collectExportedComponents(indexSources) {
  const exported = new Set();

  for (const source of indexSources) {
    const index = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest);
    for (const statement of index.statements) {
      if (!ts.isExportDeclaration(statement) || statement.isTypeOnly) continue;

      const { moduleSpecifier, exportClause } = statement;
      if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier) || !moduleSpecifier.text.endsWith('.vue')) continue;
      if (!exportClause || !ts.isNamedExports(exportClause)) continue;

      for (const specifier of exportClause.elements) {
        const name = specifier.name.text;
        if (!specifier.isTypeOnly && specifier.propertyName?.text === 'default' && componentName.test(name)) {
          exported.add(name);
        }
      }
    }
  }

  return exported;
}

/** Reports exported components that no component guide names. */
export function findUndocumentedComponents(exported, guideSources) {
  const documented = new Set(guideSources.flatMap((source) => source.match(componentMention) ?? []));
  return [...exported].filter((name) => !documented.has(name)).sort();
}
