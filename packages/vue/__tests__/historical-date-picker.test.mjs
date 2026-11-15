import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToString } from '@vue/server-renderer';
import { h } from 'vue';

import { VfDatePicker } from '@codemonster-ru/ui-vue/historical';

test('server-renders the opt-in DatePicker with a stable trigger, Monday and formatted ISO value', async () => {
  const html = await renderToString(
    h(VfDatePicker, { 'aria-label': 'Launch date', modelValue: '2026-08-13', locale: 'en-GB', name: 'launch_date' }),
  );
  const calendarId = /aria-controls="([^"]+)"/u.exec(html)?.[1];
  assert.ok(calendarId);
  assert.ok(html.includes(`id="${calendarId}"`));
  assert.match(html, /data-cm-date-picker-teleport-to="body"/u);
  assert.match(html, /role="columnheader">Mon/u);
  assert.match(html, /name="launch_date" value="2026-08-13"/u);
  assert.match(html, /cm-date-picker__value">13\/08\/26</u);
});
