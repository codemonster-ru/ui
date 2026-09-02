import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

const METADATA_GZIP_BUDGET = 256;
const COMPONENT_GZIP_BUDGET = 25 * 1024;

const bundleConsumer = async (source) => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'vueforge-icons-virtual-consumer',
        resolveId(id) {
          return id === 'virtual:consumer' ? '\0virtual:consumer' : undefined;
        },
        load(id) {
          return id === '\0virtual:consumer' ? source : undefined;
        },
      },
    ],
    build: {
      minify: 'esbuild',
      write: false,
      rollupOptions: {
        input: 'virtual:consumer',
        external: ['vue'],
      },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(({ output }) => output);
  const chunks = outputs.filter((output) => output.type === 'chunk');

  assert.equal(chunks.length, 1, 'The bundle audit must produce exactly one JavaScript chunk.');

  return chunks[0].code;
};

const metadataCode = await bundleConsumer(`
  import { iconVariants } from '@codemonster-ru/vueforge-icons';
  console.log(iconVariants);
`);
const componentCode = await bundleConsumer(`
  import { VueIconify } from '@codemonster-ru/vueforge-icons';
  console.log(VueIconify);
`);
const metadataGzipSize = gzipSync(metadataCode).byteLength;
const componentGzipSize = gzipSync(componentCode).byteLength;

assert.ok(
  metadataGzipSize <= METADATA_GZIP_BUDGET,
  `Metadata-only bundle is ${metadataGzipSize} B gzip; expected at most ${METADATA_GZIP_BUDGET} B.`,
);
assert.doesNotMatch(metadataCode, /currentColor|viewBox|vf-icon/);
assert.match(metadataCode, /solid/);
assert.ok(
  componentGzipSize <= COMPONENT_GZIP_BUDGET,
  `VueIconify bundle is ${componentGzipSize} B gzip; expected at most ${COMPONENT_GZIP_BUDGET} B.`,
);
assert.match(componentCode, /currentColor/);

console.log(`Bundle audit: metadata ${metadataGzipSize} B gzip, VueIconify ${componentGzipSize} B gzip.`);
