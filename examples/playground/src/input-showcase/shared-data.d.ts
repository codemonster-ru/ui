// Types for the shared plain-data modules the showcase routes read through the
// build aliases. The data itself is owned by contracts/ and examples/shared/.
declare module '@vueforge/input-cases' {
  // Shaped by the consumer: this module only promises a list of cases.
  const catalog: { cases: unknown[] };
  export default catalog;
}

declare module '@vueforge/icon-button-cases' {
  const catalog: { cases: unknown[] };
  export default catalog;
}

declare module '@vueforge/field-cases' {
  const catalog: { cases: unknown[] };
  export default catalog;
}

declare module '@vueforge/button-cases' {
  const catalog: { cases: unknown[] };
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
