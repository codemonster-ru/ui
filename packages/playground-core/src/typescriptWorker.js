import ts from 'typescript';

self.addEventListener('message', (event) => {
  const request = event.data;
  if (!request || request.type !== 'transpile' || !Number.isInteger(request.id) || !Array.isArray(request.sources)) {
    return;
  }

  try {
    const outputs = request.sources.map((source) =>
      ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
        },
      }).outputText,
    );
    self.postMessage({ type: 'result', id: request.id, outputs });
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: request.id,
      message: error instanceof Error ? error.message : 'TypeScript transpilation failed.',
    });
  }
});
