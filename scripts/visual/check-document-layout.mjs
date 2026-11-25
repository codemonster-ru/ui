import assert from 'node:assert/strict';

export async function checkDocumentLayout(page, base, adapter, theme) {
  const label = `${adapter} ${theme} Document Layout`;
  const align = (actual, expected, description) =>
    assert(Math.abs(actual - expected) <= 1, `${label}: ${description} (${actual} vs ${expected})`);
  await page.goto(new URL('layouts/', base).href);
  const example = page.locator('#demo-document-layout');
  const frame = example.locator('iframe.layout-preview__frame');
  await frame.scrollIntoViewIfNeeded();
  const preview = frame.contentFrame();
  const frameDocument = await (await frame.elementHandle()).contentFrame();
  const shell = preview.locator('.cm-document-layout');
  const region = (name) => shell.locator(`.cm-document-layout__${name}`);
  const tab = (name) => example.getByRole('tab', { name, exact: true });
  const option = (name) => example.getByRole('switch', { name, exact: true });
  const toggle = (name) => option(name).press('Space');
  const waitForWidth = (width) => frameDocument.waitForFunction((expected) => innerWidth === expected, width);
  const resize = async (name, width) => {
    await example.getByRole('radio', { name, exact: true }).press('Space');
    await waitForWidth(width);
  };
  const dimensions = () =>
    shell.evaluate((root) => {
      const names = ['header', 'subheader', 'content', 'main', 'content-subheader', 'footer', 'sidebar', 'aside'];
      const bounds = (element) => element.getBoundingClientRect().toJSON();
      const regions = names.map((name) => {
        const element = root.querySelector(`.cm-document-layout__${name}`);
        return [name, element?.getClientRects().length ? bounds(element) : null];
      });
      return { ...Object.fromEntries(regions), viewport: document.documentElement.clientWidth, root: bounds(root) };
    });
  const scrollTo = (top) =>
    frameDocument.evaluate(async (value) => {
      window.scrollTo({ top: value, behavior: 'instant' });
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    }, top);

  await preview.locator(`html[data-cm-theme="${theme}"]`).waitFor({ state: 'attached' });
  await region('main-body')
    .getByText(/^Content paragraph 1\./u)
    .waitFor();
  assert.equal(
    await frameDocument.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY),
    'contain',
    `${label}: preview contains vertical scroll at its edges`,
  );
  // Playwright's Firefox wheel input bypasses the compositor that applies overscroll-behavior.
  if (page.context().browser().browserType().name() !== 'firefox') {
    await scrollTo(Number.MAX_SAFE_INTEGER);
    assert((await frameDocument.evaluate(() => scrollY)) > 0, `${label}: preview has its own vertical scroll`);
    const outerScroll = await page.evaluate(() => scrollY);
    const { x, y, width, height } = await frame.boundingBox();
    const centerY = y + height / 2;
    await page.mouse.move(x + width / 2, centerY);
    await page.mouse.wheel(0, 850);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(
      await page.evaluate(() => scrollY),
      outerScroll,
      `${label}: wheel at the bottom stays inside the preview`,
    );
    await page.mouse.move(2, centerY);
    await page.mouse.wheel(0, 120);
    await page.waitForFunction((top) => scrollY > top, outerScroll);
    await scrollTo(0);
  }

  const timeOrigin = await frameDocument.evaluate(() => performance.timeOrigin);
  assert.equal(await tab('Content').getAttribute('aria-selected'), 'true', `${label}: starts in Content`);
  assert(await example.getByRole('radio', { name: 'Fit', exact: true }).isChecked(), `${label}: starts in Fit`);
  const controls = [...(await example.getByRole('tab').all()), ...(await example.getByRole('switch').all())];
  assert.equal(controls.length, 8, `${label}: three tabs and five switches are visible in Content`);
  const frameBox = await frame.boundingBox();
  for (const control of controls) {
    const box = await control.boundingBox();
    assert(box && box.y + box.height <= frameBox.y + 1, `${label}: controls are above the preview`);
  }
  assert.equal(await preview.getByRole('tab', { includeHidden: true }).count(), 0);
  assert.equal(await preview.getByRole('switch', { includeHidden: true }).count(), 0);
  const content = await dimensions();
  align(content.main.width, content.content.width, 'Content spans the body');
  assert.equal(content.sidebar, null);
  assert.equal(content.aside, null);
  assert.equal(content.subheader, null);
  assert.equal(content['content-subheader'], null);

  await resize('2xl · 1536 px', 1536);
  await tab('With sidebar').click();
  await region('sidebar').waitFor();
  assert.equal(await option('Sticky aside').count(), 0, `${label}: sidebar mode omits the aside switch`);
  const withSidebar = await dimensions();
  assert.equal(withSidebar.aside, null);
  align(withSidebar.main.right, withSidebar.content.right, 'With sidebar leaves no space for an absent aside');
  await tab('With aside').click();
  await region('aside').waitFor();
  const wide = await dimensions();
  align(wide.root.width, wide.viewport - 64, 'centers the 2xl frame inside 32 px gutters');
  align(wide.root.left, wide.viewport - wide.root.right, 'the frame has equal side gutters');
  align(wide.header.height, 64, 'header uses its declared height');
  align(wide.sidebar.width, 288, 'sidebar has the VueForge width');
  align(wide.aside.width, 320, 'aside has the VueForge width');
  align(wide.sidebar.right, wide.main.left, 'sidebar shares a border with the article');
  align(wide.main.right, wide.aside.left, 'aside shares a border with the article');
  align(wide.sidebar.bottom, wide.main.bottom, 'sidebar surface reaches the footer');
  align(wide.aside.bottom, wide.main.bottom, 'aside surface reaches the footer');

  await region('sidebar').evaluate((element) => (element.hidden = true));
  const onlyAside = await dimensions();
  assert.equal(onlyAside.sidebar, null);
  align(onlyAside.main.left, onlyAside.content.left, 'an absent sidebar leaves no empty track');
  align(onlyAside.main.right, onlyAside.aside.left, 'the remaining aside stays at the inline end');
  await region('sidebar').evaluate((element) => (element.hidden = false));

  await resize('min · 320 px', 320);
  const compact = await dimensions();
  align(compact.root.width, compact.viewport, 'compact frame reaches both viewport edges');
  align(compact.main.width, compact.content.width, 'compact article spans the body');
  assert.equal(compact.sidebar, null);
  assert.equal(compact.aside, null);

  for (const [width, sidebar, aside] of [
    [1023, false, false],
    [1024, true, false],
    [1279, true, false],
    [1280, true, true],
  ]) {
    await frame.evaluate((element, pixels) => (element.style.inlineSize = `${pixels}px`), width);
    await waitForWidth(width);
    assert.equal(await region('sidebar').isVisible(), sidebar, `${label}: sidebar visibility at ${width} px`);
    assert.equal(await region('aside').isVisible(), aside, `${label}: aside visibility at ${width} px`);
  }
  const xl = await dimensions();
  align(xl.root.width, xl.viewport - 64, 'xl frame retains side gutters');
  await frame.evaluate((element) => element.style.removeProperty('inline-size'));
  await resize('2xl · 1536 px', 1536);
  assert.equal(await tab('With aside').getAttribute('aria-selected'), 'true', `${label}: resizing retains the tab`);

  await toggle('Edge notches');
  await shell.and(preview.locator('.cm-document-layout--edge-notches')).waitFor();
  const notches = () =>
    shell.evaluate((element) =>
      ['header', 'footer'].map((name) => {
        const region = element.querySelector(`.cm-document-layout__${name}`);
        return ['::before', '::after'].map((side) => {
          const { content, width, height, left, right, clipPath, transform } = getComputedStyle(region, side);
          const [base, tip] = clipPath.slice('polygon('.length).split(',').map(Number.parseFloat);
          const scaleX = transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
          return { content, width, height, left, right, direction: Math.sign((tip - base) * scaleX) };
        });
      }),
    );
  const ltr = await notches();
  for (const pair of ltr) {
    assert.deepEqual(
      pair.map(({ direction }) => direction),
      [1, -1],
      `${label}: LTR notches point into the frame`,
    );
    assert.deepEqual([pair[0].left, pair[1].right], ['0px', '0px']);
    for (const notch of pair) {
      assert.equal(notch.content, '""', `${label}: enabled notch is painted`);
      assert.deepEqual([notch.width, notch.height], ['7px', '10px'], `${label}: notch matches VueForge dimensions`);
    }
  }
  await frameDocument.evaluate(() => (document.documentElement.dir = 'rtl'));
  const rtl = await dimensions();
  align(rtl.sidebar.left, rtl.main.right, 'RTL places sidebar at inline start');
  align(rtl.main.left, rtl.aside.right, 'RTL places aside at inline end');
  for (const pair of await notches()) {
    assert.deepEqual([pair[0].right, pair[1].left], ['0px', '0px']);
    assert.deepEqual(
      pair.map(({ direction }) => direction),
      [-1, 1],
      `${label}: RTL keeps the notches pointing into the frame`,
    );
  }
  await frameDocument.evaluate(() => document.documentElement.removeAttribute('dir'));

  await toggle('Subheader');
  await toggle('Content subheader');
  await region('subheader').waitFor();
  await region('content-subheader').waitFor();
  const bars = await dimensions();
  align(bars.subheader.height, 44, 'subheader uses its declared height');
  align(bars['content-subheader'].height, 44, 'content subheader uses its declared height');
  align(bars['content-subheader'].width, bars.main.width, 'content subheader spans the article column');
  const appearance = (name) =>
    region(name).evaluate((element) => {
      const { backgroundColor, borderBlockEndWidth, borderInlineStartWidth, borderInlineEndWidth } =
        getComputedStyle(element);
      return [backgroundColor, borderBlockEndWidth, borderInlineStartWidth, borderInlineEndWidth];
    });
  const transparent = 'rgba(0, 0, 0, 0)';
  assert.notEqual((await appearance('main'))[0], transparent, `${label}: default article has a surface`);
  await toggle('Plain columns');
  await frameDocument.waitForFunction(
    () => getComputedStyle(document.querySelector('.cm-document-layout__main')).backgroundColor === 'rgba(0, 0, 0, 0)',
  );
  for (const name of ['main', 'content-subheader', 'sidebar', 'aside']) {
    assert.deepEqual(await appearance(name), [transparent, '0px', '0px', '0px'], `${label}: plain ${name}`);
  }

  await toggle('Sticky sidebar');
  await scrollTo(300);
  const sidebarOnly = await dimensions();
  assert(sidebarOnly.header.bottom < 0 && sidebarOnly.subheader.bottom < 0, `${label}: static bars scroll away`);
  assert(sidebarOnly['content-subheader'].bottom < 0, `${label}: static content subheader scrolls away`);
  const railTop = (name) => region(`${name}-inner`).evaluate((element) => element.getBoundingClientRect().top);
  align(await railTop('sidebar'), 0, 'sticky sidebar starts at the viewport with static bars');
  assert((await railTop('aside')) < 0, `${label}: aside scrolls when only sidebar is sticky`);
  await toggle('Sticky sidebar');
  await toggle('Sticky aside');
  await scrollTo(300);
  assert((await railTop('sidebar')) < 0, `${label}: sidebar scrolls when only aside is sticky`);
  align(await railTop('aside'), 0, 'sticky aside starts at the viewport with static bars');

  await toggle('Sticky sidebar');
  await toggle('Sticky header');
  await scrollTo(300);
  const sticky = await dimensions();
  align(sticky.header.top, 0, 'header sticks to the top of the preview');
  align(sticky.subheader.top, sticky.header.bottom, 'subheader clears the sticky header');
  align(sticky['content-subheader'].top, sticky.subheader.bottom, 'content subheader clears both sticky bars');
  assert.notEqual((await appearance('content-subheader'))[0], transparent, `${label}: sticky subheader covers text`);
  for (const name of ['sidebar', 'aside']) {
    align(await railTop(name), sticky.subheader.bottom, `${name} clears both sticky bars`);
    const scroll = await region(`${name}-inner`).evaluate((element, rail) => {
      const other = document.querySelector(`.cm-document-layout__${rail === 'sidebar' ? 'aside' : 'sidebar'}-inner`);
      const pageTop = window.scrollY;
      const otherTop = other.scrollTop;
      element.scrollTop = 100;
      return {
        inner: element.scrollTop,
        independent: window.scrollY === pageTop && other.scrollTop === otherTop,
        bottom: element.getBoundingClientRect().bottom,
        viewport: innerHeight,
      };
    }, name);
    assert(scroll.inner > 0 && scroll.independent, `${label}: ${name} scrolls independently`);
    align(scroll.bottom, scroll.viewport, `${name} fits below sticky bars`);
  }

  const resizeHeader = async (height) => {
    await region('header').evaluate((element, value) => (element.style.minBlockSize = value), height);
    await frameDocument.waitForFunction(() => {
      const header = document.querySelector('.cm-document-layout__header').getBoundingClientRect();
      const subheader = document.querySelector('.cm-document-layout__subheader').getBoundingClientRect();
      return Math.abs(header.bottom - subheader.top) <= 1;
    });
  };
  await resizeHeader('96px');
  const expanded = await dimensions();
  align(expanded.header.height, 96, 'header honors a taller content height');
  align(expanded['content-subheader'].top, expanded.subheader.bottom, 'article offset follows header resizing');
  align(await railTop('sidebar'), expanded.subheader.bottom, 'sidebar offset follows header resizing');
  align(await railTop('aside'), expanded.subheader.bottom, 'aside offset follows header resizing');
  await resizeHeader('');

  await toggle('Subheader');
  await region('subheader').waitFor({ state: 'hidden' });
  await scrollTo(300);
  const headerOnly = await dimensions();
  align(headerOnly['content-subheader'].top, headerOnly.header.bottom, 'removing subheader updates the article offset');
  align(await railTop('sidebar'), headerOnly.header.bottom, 'removing subheader updates the sidebar offset');
  align(await railTop('aside'), headerOnly.header.bottom, 'removing subheader updates the aside offset');
  await scrollTo(await frameDocument.evaluate(() => document.documentElement.scrollHeight));
  const footer = await dimensions();
  align(footer.footer.bottom, await frameDocument.evaluate(() => innerHeight), 'the footer is reachable');
  assert(footer.sidebar.bottom <= footer.footer.top + 1 && footer.aside.bottom <= footer.footer.top + 1);

  for (const name of [
    'Sticky header',
    'Sticky sidebar',
    'Sticky aside',
    'Plain columns',
    'Edge notches',
    'Content subheader',
  ])
    await toggle(name);
  await region('content-subheader').waitFor({ state: 'hidden' });
  await scrollTo(300);
  assert((await railTop('sidebar')) < 0 && (await railTop('aside')) < 0, `${label}: toggles restore natural scrolling`);
  assert.notEqual((await appearance('main'))[0], transparent, `${label}: disabling Plain columns restores the surface`);
  assert((await notches()).flat().every(({ content }) => content === 'none' || content === 'normal'));
  assert.equal(
    await frameDocument.evaluate(() => performance.timeOrigin),
    timeOrigin,
    `${label}: controls keep the iframe`,
  );
}
