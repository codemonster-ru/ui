import type { Plugin } from "vite";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildThemeCssArtifacts,
  themeCssArtifactPaths,
} from "./build/theme-css-artifacts";

const rootDir = __dirname;
const stylesDir = resolve(rootDir, "src/styles");

function vueforgeStyleArtifactsPlugin(): Plugin[] {
  return [
    {
      name: "vueforge-generate-theme-css",
      buildStart() {
        buildThemeCssArtifacts();
      },
      configureServer() {
        buildThemeCssArtifacts();
      },
    },
    {
      name: "vueforge-copy-css-entries",
      writeBundle() {
        const distDir = resolve(rootDir, "dist");

        mkdirSync(distDir, { recursive: true });

        cpSync(
          themeCssArtifactPaths.generatedTokensPath,
          resolve(distDir, "tokens.css"),
        );
        cpSync(
          themeCssArtifactPaths.generatedThemePath,
          resolve(distDir, "theme.css"),
        );
        cpSync(
          themeCssArtifactPaths.generatedBreakpointsPath,
          resolve(distDir, "generated-breakpoints.css"),
        );
        cpSync(
          resolve(stylesDir, "foundation.css"),
          resolve(distDir, "foundation.css"),
        );
      },
    },
  ];
}

buildThemeCssArtifacts();

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [
    vue(),
    ...vueforgeStyleArtifactsPlugin(),
    dts({
      include: ["src"],
      exclude: ["src/**/*.spec.ts", "src/test/**"],
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "foundation-api": resolve(__dirname, "src/foundation/index.ts"),
        "theme-api": resolve(__dirname, "src/theme/public.ts"),
      },
      name: "VueforgeCore",
      cssFileName: "styles",
      fileName: (_format, entryName) =>
        `${entryName === "index" ? "vueforge-core" : entryName}.js`,
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "vue",
        "@codemonster-ru/vueforge-icons",
        "@codemonster-ru/floater.js",
        "@codemonster-ru/vueforge-theme",
      ],
      output: {},
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    server: {
      deps: {
        inline: ["@codemonster-ru/vueforge-icons"],
      },
    },
  },
});
