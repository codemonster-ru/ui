import { resolve } from 'node:path';
import { build } from 'esbuild';
import { createServer } from 'vite';
import { collectComponentCases } from '../contracts/component-cases.mjs';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [name, ...value] = argument.replace(/^--/u, '').split('=');
    return [name, value.join('=')];
  }),
);
const port = Number(options.port ?? 5176);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('Cross-platform fixture port must be an integer between 1 and 65535.');
}

const collected = collectComponentCases(resolve(import.meta.dirname, '../../contracts'));
if (collected.errors.length > 0) throw new Error(collected.errors.join('\n'));
const casesById = new Map(collected.cases.map((componentCase) => [componentCase.id, componentCase]));
const vanillaRuntime = (
  await build({
    entryPoints: [resolve(import.meta.dirname, '../../examples/vanilla/runtime.mjs')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
  })
).outputFiles[0].text;

const server = await createServer({
  configFile: false,
  root: resolve(import.meta.dirname, 'cross-platform-fixture'),
  server: { host: '127.0.0.1', port, strictPort: true },
  plugins: [
    {
      name: 'codemonster-cross-platform-vanilla-fixtures',
      configureServer(viteServer) {
        viteServer.middlewares.use('/__visual/vanilla-runtime.js', (_request, response) => {
          response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
          response.end(vanillaRuntime);
        });
        viteServer.middlewares.use('/__visual/vanilla/', (request, response) => {
          const caseId = decodeURIComponent(request.url?.replace(/^\//u, '') ?? '');
          const componentCase = casesById.get(caseId);
          if (!componentCase) {
            response.statusCode = 404;
            response.end('Unknown Vanilla visual case.');
            return;
          }
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(componentCase.canonicalHtml);
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
