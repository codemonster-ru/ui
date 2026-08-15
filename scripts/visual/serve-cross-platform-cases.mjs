import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { collectComponentCases } from '../contracts/component-cases.mjs';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [name, ...value] = argument.replace(/^--/u, '').split('=');
    return [name, value.join('=')];
  }),
);
const razorFixturesPath = options['razor-fixtures'] ? resolve(options['razor-fixtures']) : null;
const port = Number(options.port ?? 5176);

if (!razorFixturesPath || !existsSync(razorFixturesPath)) {
  throw new Error('Razor-rendered component fixtures are required: --razor-fixtures=FILE.');
}
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('Cross-platform fixture port must be an integer between 1 and 65535.');
}

const manifest = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../contracts/cross-platform-visual-baselines.json'), 'utf8'),
);
const collected = collectComponentCases(resolve(import.meta.dirname, '../../contracts'));
if (collected.errors.length > 0) throw new Error(collected.errors.join('\n'));
const casesById = new Map(collected.cases.map((componentCase) => [componentCase.id, componentCase]));
const razorFixtures = JSON.parse(readFileSync(razorFixturesPath, 'utf8'));
const unexpectedCases = Object.keys(razorFixtures).filter((caseId) => !manifest.caseIds.includes(caseId));
if (unexpectedCases.length > 0) {
  throw new Error(`Razor fixture bundle contains unexpected cases: ${unexpectedCases.join(', ')}.`);
}
for (const caseId of manifest.caseIds) {
  const componentCase = casesById.get(caseId);
  const html = razorFixtures[caseId];
  if (!componentCase || typeof html !== 'string' || !html.includes(`class="cm-${componentCase.componentSlug}`)) {
    throw new Error(`Razor-rendered fixture ${caseId} does not contain the expected component root.`);
  }
}

const server = await createServer({
  configFile: false,
  root: resolve(import.meta.dirname, 'cross-platform-fixture'),
  server: { host: '127.0.0.1', port, strictPort: true },
  plugins: [
    {
      name: 'codemonster-cross-platform-razor-fixtures',
      configureServer(viteServer) {
        viteServer.middlewares.use('/__visual/razor/', (request, response) => {
          const caseId = decodeURIComponent(request.url?.replace(/^\//u, '') ?? '');
          const html = razorFixtures[caseId];
          if (typeof html !== 'string') {
            response.statusCode = 404;
            response.end('Unknown Razor visual case.');
            return;
          }
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(html);
        });
      },
    },
  ],
});

await server.listen();
console.log(`Cross-platform component fixtures ready at http://127.0.0.1:${port}.`);

await new Promise((resolvePromise) => {
  const close = () => resolvePromise();
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
});
await server.close();
