import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PNG } from 'pngjs';

// Compare the rendered connector axis against the same frame with only the rails hidden.
// This tests paint order without approving new PNGs or fixing the expected colors in the test.
export async function checkStepperConnectors({ send, evaluate, id, theme, platform }) {
  const output = process.env.CM_STEPPER_SCREENSHOTS;
  if (output) await mkdir(output, { recursive: true });

  async function capture(filename) {
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const buffer = Buffer.from(data, 'base64');
    if (output && filename) await writeFile(join(output, filename + '.png'), buffer);
    return PNG.sync.read(buffer);
  }

  const failures = [];
  const initialLabel = await evaluate("document.querySelector('.cm-stepper__label').textContent");
  const combinations = [
    { direction: 'ltr', scale: 100 },
    { direction: 'ltr', scale: 200 },
    { direction: 'rtl', scale: 100 },
    { direction: 'rtl', scale: 200 },
  ];
  for (const { direction, scale } of combinations) {
    await evaluate(`document.documentElement.dir = '${direction}'`);
    if (scale === 200) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: 320,
        height: 660,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await evaluate(`(() => {
        document.documentElement.style.fontSize = '200%';
        const host = document.querySelector('#visual-root');
        host.style.inlineSize = '100%';
        host.style.padding = '16px';
      })()`);
    }

    try {
      const steps = ['initial'];
      if (id === 'stepper-vertical-start') steps.push('third-current');
      if (id === 'stepper-default' && scale === 200) steps.push('uneven-vertical');

      for (const step of steps) {
        if (id === 'stepper-vertical-start') {
          const value = step === 'initial' ? 'account' : 'review';
          await evaluate(`document.querySelector('[data-cm-stepper-value="${value}"]').click()`);
        }
        if (step === 'uneven-vertical') {
          await evaluate(`(() => {
            document.querySelector('.cm-stepper').classList.add('cm-stepper--vertical');
            document.querySelector('.cm-stepper__label').textContent = 'Prepare the international project and assemble the team';
          })()`);
        }
        const { vertical, markers, textFits, progressColor } = await evaluate(`(() => {
          const vertical = !!document.querySelector('.cm-stepper--vertical');
          const markers = [...document.querySelectorAll('.cm-stepper__marker')].map(marker => {
            const item = marker.closest('.cm-stepper__item');
            const state = ['complete', 'current', 'upcoming', 'disabled'].find(
              value => item.classList.contains('cm-stepper__item--' + value));
            const { x, y, width, height } = marker.getBoundingClientRect();
            return vertical
              ? { axis: x + width / 2, start: y, end: y + height, state }
              : { axis: y + height / 2, start: x, end: x + width, state };
          });
          const textFits = [...document.querySelectorAll('.cm-stepper__label, .cm-stepper__description')].every(
            text => {
              const { left, right } = text.closest('.cm-stepper__content').getBoundingClientRect();
              const range = document.createRange();
              range.selectNodeContents(text);
              return [...range.getClientRects()].every(rect => rect.left >= left - 1 && rect.right <= right + 1);
            });
          const stepper = document.querySelector('.cm-stepper');
          const canvas = document.createElement('canvas').getContext('2d');
          canvas.fillStyle = getComputedStyle(stepper).getPropertyValue('--cm-stepper-progress-color').trim();
          canvas.fillRect(0, 0, 1, 1);
          return { vertical, markers, textFits, progressColor: [...canvas.getImageData(0, 0, 1, 1).data] };
        })()`);
        const filename = [platform, theme, id, direction, scale, step].join('--');
        if (!textFits) failures.push(`${filename}: step text overflows its column`);
        if (step === 'third-current' && markers.at(-1)?.state !== 'current') {
          failures.push(`${filename}: activating the third step failed`);
        }
        const visible = await capture(filename);
        await evaluate(`(() => {
          const style = document.createElement('style');
          style.id = 'visual-hide-stepper-connectors';
          style.textContent = '.cm-stepper__list::before, .cm-stepper__list::after, .cm-stepper__connector { visibility: hidden !important; }';
          document.head.append(style);
        })()`);
        const hidden = await capture();
        await evaluate("document.getElementById('visual-hide-stepper-connectors').remove()");

        const changed = (axis, position) => {
          const [x, y] = vertical ? [axis, position] : [position, axis];
          if (x < 0 || x >= visible.width || y < 0 || y >= visible.height) {
            throw new Error(`${filename}: connector axis is outside the screenshot`);
          }
          const offset = (y * visible.width + x) * 4;
          return visible.data.readUInt32BE(offset) !== hidden.data.readUInt32BE(offset);
        };

        const orderedMarkers = !vertical && direction === 'rtl' ? markers.toReversed() : markers;
        for (const [index, marker] of orderedMarkers.entries()) {
          const axis = Math.floor(marker.axis);
          const ring = marker.state === 'current' ? 1 : 0;
          // Include a pixel inside the active shadow, but skip fractional outer edges.
          for (let position = Math.ceil(marker.start) - ring; position < Math.floor(marker.end) + ring; position++) {
            if (changed(axis, position)) {
              failures.push(`${filename}: connector paints over marker ${index + 1} (${marker.state}) or its ring`);
              break;
            }
          }

          const next = orderedMarkers[index + 1];
          if (!next) continue;
          const start = Math.ceil(marker.end) + 2;
          const end = Math.floor(next.start) - 2;
          if (start >= end) failures.push(`${filename}: no visible gap after marker ${index + 1}`);
          for (let position = start; position < end; position++) {
            if (!changed(axis, position)) {
              failures.push(`${filename}: connector is interrupted after marker ${index + 1}`);
              break;
            }
          }
        }
        if (step === 'uneven-vertical') {
          const [first, current, last] = markers;
          const axis = Math.floor(first.axis);
          for (const position of [Math.floor(first.start) - 4, Math.ceil(last.end) + 4]) {
            if (changed(axis, position)) failures.push(`${filename}: rail extends past its endpoint marker`);
          }
          const end = Math.floor(current.start) - 4;
          const pixel = (end * visible.width + axis) * 4;
          if (!progressColor.every((channel, index) => Math.abs(channel - visible.data[pixel + index]) <= 1)) {
            failures.push(`${filename}: completed rail does not reach the active marker after a wrapped row`);
          }
        }
      }
    } finally {
      await evaluate("document.documentElement.removeAttribute('dir')");
      if (scale === 200) {
        await evaluate(`(() => {
          document.documentElement.style.removeProperty('font-size');
          const host = document.querySelector('#visual-root');
          host.style.removeProperty('inline-size');
          host.style.removeProperty('padding');
          if ('${id}' === 'stepper-default') {
            document.querySelector('.cm-stepper').classList.remove('cm-stepper--vertical');
            document.querySelector('.cm-stepper__label').textContent = ${JSON.stringify(initialLabel)};
          }
        })()`);
        await send('Emulation.setDeviceMetricsOverride', {
          width: 360,
          height: 660,
          deviceScaleFactor: 1,
          mobile: false,
        });
      }
    }
  }
  return failures;
}
