// Minimal Vite config used only by generate-input-icon-data.mjs.
//
// It mirrors the alias the icons package uses internally so the generator can
// server-render the real VueIconify component instead of re-typing SVG geometry
// by hand.
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('../../packages/icons/src/', import.meta.url)) }],
  },
});
