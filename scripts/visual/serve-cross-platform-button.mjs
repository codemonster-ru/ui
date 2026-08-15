import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [name, ...value] = argument.replace(/^--/u, '').split('=');
    return [name, value.join('=')];
  }),
);
const razorHtmlPath = options['razor-html'] ? resolve(options['razor-html']) : null;
const port = Number(options.port ?? 5176);

if (!razorHtmlPath || !existsSync(razorHtmlPath)) {
  throw new Error('A Razor-rendered Button fragment is required: --razor-html=FILE.');
}
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('Cross-platform fixture port must be an integer between 1 and 65535.');
}

const razorHtml = readFileSync(razorHtmlPath, 'utf8').trim();
if (!/^<button\b/u.test(razorHtml) || !razorHtml.includes('class="cm-button ')) {
  throw new Error('Razor-rendered Button fragment does not contain the expected component root.');
}

const server = await createServer({
  configFile: false,
  root: resolve(import.meta.dirname, 'cross-platform-button'),
  server: { host: '127.0.0.1', port, strictPort: true },
  plugins: [
    {
      name: 'codemonster-cross-platform-razor-fixture',
      configureServer(viteServer) {
        viteServer.middlewares.use('/__visual/razor/button-default', (_request, response) => {
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(razorHtml);
        });
      },
    },
  ],
});

await server.listen();
console.log(`Cross-platform Button fixtures ready at http://127.0.0.1:${port}.`);

await new Promise((resolvePromise) => {
  const close = () => resolvePromise();
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
});
await server.close();
