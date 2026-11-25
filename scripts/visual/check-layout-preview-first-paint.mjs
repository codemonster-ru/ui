import assert from 'node:assert/strict';

const previews = [
  ['admin-shell', '.cm-admin-shell'],
  ['setup-layout', '.cm-setup-layout'],
  ['auth-layout', '.cm-auth-layout'],
  ['error-layout', '.cm-error-layout'],
];

export async function checkLayoutPreviewFirstPaint(page, base, adapter) {
  const { promise: hold, resolve: release } = Promise.withResolvers();
  const previewRequest = /\/layout-example\.(?:html|js)(?:\?.*)?$/u;
  const holdPreview = async (route) => {
    await hold;
    await route.continue();
  };
  const label = `${adapter} Layouts at ${page.viewportSize().width}px`;
  const viewport = (slug) => page.locator(`#demo-${slug} .layout-preview__viewport`);
  const pendingHeights = new Map();

  await page.route(previewRequest, holdPreview);
  try {
    await Promise.all([
      page.waitForRequest(previewRequest),
      page.goto(new URL('layouts/', base).href, { waitUntil: 'commit' }),
    ]);
    for (const [slug] of previews) {
      const region = viewport(slug);
      const frame = region.locator('iframe');
      const placeholder = region.getByRole('status', { name: 'Loading preview', exact: true });
      const skeleton = placeholder.locator('.cm-skeleton');
      await frame.waitFor({ state: 'attached' });
      assert.equal(await placeholder.count(), 1, `${label}: ${slug} exposes its loading status`);
      assert(await skeleton.isVisible(), `${label}: ${slug} shows a skeleton while loading`);
      assert(!(await frame.isVisible()), `${label}: ${slug} hides the incomplete frame`);

      const sizes = await region.evaluate((element) => {
        const bounds = (selector) => element.querySelector(selector).getBoundingClientRect();
        const frame = bounds('iframe');
        const skeleton = bounds('.cm-skeleton');
        return [
          skeleton.x - frame.x,
          skeleton.y - frame.y,
          skeleton.width - frame.width,
          skeleton.height - frame.height,
        ];
      });
      assert(
        sizes.every((difference) => Math.abs(difference) <= 1),
        `${label}: ${slug} fills its reserved space`,
      );
      pendingHeights.set(slug, await region.evaluate((element) => element.getBoundingClientRect().height));
    }

    await page.evaluate((examples) => {
      const samples = (window.layoutPreviewFirstPaint = {});
      function sample() {
        for (const [slug, selector] of examples) {
          if (samples[slug]) continue;
          const frame = document.querySelector(`#demo-${slug} iframe.layout-preview__frame`);
          if (getComputedStyle(frame).visibility !== 'visible') continue;
          const root = frame.contentDocument?.querySelector(selector);
          samples[slug] = {
            ready: frame.hasAttribute('data-preview-ready'),
            innerHeight: frame.contentWindow.innerHeight,
            contentHeight: root ? Math.ceil(root.getBoundingClientRect().height) : null,
          };
        }
        if (Object.keys(samples).length < examples.length) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }, previews);

    release();
    for (const [slug] of previews) {
      const region = viewport(slug);
      const context = `${label}: ${slug}`;
      await region.scrollIntoViewIfNeeded();
      await page.waitForFunction((name) => window.layoutPreviewFirstPaint[name], slug);
      const first = await page.evaluate((name) => window.layoutPreviewFirstPaint[name], slug);
      assert(first.ready && first.contentHeight > 0, `${context} has its content when first visible`);
      if (slug !== 'admin-shell') {
        assert.equal(first.innerHeight, first.contentHeight, `${context} fits its content when first visible`);
      }
      assert(!(await region.locator('.layout-preview__placeholder').isVisible()), `${context} clears its placeholder`);

      const settledHeight = await region.evaluate(async (element) => {
        await element.querySelector('iframe').contentDocument.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return element.getBoundingClientRect().height;
      });
      const shift = Math.abs(settledHeight - pendingHeights.get(slug));
      assert(shift <= (slug === 'admin-shell' ? 1 : 40), `${context} reserves preview space (shifted ${shift}px)`);
    }
  } finally {
    release();
    await page.unroute(previewRequest, holdPreview);
  }
}
