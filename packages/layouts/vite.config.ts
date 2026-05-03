import type { Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "unplugin-dts/vite";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import { buildLayoutCssArtifacts } from "./build/layout-css-artifacts";

function vueforgeLayoutStyleArtifactsPlugin(): Plugin[] {
  return [
    {
      name: "vueforge-layouts-generate-css",
      buildStart() {
        buildLayoutCssArtifacts();
      },
      configureServer() {
        buildLayoutCssArtifacts();
      }
    }
  ];
}

buildLayoutCssArtifacts();

export default defineConfig({
  plugins: [
    vue(),
    ...vueforgeLayoutStyleArtifactsPlugin(),
    dts({
      processor: "vue",
      include: ["src"],
      exclude: ["tests/**/*"],
      insertTypesEntry: true,
      beforeWriteFile(filePath) {
        if (filePath.endsWith(".d.ts.map")) {
          return false;
        }
      }
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "VueforgeLayouts",
      cssFileName: "styles",
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      external: [
        "vue",
        "@codemonster-ru/vueforge-core",
        "@codemonster-ru/vueforge-core/foundation",
        "@codemonster-ru/vueforge-theme"
      ],
      output: {
        exports: "named",
        globals: {
          vue: "Vue"
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    alias: [
      {
        find: /^@\//,
        replacement: `${resolve(__dirname, "../core/src")}/`,
      },
      {
        find: "@codemonster-ru/vueforge-core/foundation",
        replacement: resolve(__dirname, "../core/src/foundation/index.ts"),
      },
      {
        find: "@codemonster-ru/vueforge-core",
        replacement: resolve(__dirname, "../core/src/index.ts"),
      },
      {
        find: "@codemonster-ru/vueforge-theme",
        replacement: resolve(__dirname, "../theme/src/index.ts"),
      },
      {
        find: "@codemonster-ru/vueforge-icons",
        replacement: resolve(__dirname, "../core/src/test/mocks/vueforge-icons.ts"),
      },
    ],
    server: {
      deps: {
        inline: [
          "@codemonster-ru/vueforge-core",
          "@codemonster-ru/vueforge-core/foundation",
          "@codemonster-ru/vueforge-theme",
          "@codemonster-ru/vueforge-icons",
        ],
      }
    }
  }
});
