import { createApp, defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import VueCodeBlock, { setCodeBlockThemeVars } from "../index";

const TestHostComponent = defineComponent({
  render() {
    return h("div");
  },
});

describe("VueCodeBlock plugin", () => {
  it("injects runtime theme vars via plugin options", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const app = createApp(TestHostComponent);

    app.use(VueCodeBlock, {
      themeVars: {
        base: {
          "--vcb-border-radius": "0.75rem",
          "--vcb-padding": "1rem",
        },
        dark: {
          "--vcb-dark-background-color": "#161a23",
        },
      },
    });
    app.mount(host);

    const styleElement = document.getElementById("vcb-runtime-theme-vars");
    expect(styleElement).not.toBeNull();
    expect(styleElement?.textContent).toContain("--vcb-border-radius: 0.75rem;");
    expect(styleElement?.textContent).toContain("--vcb-padding: 1rem;");
    expect(styleElement?.textContent).toContain(
      '--vcb-dark-background-color: #161a23;',
    );

    app.unmount();
  });

  it("uses scoped selectors for light and dark theme vars", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const app = createApp(TestHostComponent);

    app.use(VueCodeBlock, {
      themeScope: "#docs-app",
      themeVars: {
        light: {
          "--vcb-background-color": "#ffffff",
        },
        dark: {
          "--vcb-dark-background-color": "#161a23",
        },
      },
    });
    app.mount(host);

    const styleElement = document.getElementById("vcb-runtime-theme-vars");
    expect(styleElement?.textContent).toContain(
      '#docs-app[data-theme="light"], #docs-app[data-vf-theme="light"]',
    );
    expect(styleElement?.textContent).toContain(
      '#docs-app[data-theme="dark"], #docs-app[data-vf-theme="dark"]',
    );

    app.unmount();
  });

  it("is safe when document is unavailable", () => {
    vi.stubGlobal("document", undefined);

    const app = createApp(TestHostComponent);

    expect(() => {
      app.use(VueCodeBlock, {
        themeVars: {
          base: { "--vcb-padding": "1rem" },
        },
      });
    }).not.toThrow();

    vi.unstubAllGlobals();
  });

  it("sets nonce on runtime style tag", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const app = createApp(TestHostComponent);

    app.use(VueCodeBlock, {
      styleNonce: "nonce-123",
      themeVars: {
        base: { "--vcb-padding": "1rem" },
      },
    });
    app.mount(host);

    const styleElement = document.getElementById("vcb-runtime-theme-vars");
    expect(styleElement?.getAttribute("nonce")).toBe("nonce-123");

    app.unmount();
  });

  it("updates runtime theme vars via setCodeBlockThemeVars helper", () => {
    setCodeBlockThemeVars({
      base: {
        "--vcb-padding": "2rem",
      },
    });

    const styleElement = document.getElementById("vcb-runtime-theme-vars");
    expect(styleElement?.textContent).toContain("--vcb-padding: 2rem;");
  });
});
