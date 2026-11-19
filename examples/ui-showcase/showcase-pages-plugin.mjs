import { fileURLToPath, URL } from 'node:url';
import { collectComponentManifests } from '../../scripts/contracts/component-manifests.mjs';
import groups from '../shared/showcase-groups.json' with { type: 'json' };
import pages from '../shared/showcase-pages.json' with { type: 'json' };
import { referenceCatalog } from '../shared/showcase-component-reference.mts';

const contracts = fileURLToPath(new URL('../../contracts', import.meta.url));

export function showcasePagesPlugin() {
  return {
    name: 'codemonster-showcase-pages',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const entry = bundle['index.html'];
        if (entry?.type !== 'asset') throw new Error('Missing Vue showcase HTML entry.');

        const manifests = new Map(collectComponentManifests(contracts).map(({ slug, manifest }) => [slug, manifest]));
        const routes = new Set([
          ...pages.filter(({ detailOnly }) => !detailOnly).map(({ id }) => id),
          ...referenceCatalog(groups, manifests).map(({ slug }) => `components/${slug}`),
        ]);
        for (const path of routes) {
          this.emitFile({ type: 'asset', fileName: `${path}/index.html`, source: entry.source });
        }
      },
    },
  };
}
