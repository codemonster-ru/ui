// Runs in the browser against the actual Vue and enhanced Vanilla markup.
export function measureNavigationIcons(root = document) {
  const token = document.createElement('span');
  token.style.cssText = 'position:absolute;visibility:hidden;inline-size:var(--cm-space-2)';
  document.body.append(token);
  const minimum = token.getBoundingClientRect().width;
  token.remove();

  const rows = [];
  for (const item of root.querySelectorAll('.cm-menu-bar__item, .cm-nav-menu__item')) {
    const label = item.querySelector('.cm-menu-bar__label, .cm-nav-menu__label');
    if (!label || !label.checkVisibility({ visibilityProperty: true }) || getComputedStyle(label).clipPath !== 'none')
      continue;
    const range = document.createRange();
    range.selectNodeContents(label);
    const labelBox = label.getBoundingClientRect();
    const text = range.getBoundingClientRect();
    if (!text.width || !text.height) continue;

    const rtl = getComputedStyle(item).direction === 'rtl';
    for (const icon of item.querySelectorAll('.cm-icon, .cm-menu-bar__icon, .cm-nav-menu__icon')) {
      if (!icon.checkVisibility({ visibilityProperty: true })) continue;
      const leading = !!(icon.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING);
      const style = getComputedStyle(icon);
      const box = icon.getBoundingClientRect();
      const width = parseFloat(style.width);
      const height = parseFloat(style.height);
      const chevron = icon.namespaceURI !== 'http://www.w3.org/2000/svg';
      const styleGap = parseFloat(getComputedStyle(icon.parentElement).columnGap);
      const textLeft = Math.max(text.left, labelBox.left);
      const textRight = Math.min(text.right, labelBox.right);
      const gap = leading !== rtl ? textLeft - box.right : box.left - textRight;
      const layoutGap = gap + (box.width - width) / 2;
      const textCenter = (text.top + text.bottom) / 2;
      const centerOffset = (box.top + box.bottom) / 2 - textCenter;

      let direction;
      let expectedDirection;
      if (chevron) {
        const right = parseFloat(style.borderRightWidth) > 0;
        const angle = ((parseFloat(style.rotate) || 0) * Math.PI) / 180;
        // The corner where the two borders meet is the chevron tip.
        const tipX = (right ? width : -width) / 2;
        const tipY = height / 2;
        const x = tipX * Math.cos(angle) - tipY * Math.sin(angle);
        const y = tipX * Math.sin(angle) + tipY * Math.cos(angle);
        direction = Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : y < 0 ? 'up' : 'down';
        const isNested =
          item.classList.contains('cm-menu-bar__item--branch') &&
          !item.closest('.cm-menu-bar__node--depth-0')?.isSameNode(item.parentElement);
        expectedDirection =
          isNested && innerWidth > 640
            ? rtl
              ? 'left'
              : 'right'
            : item.classList.contains('cm-nav-menu__item--expanded')
              ? 'up'
              : 'down';
      }

      rows.push({
        label: label.textContent.trim(),
        icon: chevron ? 'chevron' : leading ? 'leading' : 'external',
        leading,
        disabled: item.matches(':disabled, [aria-disabled=true]'),
        active: item.matches('[aria-current]'),
        expanded: item.getAttribute('aria-expanded'),
        minimum,
        styleGap,
        gap,
        layoutGap,
        centerOffset,
        size: [width, height],
        direction,
        expectedDirection,
      });
    }
  }
  return rows;
}

export async function checkNavigationIconSpacing({ send, evaluate, id, theme, platform }) {
  const failures = [];
  let measured = 0;
  try {
    for (const width of [360, 960]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 660, deviceScaleFactor: 1, mobile: false });
      for (const direction of ['ltr', 'rtl']) {
        await evaluate(`(() => {
          document.documentElement.dir = '${direction}';
          document.querySelector('#visual-root').style.inlineSize = 'min(100%, 40rem)';
        })()`);
        const rows = await evaluate(`(${measureNavigationIcons})()`);
        measured += rows.length;
        for (const row of rows) {
          const context = `${id} ${platform} ${theme} ${width}px ${direction} ${row.label} ${row.icon}`;
          if (row.minimum <= 0 || row.styleGap < row.minimum || row.layoutGap < row.minimum - 0.1) {
            failures.push(
              `${context}: ${row.styleGap}px declared gap, ${row.layoutGap.toFixed(2)}px measured, expected at least ${row.minimum}px`,
            );
          }
          if (Math.abs(row.centerOffset) > 2) {
            failures.push(`${context}: vertical offset ${row.centerOffset.toFixed(2)}px exceeds 2px`);
          }
          if (row.direction !== row.expectedDirection) {
            failures.push(`${context}: points ${row.direction}, expected ${row.expectedDirection}`);
          }
          if (Math.abs(row.size[0] - row.size[1]) > 0.1) {
            failures.push(`${context}: icon distorts to ${row.size.join(' × ')}px`);
          }
        }
      }
    }
    if (!measured && id !== 'nav-menu-compact') {
      failures.push(`${id} ${platform} ${theme}: no visible label/icon pairs`);
    }
  } finally {
    await evaluate(`(() => {
      document.documentElement.removeAttribute('dir');
      document.querySelector('#visual-root').style.removeProperty('inline-size');
    })()`);
    await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 660, deviceScaleFactor: 1, mobile: false });
  }
  return failures;
}
