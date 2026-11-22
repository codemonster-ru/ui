import pages from '../shared/showcase-pages.json' with { type: 'json' };

export function showcasePagesPlugin() {
  return {
    name: 'codemonster-showcase-pages',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const entry = bundle['index.html'];
        if (entry?.type !== 'asset') throw new Error('Missing Vue showcase HTML entry.');

        for (const { id } of pages) {
          this.emitFile({ type: 'asset', fileName: `${id}/index.html`, source: entry.source });
        }
      },
    },
  };
}
