// Types for the shared plain-data modules the Input showcase reads through the
// build aliases. The data itself is owned by contracts/ and examples/shared/.
declare module '@vueforge/input-cases' {
  const catalog: { cases: Record<string, unknown>[] };
  export default catalog;
}

declare module '@vueforge/showcase-index' {
  interface ShowcasePlatform {
    label: string;
    path: string;
  }

  const index: {
    referenceCommit: string;
    urlContract: { platforms: Record<'vue' | 'razor', ShowcasePlatform> };
    components: {
      name: string;
      package: string;
      platforms: Record<'vue' | 'razor', { status: 'implemented' | 'not-implemented' }>;
    }[];
  };
  export default index;
}
