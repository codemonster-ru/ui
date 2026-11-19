import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { defineConfig } from 'vite';

const run = promisify(execFile);
const root = resolve(import.meta.dirname, '../..');
const production = resolve(import.meta.dirname, 'dist');
const development = resolve(import.meta.dirname, '.generated');
const packages = ['tokens', 'icons', 'runtime', 'css'];

async function build(packagesToBuild) {
  for (const name of packages) {
    if (packagesToBuild.has(name)) {
      await run(process.execPath, [process.env.npm_execpath, 'run', 'build', '-w', `@codemonster-ru/ui-${name}`], {
        cwd: root,
      });
    }
  }
  await run(process.execPath, ['scripts/build/build-vanilla.mjs', '--dev'], { cwd: root });
}

export default defineConfig(({ isPreview }) => ({
  root: isPreview ? import.meta.dirname : development,
  appType: 'mpa',
  publicDir: false,
  cacheDir: resolve(root, 'node_modules/.vite/vanilla-showcase'),
  build: { outDir: production },
  optimizeDeps: { noDiscovery: true },
  server: {
    host: '127.0.0.1',
    port: 5178,
    strictPort: true,
    open: true,
    // Generated pages resolve relative scripts against their HTML <base> element.
    preTransformRequests: false,
    watch: { ignored: [/(?:^|[\\/])(?:\.generated|\.npm-cache|dist)(?:[\\/]|$)/u] },
  },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true, open: true },
  plugins: [
    {
      name: 'codemonster-vanilla-showcase',
      configurePreviewServer({ config }) {
        if (!existsSync(resolve(config.root, config.build.outDir, 'index.html'))) {
          throw new Error('Vanilla showcase is not built. Run npm run build:vanilla from the repository root first.');
        }
      },
      async configureServer(server) {
        // Serve the same generated pages as the production build in a separate directory.
        await build(new Set(packages));

        const watched = [
          'examples/vanilla',
          'examples/shared',
          'contracts',
          'scripts/build',
          'scripts/contracts',
          ...packages.flatMap((name) => [`packages/${name}/src`, `packages/${name}/scripts`]),
        ];
        server.watcher.add(watched.map((directory) => resolve(root, directory)));

        const pending = new Set();
        let timer;
        let building = false;
        async function rebuild() {
          if (building || pending.size === 0) return;
          building = true;
          try {
            while (pending.size > 0) {
              const changed = new Set(pending);
              pending.clear();
              try {
                await build(changed);
                server.ws.send({ type: 'full-reload', path: '*' });
              } catch (error) {
                server.config.logger.error(error.message);
              }
            }
          } finally {
            building = false;
          }
        }

        server.watcher.on('all', (event, file) => {
          if (!['add', 'change', 'unlink'].includes(event) || file === import.meta.filename) return;
          const [directory, name] = relative(root, file).split(sep);
          pending.add(directory === 'packages' ? name : 'showcase');
          clearTimeout(timer);
          timer = setTimeout(rebuild, 75);
        });
        server.httpServer?.once('close', () => clearTimeout(timer));
      },
    },
  ],
}));
