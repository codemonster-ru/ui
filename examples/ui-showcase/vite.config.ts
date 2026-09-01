import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5177,
    strictPort: true,
  },
  plugins: [vue()],
  resolve: {
    dedupe: ['vue'],
  },
});
