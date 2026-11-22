import { createIconGeometry } from './geometry.js';

const up = '<path d="M0 8v11"/><path d="M0 4 3.6 9H-3.6Z" fill="currentColor" stroke-width="1"/>';
const upLeft = `<g transform="translate(6 0)">${up}</g>`;
const downLeft = `<g transform="translate(6 24) scale(1 -1)">${up}</g>`;
const downRight = `<g transform="translate(17.5 24) scale(1 -1)">${up}</g>`;
const ascendingBars = '<path d="M12.5 8h3m-3 5.5h5.5m-5.5 5.5h8.5"/>';
const descendingBars = `<g transform="translate(0 24) scale(1 -1)">${ascendingBars}</g>`;

function sortGeometry(primary: string, secondary: string) {
  const solidStroke = 'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
  const outline = primary + secondary;
  const duotone = `${primary}<g color="var(--vf-icon-secondary-color, currentColor)" opacity="var(--vf-icon-secondary-opacity, 0.4)">${secondary}</g>`;
  return createIconGeometry([
    `<g ${solidStroke}>${outline}</g>`,
    outline,
    1,
    1,
    `<g ${solidStroke}>${duotone}</g>`,
    duotone,
    5,
    5,
  ]);
}

export const sortNeutral = /* @__PURE__ */ sortGeometry(upLeft, downRight);
export const sortAscending = /* @__PURE__ */ sortGeometry(upLeft, ascendingBars);
export const sortDescending = /* @__PURE__ */ sortGeometry(downLeft, descendingBars);
