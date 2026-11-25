import assert from 'node:assert/strict';

export async function checkErrorLayout(page, base, adapter, theme) {
  const label = `${adapter} ${theme} Error Layout`;
  await page.goto(new URL('layouts/', base).href);
  const example = page.locator('#demo-error-layout');
  const frame = example.locator('iframe.layout-preview__frame');
  await frame.scrollIntoViewIfNeeded();
  const preview = frame.contentFrame();
  const root = preview.locator('.cm-error-layout');
  const recovery = preview.getByRole('link', { name: 'Go to home page', exact: true });
  await preview.locator(`html[data-cm-theme="${theme}"]`).waitFor({ state: 'attached' });
  await preview.getByRole('heading', { name: 'Page not found', level: 1, exact: true }).waitFor();
  const frameDocument = await (await frame.elementHandle()).contentFrame();
  await frameDocument.evaluate(() => document.fonts.ready.then(() => undefined));

  const widthOption = (name) => example.getByRole('radio', { name, exact: true });
  assert(await widthOption('Fit').isChecked(), `${label}: starts in Fit`);
  assert(await recovery.isEnabled(), `${label}: recovery link is enabled`);
  const core = new URL('core/', base).href;
  assert.equal(await recovery.evaluate((link) => link.href), core, `${label}: recovery leads to Core`);

  async function checkGeometry(width, mode) {
    const context = `${label}, ${mode}`;
    await frameDocument.waitForFunction((expectedWidth) => {
      const layout = document.querySelector('.cm-error-layout');
      return innerWidth === expectedWidth && innerHeight === Math.ceil(layout.getBoundingClientRect().height);
    }, width);
    const geometry = await root.evaluate((layout) => {
      const panel = layout.querySelector('.cm-error-layout__panel');
      const container = panel.parentElement;
      const code = panel.querySelector('.cm-error-layout__code');
      const title = panel.querySelector('.cm-error-layout__title');
      const description = panel.querySelector('.cm-error-layout__description');
      const action = panel.querySelector('.cm-error-layout__actions a');
      const themeProbe = document.createElement('span');
      themeProbe.style.color = 'var(--cm-color-text-muted)';
      themeProbe.style.backgroundColor = 'var(--cm-color-background-surface)';
      description.append(themeProbe);
      const { color: muted, backgroundColor: backdrop } = getComputedStyle(themeProbe);
      themeProbe.remove();
      const layoutBox = layout.getBoundingClientRect();
      const panelBox = panel.getBoundingClientRect();
      const actionBox = action.getBoundingClientRect();
      const { paddingBlockStart, paddingBlockEnd, backgroundColor: layoutBackground } = getComputedStyle(layout);
      const { paddingInlineStart, textAlign, fontWeight, boxShadow, backgroundColor, borderBlockStartWidth } =
        getComputedStyle(panel);
      const { fontSize: codeSize, fontWeight: codeWeight } = getComputedStyle(code);
      const { fontSize: titleSize, fontWeight: titleWeight } = getComputedStyle(title);
      return {
        frameWidth: layoutBox.width,
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        viewport: [innerWidth, innerHeight],
        blockPadding: [paddingBlockStart, paddingBlockEnd],
        panelPadding: paddingInlineStart,
        containerWidth: container.getBoundingClientRect().width,
        panelWidth: panelBox.width,
        panelOffset: [panelBox.top - layoutBox.top, layoutBox.bottom - panelBox.bottom],
        actionCenter: actionBox.left + actionBox.width / 2,
        surface: [backgroundColor, borderBlockStartWidth, boxShadow],
        backdrop: [layoutBackground, backdrop],
        textAlign,
        code: [code.textContent.trim(), codeWeight],
        codeSize: Number.parseFloat(codeSize),
        titleSize: Number.parseFloat(titleSize),
        headingWeight: [titleWeight, fontWeight],
        descriptionColor: [getComputedStyle(description).color, muted],
      };
    });

    const align = (actual, expected, description) =>
      assert(Math.abs(actual - expected) < 1, `${context}: ${description} (${actual} vs ${expected})`);
    align(geometry.frameWidth, width, 'layout fills the width');
    assert.deepEqual(geometry.scroll, geometry.viewport, `${context}: the frame fits without internal scrolling`);
    assert.deepEqual(geometry.blockPadding, ['48px', '48px'], `${context}: outer vertical padding`);
    assert.equal(geometry.panelPadding, '36px', `${context}: surface inset`);
    align(geometry.containerWidth, Math.min(width, 768), 'the container caps at md');
    align(geometry.panelWidth, geometry.containerWidth - 32, '16 px container gutters');
    assert.deepEqual(geometry.panelOffset, [48, 48], `${context}: the preview uses its intrinsic height`);
    align(geometry.actionCenter, width / 2, 'recovery link is centered');
    assert.deepEqual(geometry.surface, ['rgba(0, 0, 0, 0)', '0px', 'none'], `${context}: transparent panel`);
    assert.equal(...geometry.backdrop, `${context}: the showcase uses the surface backdrop`);
    assert.equal(geometry.textAlign, 'center', `${context}: centered copy`);
    assert.deepEqual(geometry.code, ['404', '700'], `${context}: emphasized 404 code`);
    align(geometry.codeSize, Math.min(88, Math.max(36, width * 0.08)), 'responsive code font size');
    align(geometry.titleSize, Math.min(32, Math.max(22, width * 0.03)), 'responsive title font size');
    assert.equal(...geometry.headingWeight, `${context}: the heading inherits its weight`);
    assert.equal(...geometry.descriptionColor, `${context}: the description uses the muted color`);
  }

  await checkGeometry(await frame.evaluate((element) => element.parentElement.clientWidth), 'Fit');
  for (const [name, width] of [
    ['xl · 1280 px', 1280],
    ['md · 768 px', 768],
    ['min · 320 px', 320],
  ]) {
    await widthOption(name).press('Space');
    await checkGeometry(width, `${width} px`);
  }
  await frameDocument.evaluate(() => (document.documentElement.dir = 'rtl'));
  await checkGeometry(320, '320 px RTL');

  await Promise.all([page.waitForURL(core), recovery.press('Enter')]);
  await page.getByRole('heading', { name: 'Core', level: 1, exact: true }).waitFor({ state: 'attached' });
}
