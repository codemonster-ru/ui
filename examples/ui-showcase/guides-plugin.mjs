import { URL } from 'node:url';
import { buildDocumentation, documentationDirectory } from '../../scripts/build/showcase-documentation.mjs';
import { buildShowcaseSearchIndex } from '../../scripts/build/showcase-search-index.mjs';

const assetDirectory = 'docs-content';
const searchAsset = `${assetDirectory}/search.json`;
const guideAsset = (path) => `${assetDirectory}${path}index.json`;

export function guidesPlugin() {
  return {
    name: 'codemonster-showcase-guides',
    configureServer(server) {
      let cachedDocumentation;
      server.watcher.add(documentationDirectory);
      server.watcher.on('all', (_event, file) => {
        if (file.startsWith(`${documentationDirectory}/`)) cachedDocumentation = undefined;
      });
      server.middlewares.use(`/${assetDirectory}`, async (request, response, next) => {
        try {
          cachedDocumentation ??= buildDocumentation();
          const documentation = await cachedDocumentation;
          const path = new URL(request.url, 'http://localhost').pathname;
          const guide = path.endsWith('/index.json') && documentation.pages.get(path.slice(0, -'index.json'.length));
          const content = path === '/search.json' ? buildShowcaseSearchIndex(documentation.index, 'vue') : guide;
          if (!content) {
            response.statusCode = 404;
            response.end();
            return;
          }
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.end(JSON.stringify(content));
        } catch (error) {
          cachedDocumentation = undefined;
          next(error);
        }
      });
    },
    generateBundle: {
      order: 'post',
      async handler(_options, bundle) {
        const documentation = await buildDocumentation();
        const search = buildShowcaseSearchIndex(documentation.index, 'vue');
        const entry = bundle['index.html'];
        if (entry?.type !== 'asset') throw new Error('Missing Vue showcase HTML entry.');
        const routes = new Set(search.map(({ path }) => path.split('#', 1)[0]));
        for (const path of routes) {
          this.emitFile({ type: 'asset', fileName: `${path.slice(1)}index.html`, source: entry.source });
        }
        for (const [path, guide] of documentation.pages) {
          this.emitFile({ type: 'asset', fileName: guideAsset(path), source: JSON.stringify(guide) });
        }
        this.emitFile({
          type: 'asset',
          fileName: searchAsset,
          source: JSON.stringify(search),
        });
      },
    },
  };
}
