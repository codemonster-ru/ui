import { defineComponent, h, useId, type PropType, type SVGAttributes } from 'vue';
import { iconFamilies, type IconFamily } from '../iconFamilies';
import { iconStrokeWidths, iconVariants, type IconVariant, type OutlineIconVariant } from '../iconVariants';
import solidIconDataJson from './solidIconData.json';

const solidIconData = solidIconDataJson as Partial<Record<OutlineIconName, { viewBox: string; body: string }>>;
const CLASSIC_SOLID_KEY_BODY =
  '<defs><mask id="vf-solid-key"><path d="M8.75 11.25A7.25 7.25 0 1 1 12.75 15.5l-2 2H7.5v4H2v-3.75Z" fill="white" stroke="white" stroke-width="1.5" stroke-linejoin="round"/><circle cx="15.5" cy="8.75" r="2.25" fill="black"/></mask></defs><rect width="24" height="24" fill="currentColor" mask="url(#vf-solid-key)"/>';
const classicSolidBodyOverrides: Partial<Record<OutlineIconName, string>> = {
  key: CLASSIC_SOLID_KEY_BODY,
  layers:
    '<path d="m3.5 7.5 8.5-4.25 8.5 4.25L12 11.75Z" fill="currentColor" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M3.5 11.75 12 16l8.5-4.25M3.5 16 12 20.25 20.5 16" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/>',
  magnifyingGlass:
    '<defs><mask id="vf-solid-magnifying-glass"><rect width="24" height="24" fill="black"/><circle cx="10.25" cy="10.25" r="7.75" fill="white"/><circle cx="10.25" cy="10.25" r="4.25" fill="black"/><path d="m15.5 15.5 5.25 5.25" stroke="white" stroke-width="3.5" stroke-linecap="round"/></mask></defs><rect width="24" height="24" fill="currentColor" mask="url(#vf-solid-magnifying-glass)"/>',
  users:
    '<circle cx="12" cy="6.5" r="3.5" fill="currentColor"/><circle cx="4.75" cy="8.75" r="2.5" fill="currentColor"/><circle cx="19.25" cy="8.75" r="2.5" fill="currentColor"/><path fill="currentColor" d="M6 21c.25-5.1 2.45-8 6-8s5.75 2.9 6 8ZM.75 20v-1.5c0-3.7 1.45-6 4-6 1.05 0 1.9.4 2.55 1.15C5.8 15.4 5 17.85 4.9 20Zm18.35 0c-.1-2.15-.9-4.6-2.4-6.35a3.25 3.25 0 0 1 2.55-1.15c2.55 0 4 2.3 4 6V20Z"/>',
};
const SECONDARY_PAINT = 'var(--vf-icon-secondary-paint, currentColor)';
const SECONDARY_OPACITY = 'var(--vf-icon-secondary-part-opacity, 0.4)';
const SOLID_STROKE_DUOTONE_OUTER_STROKE_WIDTH = 3;
const solidStrokeDuotoneInnerStrokeWidths = {
  regular: 1.25,
  light: 1.75,
  thin: 2.25,
} as const;
const REFRESH_DUOTONE_ARCS_PATH = 'M3.54 8.92A9 9 0 0 1 18.36 5.64M20.46 15.08A9 9 0 0 1 5.64 18.36';
const REFRESH_DUOTONE_ARROWHEADS_PATH = 'M22 9.5 13.5 8l7-6.5ZM2 14.5l8.5 1.5-7 6.5Z';
const ROTATE_RIGHT_DUOTONE_ARC_PATH = 'M18.36 18.36A9 9 0 1 1 18.36 5.64';
const ROTATE_RIGHT_DUOTONE_ARROWHEAD_PATH = 'M22 9.5 13.5 8l7-6.5Z';
const HISTORY_DUOTONE_ARC_PATH = 'M5.64 18.36A9 9 0 1 0 5.64 5.64';
const HISTORY_DUOTONE_ARROWHEAD_PATH = 'M2 9.5 10.5 8l-7-6.5Z';
const HISTORY_DUOTONE_HANDS_PATH = 'M12 7.25V12l3.75 2.25';
const INFO_DUOTONE_PATH = 'M9.25 10.25H12v7M9.25 17.25h5.5';
const QUESTION_DUOTONE_PATH = 'M6.5 7.5a5.5 5.5 0 1 1 8 4.9C12.75 13.35 12 14.5 12 16';
const SOLID_STROKE_DUOTONE_PATHS = {
  circleNotch: 'M8.56 3.68A9 9 0 1 0 15.44 3.68',
  code: 'M7 7.25 2.5 12 7 16.75M14 3.5l-4 17m7-13.25 4.5 4.75-4.5 4.75',
} as const;
const SOLID_DUOTONE_BOOKMARK_PATH = 'M7 3h10a2 2 0 0 1 2 2v16l-7-4.5L5 21V5a2 2 0 0 1 2-2Z';
const SOLID_DUOTONE_PATHS = {
  arrowUp: 'M5.5 11.5 12 4.5l6.5 7h-4.75v8h-3.5v-8Z',
  arrowUpLong: 'M4.75 9.75 12 1.5l7.25 8.25h-5.5V22.5h-3.5V9.75Z',
  arrowDown: 'M5.5 12.5 12 19.5l6.5-7h-4.75v-8h-3.5v8Z',
  arrowDownLong: 'M4.75 14.25 12 22.5l7.25-8.25h-5.5V1.5h-3.5v12.75Z',
  arrowLeft: 'M11.5 5.5 4.5 12l7 6.5v-4.75h8v-3.5h-8Z',
  arrowLeftLong: 'M9.75 4.75 1.5 12l8.25 7.25v-5.5H22.5v-3.5H9.75Z',
  arrowRight: 'M12.5 5.5 19.5 12l-7 6.5v-4.75h-8v-3.5h8Z',
  arrowRightLong: 'M14.25 4.75 22.5 12l-8.25 7.25v-5.5H1.5v-3.5h12.75Z',
  arrowTurnUpLeft:
    'M9.25 10.5V5.25L2.5 12l6.75 6.75V13.5H16A5.5 5.5 0 0 0 21.5 8V6.75a1.5 1.5 0 0 0-3 0V8a2.5 2.5 0 0 1-2.5 2.5Z',
  arrowTurnUpRight:
    'M14.75 10.5V5.25L21.5 12l-6.75 6.75V13.5H8A5.5 5.5 0 0 1 2.5 8V6.75a1.5 1.5 0 0 1 3 0V8A2.5 2.5 0 0 0 8 10.5Z',
  arrowTurnLeftDown:
    'M10.5 14.75H5.25L12 21.5l6.75-6.75H13.5V8A5.5 5.5 0 0 0 8 2.5H6.75a1.5 1.5 0 0 0 0 3H8A2.5 2.5 0 0 1 10.5 8Z',
  arrowTurnRightUp:
    'M10.5 9.25H5.25L12 2.5l6.75 6.75H13.5V16A5.5 5.5 0 0 1 8 21.5H6.75a1.5 1.5 0 0 1 0-3H8a2.5 2.5 0 0 0 2.5-2.5Z',
  caretDown: 'm7.25 9.25 4.75 5.5 4.75-5.5Z',
  caretLeft: 'm14.75 7.25-5.5 4.75 5.5 4.75Z',
  caretRight: 'm9.25 7.25 5.5 4.75-5.5 4.75Z',
  caretUp: 'm7.25 14.75 4.75-5.5 4.75 5.5Z',
  chevronDown: 'm6.65 7.15-2.3 2.3L12 17.1l7.65-7.65-2.3-2.3L12 12.5Z',
  chevronLeft: 'm16.85 6.65-2.3-2.3L6.9 12l7.65 7.65 2.3-2.3L11.5 12Z',
  chevronRight: 'm7.15 6.65 2.3-2.3L17.1 12l-7.65 7.65-2.3-2.3L12.5 12Z',
  chevronUp: 'm6.65 16.85-2.3-2.3L12 6.9l7.65 7.65-2.3 2.3L12 11.5Z',
  check: 'm2.7 12.15 2.55-2.5 4.15 4.1 9.35-9.3 2.55 2.5L9.4 18.8Z',
  download: 'M10.25 2h3.5v9.75l3.4-3.4 2.5 2.5L12 17.25l-7.65-6.4 2.5-2.5 3.4 3.4ZM3 18.25h18v3H3Z',
  bars: 'M4 4.5h16a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3ZM4 10.5h16a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3ZM4 16.5h16a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3Z',
  ellipsis:
    'M5 9.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 1 1 0-4.5ZM12 9.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 1 1 0-4.5ZM19 9.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 1 1 0-4.5Z',
  logIn:
    'M15.5 2H19a3.5 3.5 0 0 1 3.5 3.5v13A3.5 3.5 0 0 1 19 22h-3.5a1.5 1.5 0 0 1 0-3H19a.5.5 0 0 0 .5-.5v-13A.5.5 0 0 0 19 5h-3.5a1.5 1.5 0 0 1 0-3ZM3 10.25h9V7.5l4.5 4.5-4.5 4.5v-2.75H3Z',
  logOut:
    'M8.5 2H5a3.5 3.5 0 0 0-3.5 3.5v13A3.5 3.5 0 0 0 5 22h3.5a1.5 1.5 0 0 0 0-3H5a.5.5 0 0 1-.5-.5v-13A.5.5 0 0 1 5 5h3.5a1.5 1.5 0 0 0 0-3ZM7.5 10.25h9V7.5L21 12l-4.5 4.5v-2.75h-9Z',
  minus: 'M3 10.25h18v3.5H3Z',
  plus: 'M10.25 3h3.5v7.25H21v3.5h-7.25V21h-3.5v-7.25H3v-3.5h7.25Z',
  upload: 'M10.25 17.25h3.5v-8.5l3.4 3.4 2.5-2.5L12 2 4.35 9.65l2.5 2.5 3.4-3.4ZM3 18.25h18v3H3Z',
  xmark: 'm6.2 3.8 5.8 5.8 5.8-5.8 2.4 2.4-5.8 5.8 5.8 5.8-2.4 2.4-5.8-5.8-5.8 5.8-2.4-2.4 5.8-5.8-5.8-5.8Z',
} as const;
const SOLID_DUOTONE_CHECK_PRIMARY_PATH = 'M9.4 13.75 18.75 4.45l2.55 2.5L9.4 18.8Z';
const SOLID_DUOTONE_CHEVRON_PRIMARY_PATHS = {
  chevronDown: 'M12 12.5v4.6l7.65-7.65-2.3-2.3Z',
  chevronLeft: 'M11.5 12H6.9l7.65 7.65 2.3-2.3Z',
  chevronRight: 'M12.5 12h4.6L9.45 4.35l-2.3 2.3Z',
  chevronUp: 'M12 11.5V6.9l-7.65 7.65 2.3 2.3Z',
} as const;
const SOLID_DUOTONE_FILTER_PATH = 'M3 3.5h18l-7 8V20l-4-2v-6.5Z';
const SOLID_DUOTONE_FILTER_PRIMARY_PATH = 'M10 11.5h4V20l-4-2Z';
const SOLID_DUOTONE_GLOBE_PRIMARY_CLIP_PATH =
  'M12 2c-3.35 2.8-5 6.15-5 10s1.65 7.2 5 10c3.35-2.8 5-6.15 5-10S15.35 4.8 12 2Z';
const SOLID_DUOTONE_KEY_PRIMARY_CLIP_PATH = 'M0 23.842 24 0.474V24H0Z';
const SOLID_DUOTONE_LOWER_RIGHT_CLIP_PATH = 'M0 24 24 0v24Z';
const SOLID_DUOTONE_SEND_PRIMARY_CLIP_PATH = 'M11.25 13.25 24-0.1375V24H0Z';
const SOLID_DUOTONE_XMARK_SECONDARY_PATH = 'M6.2 3.8 20.2 17.8 17.8 20.2 3.8 6.2Z';
const SOLID_DUOTONE_XMARK_PRIMARY_PATH = 'M17.8 3.8 20.2 6.2 6.2 20.2 3.8 17.8Z';
const solidDuotoneBorderStrokeWidths = {
  regular: 2.5,
  light: 1.75,
  thin: 1,
} as const;

type GeometryNode = {
  tag: 'circle' | 'line' | 'path' | 'polyline' | 'rect';
  attrs: SVGAttributes;
};

/* @__NO_SIDE_EFFECTS__ */
const path = (d: string, attrs: SVGAttributes = {}): GeometryNode => ({
  tag: 'path',
  attrs: { d, ...attrs },
});
/* @__NO_SIDE_EFFECTS__ */
const line = (x1: number, y1: number, x2: number, y2: number): GeometryNode => ({
  tag: 'line',
  attrs: { x1, y1, x2, y2 },
});
/* @__NO_SIDE_EFFECTS__ */
const circle = (cx: number, cy: number, r: number, attrs: SVGAttributes = {}): GeometryNode => ({
  tag: 'circle',
  attrs: { cx, cy, r, ...attrs },
});
/* @__NO_SIDE_EFFECTS__ */
const rect = (x: number, y: number, width: number, height: number, rx: number): GeometryNode => ({
  tag: 'rect',
  attrs: { x, y, width, height, rx },
});
/* @__NO_SIDE_EFFECTS__ */
const polyline = (points: string): GeometryNode => ({ tag: 'polyline', attrs: { points } });

export const outlineGeometry = {
  arrowLeft: [line(19, 12, 5, 12), polyline('10.25 6.75 5 12 10.25 17.25')],
  arrowRight: [line(5, 12, 19, 12), polyline('13.75 6.75 19 12 13.75 17.25')],
  arrowUp: [line(12, 19, 12, 5), polyline('6.75 10.25 12 5 17.25 10.25')],
  arrowDown: [line(12, 5, 12, 19), polyline('6.75 13.75 12 19 17.25 13.75')],
  arrowLeftLong: [line(21.5, 12, 2.5, 12), polyline('8.25 6.25 2.5 12 8.25 17.75')],
  arrowRightLong: [line(2.5, 12, 21.5, 12), polyline('15.75 6.25 21.5 12 15.75 17.75')],
  arrowUpLong: [line(12, 21.5, 12, 2.5), polyline('6.25 8.25 12 2.5 17.75 8.25')],
  arrowDownLong: [line(12, 2.5, 12, 21.5), polyline('6.25 15.75 12 21.5 17.75 15.75')],
  arrowTurnUpLeft: [path('M20.5 6.25V8a4 4 0 0 1-4 4h-13'), polyline('9.25 6.25 3.5 12 9.25 17.75')],
  arrowTurnUpRight: [path('M3.5 6.25V8a4 4 0 0 0 4 4h13'), polyline('14.75 6.25 20.5 12 14.75 17.75')],
  arrowTurnRightUp: [path('M6.25 20.5H8a4 4 0 0 0 4-4v-13'), polyline('6.25 9.25 12 3.5 17.75 9.25')],
  arrowTurnLeftDown: [path('M6.25 3.5H8a4 4 0 0 1 4 4v13'), polyline('6.25 14.75 12 20.5 17.75 14.75')],
  logIn: [
    path('M15.5 3.5H19a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-3.5'),
    line(3, 12, 16.5, 12),
    polyline('12 7.5 16.5 12 12 16.5'),
  ],
  logOut: [
    path('M8.5 3.5H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h3.5'),
    line(7.5, 12, 21, 12),
    polyline('16.5 7.5 21 12 16.5 16.5'),
  ],
  filter: [path('M3 3.5h18l-7 8V20l-4-2v-6.5Z')],
  funnelX: [
    path('M2.25 2.5h18l-5.5 6'),
    path('M2.25 2.5l7 8v6'),
    circle(16.75, 16.5, 5),
    line(14.81, 14.56, 18.69, 18.44),
    line(18.69, 14.56, 14.81, 18.44),
  ],
  chevronLeft: [polyline('15.25 5.75 9 12 15.25 18.25')],
  chevronRight: [polyline('8.75 5.75 15 12 8.75 18.25')],
  chevronUp: [polyline('5.75 15.25 12 9 18.25 15.25')],
  chevronDown: [polyline('5.75 8.75 12 15 18.25 8.75')],
  caretLeft: [polyline('14 8.25 10.25 12 14 15.75')],
  caretRight: [polyline('10 8.25 13.75 12 10 15.75')],
  caretUp: [polyline('8.25 14 12 10.25 15.75 14')],
  caretDown: [polyline('8.25 10 12 13.75 15.75 10')],
  check: [polyline('3.75 12.25 9.25 17.5 20.25 6.5')],
  xmark: [line(5.75, 5.75, 18.25, 18.25), line(18.25, 5.75, 5.75, 18.25)],
  plus: [line(12, 4.75, 12, 19.25), line(4.75, 12, 19.25, 12)],
  minus: [line(4.75, 12, 19.25, 12)],
  magnifyingGlass: [circle(10.5, 10.5, 6.5), line(15.25, 15.25, 20.25, 20.25)],
  gear: [
    path(
      'M9.7 3.4 10.2 2h3.6l.5 1.4c.15.43.5.76.94.9l1.42.46c.43.14.9.06 1.27-.2l1.2-.86 2.55 2.55-.86 1.2c-.26.37-.34.84-.2 1.27l.46 1.42c.14.44.47.79.9.94l1.4.5v3.6l-1.4.5c-.43.15-.76.5-.9.94l-.46 1.42c-.14.43-.06.9.2 1.27l.86 1.2-2.55 2.55-1.2-.86c-.37-.26-.84-.34-1.27-.2l-1.42.46c-.44.14-.79.47-.94.9l-.5 1.4h-3.6l-.5-1.4a1.46 1.46 0 0 0-.94-.9l-1.42-.46c-.43-.14-.9-.06-1.27.2l-1.2.86-2.55-2.55.86-1.2c.26-.37.34-.84.2-1.27l-.46-1.42a1.46 1.46 0 0 0-.9-.94l-1.4-.5v-3.6l1.4-.5c.43-.15.76-.5.9-.94l.46-1.42c.14-.43.06-.9-.2-1.27l-.86-1.2L4.87 3.7l1.2.86c.37.26.84.34 1.27.2l1.42-.46c.44-.14.79-.47.94-.9Z',
      { transform: 'translate(1.656 .62) scale(.862)' },
    ),
    circle(12, 12, 2.72),
  ],
  house: [path('M3.5 10.75 12 3.6l8.5 7.15'), path('M5.25 9.5v10.25h13.5V9.5'), path('M9.25 19.75v-5.5h5.5v5.5')],
  user: [circle(12, 7.75, 3.25), path('M5.5 20c.35-4.1 2.75-6.25 6.5-6.25s6.15 2.15 6.5 6.25')],
  users: [
    circle(12, 6.75, 2.65),
    circle(5.75, 8.5, 1.75),
    circle(18.25, 8.5, 1.75),
    path('M2.25 20v-1.25C2.25 15.4 3.5 13.5 5.75 13.5c1.08 0 1.93.44 2.52 1.26'),
    path('M21.75 20v-1.25c0-3.35-1.25-5.25-3.5-5.25-1.08 0-1.93.44-2.52 1.26'),
    path('M7 20v-1c0-3.75 1.85-6 5-6s5 2.25 5 6v1'),
  ],
  userPlus: [
    circle(12, 7.75, 3.25, { transform: 'translate(-2.75)' }),
    path('M5.5 20c.35-4.1 2.75-6.25 6.5-6.25s6.15 2.15 6.5 6.25', { transform: 'translate(-2.75)' }),
    line(18.5, 5, 18.5, 11.5),
    line(15.25, 8.25, 21.75, 8.25),
  ],
  userMinus: [
    circle(12, 7.75, 3.25, { transform: 'translate(-2.75)' }),
    path('M5.5 20c.35-4.1 2.75-6.25 6.5-6.25s6.15 2.15 6.5 6.25', { transform: 'translate(-2.75)' }),
    line(15.25, 8.25, 21.75, 8.25),
  ],
  userCheck: [
    circle(12, 7.75, 3.25, { transform: 'translate(-2.75)' }),
    path('M5.5 20c.35-4.1 2.75-6.25 6.5-6.25s6.15 2.15 6.5 6.25', { transform: 'translate(-2.75)' }),
    polyline('15.25 8.25 17.5 10.5 21.75 5.5'),
  ],
  file: [path('M6 2.75h7l5 5v13.5H6z'), path('M13 2.75v5h5')],
  fileText: [
    path('M6 2.75h7l5 5v13.5H6z'),
    path('M13 2.75v5h5'),
    line(8.5, 12.25, 15.5, 12.25),
    line(8.5, 16.25, 15.5, 16.25),
  ],
  folder: [
    path('M2.75 6.25h6l1.75 2h10.75v10.5a2 2 0 0 1-2 2H4.75a2 2 0 0 1-2-2Z', {
      transform: 'translate(0 -1.25)',
    }),
    path('M2.75 9h18.5', { transform: 'translate(0 -1.25)' }),
  ],
  folderOpen: [
    path('M2.75 20.75V6.25a1.5 1.5 0 0 1 1.5-1.5H9l2 2h7.75a1.5 1.5 0 0 1 1.5 1.5V10', {
      transform: 'translate(-.375 -.75)',
    }),
    path('M6 9.75h14.25a1.75 1.75 0 0 1 1.7 2.2l-2 7.5a1.75 1.75 0 0 1-1.7 1.3H2.75Z', {
      transform: 'translate(-.375 -.75)',
    }),
  ],
  calendar: [
    rect(3, 4.25, 18, 16.5, 2),
    line(3, 9, 21, 9),
    line(7.5, 2.75, 7.5, 6),
    line(16.5, 2.75, 16.5, 6),
    path('M7.5 12.5h.01M12 12.5h.01M16.5 12.5h.01M7.5 16.5h.01M12 16.5h.01M16.5 16.5h.01'),
  ],
  bell: [
    path('M5.25 16.25v-6a6.75 6.75 0 0 1 13.5 0v6l1.5 2H3.75Z', { transform: 'translate(0 -.25)' }),
    path('M9.25 20.25c.65.8 1.55 1.25 2.75 1.25s2.1-.45 2.75-1.25', {
      transform: 'translate(0 -.25)',
    }),
  ],
  warning: [
    path('M10.35 3.9 2.8 18.1a1.65 1.65 0 0 0 1.45 2.4h15.5a1.65 1.65 0 0 0 1.45-2.4L13.65 3.9a1.86 1.86 0 0 0-3.3 0Z'),
    line(12, 8.25, 12, 13.75),
    path('M12 17.25h.01'),
  ],
  infoCircle: [circle(12, 12, 9), path('M12 10.75v6M12 7.25h.01')],
  info: [path('M9.25 10.25H12v7M9.25 17.25h5.5'), circle(12, 6.25, 1.375, { fill: 'currentColor', stroke: 'none' })],
  question: [
    path('M7 8a5 5 0 1 1 7.35 4.42C12.8 13.25 12 14.25 12 16'),
    circle(12, 20.25, 1.375, { fill: 'currentColor', stroke: 'none' }),
  ],
  questionCircle: [
    circle(12, 12, 9),
    path('M9.25 8.75a2.75 2.75 0 1 1 4.05 2.44C12.45 11.75 12 12.4 12 13.5M12 17.25h.01'),
  ],
  alertCircle: [circle(12, 12, 9), line(12, 7.25, 12, 13.25), path('M12 17.25h.01')],
  checkCircle: [circle(12, 12, 9), polyline('8.25 12.25 10.75 14.75 16 9.5')],
  xCircle: [circle(12, 12, 9), line(8.5, 8.5, 15.5, 15.5), line(15.5, 8.5, 8.5, 15.5)],
  ban: [circle(12, 12, 9), line(5.75, 5.75, 18.25, 18.25)],
  eye: [
    path('M2.75 12C5.15 8.1 8.25 6 12 6s6.85 2.1 9.25 6c-2.4 3.9-5.5 6-9.25 6S5.15 15.9 2.75 12Z'),
    circle(12, 12, 3.25),
  ],
  eyeSlash: [
    path('M2.75 12C5.15 8.1 8.25 6 12 6s6.85 2.1 9.25 6c-2.4 3.9-5.5 6-9.25 6S5.15 15.9 2.75 12Z'),
    circle(12, 12, 3.25),
    line(4, 4, 20, 20),
  ],
  sun: [
    circle(12, 12, 4),
    line(12, 2.75, 12, 5),
    line(12, 19, 12, 21.25),
    line(2.75, 12, 5, 12),
    line(19, 12, 21.25, 12),
    line(4.5, 4.5, 6.25, 6.25),
    line(17.75, 17.75, 19.5, 19.5),
    line(19.5, 4.5, 17.75, 6.25),
    line(6.25, 17.75, 4.5, 19.5),
  ],
  moon: [path('M20 15.25A8.5 8.5 0 1 1 10 3.5a7.75 7.75 0 0 0 10 11.75Z')],
  circleHalf: [path('M12 3a9 9 0 0 0 0 18Z', { fill: 'currentColor', stroke: 'none' }), circle(12, 12, 9)],
  clock: [circle(12, 12, 9), path('M12 7.25V12l3.75 2.25')],
  history: [path('M3.6 8.25A9 9 0 1 1 3.75 16'), polyline('3.5 4.5 3.5 8.5 7.5 8.5'), path('M12 7.25V12l3.75 2.25')],
  refresh: [
    path('M3.54 8.92A9 9 0 0 1 18.36 5.64L21 8.5'),
    polyline('14.5 8.5 21 8.5 21 3'),
    path('M20.46 15.08A9 9 0 0 1 5.64 18.36L3 15.5'),
    polyline('9.5 15.5 3 15.5 3 21'),
  ],
  rotateRight: [path('M18.36 18.36A9 9 0 1 1 18.36 5.64L21 8.5'), polyline('14.5 8.5 21 8.5 21 3')],
  circleNotch: [path('M9.67 3.31A9 9 0 1 0 14.33 3.31')],
  copy: [
    path('M6.5 17.5H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l4 4v.5'),
    path('M8.5 6.5h7l5 5V19a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z'),
    path('M15.5 6.5v5h5'),
  ],
  clipboard: [
    path('M8.25 4.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-2.25'),
    rect(8.25, 2.5, 7.5, 4.5, 1.5),
  ],
  inbox: [
    path('M4.75 3.75h14.5l2.25 9.5v5a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-5Z'),
    path('M2.5 13.25h5l1.5 2.5h6l1.5-2.5h5'),
  ],
  archive: [path('M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8'), rect(2.5, 3.5, 19, 4.5, 1.25), line(9, 12, 15, 12)],
  server: [
    rect(3, 2.75, 18, 7.5, 2),
    rect(3, 13.75, 18, 7.5, 2),
    line(6.5, 6.5, 12.5, 6.5),
    path('M17.5 6.5h.01'),
    line(6.5, 17.5, 12.5, 17.5),
    path('M17.5 17.5h.01'),
  ],
  hardDrive: [
    path('M5 3.25h14l2.5 8.75v6.75A2.25 2.25 0 0 1 19.25 21H4.75a2.25 2.25 0 0 1-2.25-2.25V12Z'),
    line(2.5, 12, 21.5, 12),
    line(6.25, 16.75, 13.25, 16.75),
    path('M17.5 16.75h.01'),
  ],
  terminal: [polyline('3.5 5 10 12 3.5 19'), line(12.25, 19, 20.5, 19)],
  code: [polyline('7.75 7.25 3 12 7.75 16.75'), line(14.25, 3, 9.75, 21), polyline('16.25 7.25 21 12 16.25 16.75')],
  creditCard: [
    rect(2.5, 4.25, 19, 15.5, 2),
    line(2.5, 9.25, 21.5, 9.25),
    line(6, 15.5, 10.5, 15.5),
    line(13.5, 15.5, 17, 15.5),
  ],
  wallet: [rect(2.75, 4.75, 18.5, 14.5, 2.5), path('M15 9.25h6.25v6H15a3 3 0 0 1 0-6Z'), path('M17.5 12.25h.01')],
  receipt: [
    path('M5 3l2 1.5L9 3l2 1.5L13 3l2 1.5L17 3l2 1.5V21l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L7 21l-2-1.5Z'),
    line(8, 9, 16, 9),
    line(8, 13, 16, 13),
    line(8, 17, 13.5, 17),
  ],
  building: [
    rect(5, 2.5, 14, 19, 2.5),
    rect(8.75, 6.75, 1, 1, 0),
    rect(14.25, 6.75, 1, 1, 0),
    rect(8.75, 12.25, 1, 1, 0),
    rect(14.25, 12.25, 1, 1, 0),
    path('M11 21.5v-5h2v5'),
  ],
  briefcase: [
    rect(2.5, 6.5, 19, 14.5, 2),
    path('M8.5 6.5v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2'),
    path('M2.5 12.5h8M13.5 12.5h8'),
    rect(10.5, 11.5, 3, 2, 0.5),
  ],
  expand: [polyline('15 3 21 3 21 9'), line(14, 10, 21, 3), polyline('9 21 3 21 3 15'), line(3, 21, 10, 14)],
  collapse: [line(3, 21, 9, 15), polyline('9 21 9 15 3 15'), line(15, 9, 21, 3), polyline('15 3 15 9 21 9')],
  sliders: [
    line(3, 6, 6, 6),
    circle(8, 6, 2),
    line(10, 6, 21, 6),
    line(3, 12, 14, 12),
    circle(16, 12, 2),
    line(18, 12, 21, 12),
    line(3, 18, 8, 18),
    circle(10, 18, 2),
    line(12, 18, 21, 18),
  ],
  sort: [path('M4 9.5h16L12 2.5Z'), path('M4 14.5h16L12 21.5Z')],
  bars: [line(3.25, 6, 20.75, 6), line(3.25, 12, 20.75, 12), line(3.25, 18, 20.75, 18)],
  ellipsis: [circle(5, 12, 1), circle(12, 12, 1), circle(19, 12, 1)],
  bookmark: [path('M7 3h10a2 2 0 0 1 2 2v16l-7-4.5L5 21V5a2 2 0 0 1 2-2Z')],
  heart: [
    path('M12 21 4.1 13.7C-.2 9.8 2.2 3.25 7 3.25c2.2 0 3.9 1.15 5 3 1.1-1.85 2.8-3 5-3 4.8 0 7.2 6.55 2.9 10.45Z'),
  ],
  star: [path('M12 2.75l2.85 5.78 6.4.93-4.63 4.51 1.09 6.37L12 17.33l-5.71 3.01 1.09-6.37-4.63-4.51 6.4-.93Z')],
  shield: [path('M12 2.75 20 6v5.5c0 5-3.1 8.4-8 10-4.9-1.6-8-5-8-10V6Z')],
  key: [path('M8.75 11.25A7.25 7.25 0 1 1 12.75 15.5l-2 2H7.5v4H2v-3.75Z')],
  share: [
    line(7.75, 10.7, 16.25, 6.55),
    line(7.75, 13.3, 16.25, 17.45),
    circle(5.25, 12, 2.75),
    circle(18.75, 5.25, 2.75),
    circle(18.75, 18.75, 2.75),
  ],
  send: [path('M3 11 21 3l-6 18-3.5-8Z'), line(11.5, 13, 21, 3)],
  phone: [
    path(
      'M6.25 3.5 9.5 7.65a1.5 1.5 0 0 1-.2 2.05l-1.7 1.45a13 13 0 0 0 5.25 5.25l1.45-1.7a1.5 1.5 0 0 1 2.05-.2l4.15 3.25a1.5 1.5 0 0 1-.15 2.45l-1.1.65a3 3 0 0 1-2 .4C9.35 20.5 3.5 14.65 3.5 7.55a3 3 0 0 1 .4-2l.65-1.1A1.5 1.5 0 0 1 6.25 3.5Z',
    ),
  ],
  cpu: [
    rect(5, 5, 14, 14, 2),
    rect(9, 9, 6, 6, 1),
    line(9, 2.5, 9, 5),
    line(15, 2.5, 15, 5),
    line(9, 19, 9, 21.5),
    line(15, 19, 15, 21.5),
    line(2.5, 9, 5, 9),
    line(2.5, 15, 5, 15),
    line(19, 9, 21.5, 9),
    line(19, 15, 21.5, 15),
  ],
  plug: [line(9, 3, 9, 8), line(15, 3, 15, 8), path('M5.5 8h13v4a6.5 6.5 0 0 1-13 0Z'), line(12, 18.5, 12, 21)],
  activity: [polyline('2.5 12 6.5 12 9 6 13 18 16 11 21.5 11')],
  sparkles: [
    path('M14.5 3c.5 3.55 2.45 5.5 6 6-3.55.5-5.5 2.45-6 6-.5-3.55-2.45-5.5-6-6 3.55-.5 5.5-2.45 6-6Z'),
    path('M6 14.5c.25 1.75 1.25 2.75 3.5 3-2.25.25-3.25 1.25-3.5 3-.25-1.75-1.25-2.75-3.5-3 2.25-.25 3.25-1.25 3.5-3Z'),
  ],
  globe: [
    circle(12, 12, 9),
    path('M12 3c-3 2.5-4.5 5.5-4.5 9s1.5 6.5 4.5 9c3-2.5 4.5-5.5 4.5-9S15 5.5 12 3Z'),
    line(12, 3, 12, 21),
    line(3, 12, 21, 12),
  ],
  layers: [
    polyline('3.5 7.5 12 3.25 20.5 7.5 12 11.75 3.5 7.5'),
    polyline('3.5 11.75 12 16 20.5 11.75'),
    polyline('3.5 16 12 20.25 20.5 16'),
  ],
  link: [
    path('M14.1 11.1c0-2-1.6-3.5-3.8-3.5-1 0-1.8.4-2.5 1.1l-2.4 2.4c-2.2 2.2-2.2 4.4-.2 6 1.3 1.2 3.3 1.3 4.8.2'),
    path('M9.9 12.1c0 1.9 1.6 3.2 3.6 3.2 1 0 1.8-.4 2.5-1.1l2.7-2.7c2.1-2.1 2.1-4.5.1-5.7-1.3-.8-3.3-.9-4.7 0'),
  ],
  externalLink: [
    path('M11 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6'),
    line(11, 13, 21, 3),
    polyline('15 3 21 3 21 9'),
  ],
  lock: [rect(4.75, 10, 14.5, 10.75, 2), path('M7.75 10V7.25a4.25 4.25 0 0 1 8.5 0V10'), path('M12 14.25v2.25')],
  unlock: [rect(4.75, 10, 14.5, 10.75, 2), path('M7.75 10V7.25a4.25 4.25 0 0 1 7.25-3'), path('M12 14.25v2.25')],
  grid: [
    rect(3.5, 3.5, 7, 7, 1.5),
    rect(13.5, 3.5, 7, 7, 1.5),
    rect(3.5, 13.5, 7, 7, 1.5),
    rect(13.5, 13.5, 7, 7, 1.5),
  ],
  chartBar: [path('M4 3.25v16.5h16.5'), path('M8 16v-3.5M12.5 16V8.5M17 16V5.25')],
  columns: [
    rect(2.75, 3.5, 18.5, 17, 2),
    line(2.75, 8.5, 21.25, 8.5),
    line(9, 8.5, 9, 20.5),
    line(15.25, 8.5, 15.25, 20.5),
  ],
  mail: [rect(2.75, 5.25, 18.5, 13.5, 2), path('m3.5 6 7.25 6a2 2 0 0 0 2.5 0l7.25-6')],
  cloud: [path('M6.4 19.25h11.35a3.75 3.75 0 0 0 .4-7.48A6.25 6.25 0 0 0 6.3 9.5a4.9 4.9 0 0 0 .1 9.75Z')],
  database: [
    path('M4.25 6.25c0-2 3.47-3.5 7.75-3.5s7.75 1.5 7.75 3.5-3.47 3.5-7.75 3.5-7.75-1.5-7.75-3.5Z'),
    path('M4.25 6.25v5.75c0 2 3.47 3.5 7.75 3.5s7.75-1.5 7.75-3.5V6.25'),
    path('M4.25 12v5.75c0 2 3.47 3.5 7.75 3.5s7.75-1.5 7.75-3.5V12'),
  ],
  pencil: [
    path('M4 20l1.1-4.4L16.25 4.45a2.15 2.15 0 0 1 3.05 0l.25.25a2.15 2.15 0 0 1 0 3.05L8.4 18.9Z'),
    line(14.9, 5.8, 18.2, 9.1),
  ],
  trash: [
    path('M5.25 8.25h13.5l-1 12.25H6.25Z'),
    line(4, 5.25, 20, 5.25),
    path('M9 5.25V3.5h6v1.75M9.5 11v5.75M14.5 11v5.75'),
  ],
  download: [line(12, 3, 12, 15), polyline('7.5 10.75 12 15.25 16.5 10.75'), path('M4 17.25v3h16v-3')],
  upload: [line(12, 15.25, 12, 3.25), polyline('7.5 7.5 12 3 16.5 7.5'), path('M4 17.25v3h16v-3')],
  message: [
    path(
      'M4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v8.5A2.75 2.75 0 0 1 19.25 18H10l-5.5 3v-3.05A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4Z',
    ),
    path('M7.25 9h9.5M7.25 13h6'),
  ],
} as const satisfies Record<string, GeometryNode[]>;

export type OutlineIconName = keyof typeof outlineGeometry;

const outlineDuotoneFillIconNames =
  ' columns grid clipboard copy externalLink filter funnelX pencil send sort trash archive bell bookmark briefcase building calendar cloud cpu creditCard database file fileText folder folderOpen gear globe hardDrive heart house inbox key layers lock magnifyingGlass mail message phone plug receipt server share sliders star unlock user userCheck userMinus userPlus users wallet alertCircle ban checkCircle circleHalf clock eye eyeSlash infoCircle moon questionCircle shield sparkles sun warning xCircle ';
const outlineDuotoneTwoFillNodeNames =
  ' clipboard copy archive cpu file fileText folderOpen gear globe layers server sliders user userCheck userMinus userPlus wallet eye eyeSlash sparkles ';

const createOutlineDuotoneFillNodes = (name: OutlineIconName, fill: string) => {
  if (name === 'externalLink') {
    return [h('rect', { x: 3, y: 5, width: 16, height: 16, rx: 2, fill })];
  }

  if (name === 'funnelX') {
    return [h('path', { d: 'M2.25 2.5h18l-7 8v6l-4-2v-4Z', fill }), h('circle', { cx: 16.75, cy: 16.5, r: 5, fill })];
  }

  if (name === 'house') {
    return [h('path', { d: 'M3.5 10.75 12 3.6l8.5 7.15-1.75-1.25v10.25H5.25V9.5Z', fill })];
  }

  if (name === 'circleHalf') {
    return [h('circle', { cx: 12, cy: 12, r: 9, fill })];
  }

  if (name === 'database') {
    return [
      h('path', {
        d: 'M4.25 6.25c0-2 3.47-3.5 7.75-3.5s7.75 1.5 7.75 3.5v11.5c0 2-3.47 3.5-7.75 3.5s-7.75-1.5-7.75-3.5Z',
        fill,
      }),
    ];
  }

  if (name === 'key') {
    return [h('circle', { cx: 15.5, cy: 8.75, r: 6.5, fill })];
  }

  if (name === 'sliders') {
    return [1, 4, 7].map((nodeIndex) => {
      const node = outlineGeometry[name][nodeIndex];

      return h(node.tag, { ...node.attrs, fill, stroke: 'none' });
    });
  }

  if (!outlineDuotoneFillIconNames.includes(` ${name} `)) {
    return [];
  }

  const nodes = outlineGeometry[name];
  const fillNodeIndexes =
    name === 'building' || name === 'users'
      ? nodes.map((_, nodeIndex) => nodeIndex)
      : name === 'grid'
        ? [0, 1, 2, 3]
        : name === 'briefcase'
          ? [0, 1, 3]
          : name === 'share'
            ? [2, 3, 4]
            : name === 'layers'
              ? [0]
              : name === 'plug'
                ? [2]
                : outlineDuotoneTwoFillNodeNames.includes(` ${name} `)
                  ? [0, 1]
                  : [0];

  return fillNodeIndexes.map((nodeIndex) => {
    const node = nodes[nodeIndex];

    return h(node.tag, {
      ...node.attrs,
      fill,
      stroke: 'none',
    });
  });
};

const chartBarDuotoneRects = [
  { x: 6.25, y: 11.5, width: 3.5, height: 4.5 },
  { x: 10.75, y: 7.5, width: 3.5, height: 8.5 },
  { x: 15.25, y: 4.25, width: 3.5, height: 11.75 },
] as const;

const solidArrowheadPoints: Partial<Record<OutlineIconName, string>> = {
  arrowDown: '5.5 12.5 12 19.5 18.5 12.5',
  arrowDownLong: '4.75 14.25 12 22.5 19.25 14.25',
  arrowLeft: '11.5 5.5 4.5 12 11.5 18.5',
  arrowLeftLong: '9.75 4.75 1.5 12 9.75 19.25',
  arrowRight: '12.5 5.5 19.5 12 12.5 18.5',
  arrowRightLong: '14.25 4.75 22.5 12 14.25 19.25',
  arrowUp: '5.5 11.5 12 4.5 18.5 11.5',
  arrowUpLong: '4.75 9.75 12 1.5 19.25 9.75',
  arrowTurnUpLeft: '9.25 5.25 2.5 12 9.25 18.75',
  arrowTurnUpRight: '14.75 5.25 21.5 12 14.75 18.75',
  arrowTurnRightUp: '5.25 9.25 12 2.5 18.75 9.25',
  arrowTurnLeftDown: '5.25 14.75 12 21.5 18.75 14.75',
};

const solidMaskOnlyNames = new Set<OutlineIconName>(['briefcase', 'calendar', 'cpu']);

const scopeSvgIds = (body: string, suffix: string) => {
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);

  return ids.reduce(
    (scopedBody, id) =>
      scopedBody.replaceAll(`id="${id}"`, `id="${id}-${suffix}"`).replaceAll(`url(#${id})`, `url(#${id}-${suffix})`),
    body,
  );
};

type SecondaryPartPosition = 'first' | 'first-two' | 'middle' | 'last' | 'outer' | 'rear-users';

const applySecondaryPaintToPart = (body: string, position: SecondaryPartPosition) => {
  const paints = [...body.matchAll(/(fill|stroke)="currentColor"/g)];
  const targetIndexes = new Set(
    position === 'outer'
      ? [paints[0]?.index, paints.at(-1)?.index]
      : position === 'first-two'
        ? paints.slice(0, 2).map((paint) => paint.index)
        : position === 'rear-users'
          ? paints.slice(1, 4).map((paint) => paint.index)
          : [
              position === 'first'
                ? paints[0]?.index
                : position === 'middle'
                  ? paints[Math.floor(paints.length / 2)]?.index
                  : paints.at(-1)?.index,
            ],
  );

  return body.replace(
    /(fill|stroke)="currentColor"/g,
    (attribute, paintAttribute: 'fill' | 'stroke', offset: number) => {
      if (!targetIndexes.has(offset)) {
        return attribute;
      }

      return `${paintAttribute}="${SECONDARY_PAINT}" ${paintAttribute}-opacity="${SECONDARY_OPACITY}"`;
    },
  );
};

const countSolidPaintParts = (body: string) =>
  (body.match(/<(?:circle|ellipse|line|path|polygon|polyline|rect)\b[^>]*(?:fill|stroke)="currentColor"[^>]*>/g) ?? [])
    .length;

const getSolidSecondaryPartPosition = (name: OutlineIconName): SecondaryPartPosition => {
  if (name === 'bars' || name === 'ellipsis' || name === 'layers') {
    return 'middle';
  }

  if (name === 'grid') {
    return 'outer';
  }

  if (name === 'ban' || name === 'key' || name === 'magnifyingGlass' || name === 'question' || name === 'terminal') {
    return 'last';
  }

  if (name === 'userCheck' || name === 'userMinus' || name === 'userPlus') {
    return 'first-two';
  }

  if (name === 'users') {
    return 'rear-users';
  }

  return name.startsWith('arrow') ? 'last' : 'first';
};

const createSecondaryMaskNodes = (name: OutlineIconName, paint: 'black' | 'white') => {
  const arrowheadPoints = solidArrowheadPoints[name];

  if (arrowheadPoints) {
    return [
      h('polygon', {
        points: arrowheadPoints,
        fill: paint,
        stroke: paint,
        'stroke-width': 1,
        'stroke-linejoin': 'round',
      }),
    ];
  }

  if (name === 'archive') {
    return [h('rect', { x: 0, y: 8.25, width: 24, height: 15.75, fill: paint })];
  }

  if (name === 'bell') {
    return [
      h('path', {
        transform: 'translate(0 -.75)',
        d: 'M3 18.5c1.4-1.7 2-3.35 2-5V10a7 7 0 0 1 14 0v3.5c0 1.65.6 3.3 2 5 .55.7.05 1.75-.85 1.75H3.85c-.9 0-1.4-1.05-.85-1.75Z',
        fill: paint,
      }),
    ];
  }

  if (name === 'chartBar') {
    return [
      h('rect', { x: 8, y: 13, width: 3, height: 4, fill: paint }),
      h('rect', { x: 13, y: 8, width: 3, height: 9, fill: paint }),
      h('rect', { x: 18, y: 4, width: 3, height: 13, fill: paint }),
    ];
  }

  if (name === 'code') {
    return [
      h('path', {
        d: 'M14 3.5l-4 17',
        fill: 'none',
        stroke: paint,
        'stroke-width': 2.75,
        'stroke-linecap': 'round',
      }),
    ];
  }

  if (name === 'cpu') {
    return [
      h('rect', {
        x: 5,
        y: 5,
        width: 14,
        height: 14,
        rx: 2,
        fill: 'none',
        stroke: paint,
        'stroke-width': 2.75,
      }),
    ];
  }

  if (name === 'creditCard') {
    return [h('rect', { x: 0, y: 0, width: 24, height: 9.25, fill: paint })];
  }

  if (name === 'briefcase') {
    const inversePaint = paint === 'white' ? 'black' : 'white';

    return [
      h('rect', { x: 0, y: 6, width: 24, height: 6.5, fill: paint }),
      h('path', {
        d: 'M8.5 7V4.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7',
        fill: 'none',
        stroke: inversePaint,
        'stroke-width': 3,
        'stroke-linejoin': 'round',
      }),
    ];
  }

  if (name === 'calendar') {
    return [h('rect', { transform: 'translate(0 -.75)', x: 0, y: 0, width: 24, height: 9, fill: paint })];
  }

  if (name === 'clipboard') {
    const inversePaint = paint === 'white' ? 'black' : 'white';

    return [
      h('rect', { x: 3, y: 4, width: 18, height: 18, rx: 3, fill: paint }),
      h('rect', {
        x: 7.5,
        y: 1.75,
        width: 9,
        height: 6,
        rx: 2,
        fill: inversePaint,
        stroke: inversePaint,
        'stroke-width': 1.5,
      }),
    ];
  }

  if (name === 'copy') {
    return [
      h('path', {
        d: 'M8.5 6.5h7l5 5V19a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z',
        fill: paint,
      }),
    ];
  }

  if (name === 'download') {
    return [
      h('path', {
        d: 'M10.25 2h3.5v9.75l3.4-3.4 2.5 2.5L12 17.25l-7.65-6.4 2.5-2.5 3.4 3.4Z',
        fill: paint,
      }),
    ];
  }

  if (name === 'externalLink') {
    return [
      h('path', {
        d: 'M11 13 21 3M15 3h6v6',
        fill: 'none',
        stroke: paint,
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    ];
  }

  if (name === 'file' || name === 'fileText') {
    const inversePaint = paint === 'white' ? 'black' : 'white';

    return [
      h('path', { d: 'M5 2h9l5 5v15H5Z', fill: paint }),
      h('path', { d: 'M14 2 19 7v1h-5Z', fill: inversePaint }),
    ];
  }

  if (name === 'folder') {
    return [h('rect', { x: 0, y: 7.75, width: 24, height: 16.25, fill: paint })];
  }

  if (name === 'folderOpen') {
    return [
      h('path', {
        d: 'M5.5 9h14.25a1.75 1.75 0 0 1 1.7 2.2l-2 7.5a1.75 1.75 0 0 1-1.7 1.3H2.5Z',
        fill: paint,
      }),
    ];
  }

  if (name === 'hardDrive') {
    return [h('rect', { x: 0, y: 12, width: 24, height: 12, fill: paint })];
  }

  if (name === 'inbox') {
    return [
      h('path', {
        d: 'M0 0h24v13.25h-7.5l-1.5 2.5H9l-1.5-2.5H0Z',
        fill: paint,
      }),
    ];
  }

  if (name === 'funnelX') {
    return [h('circle', { cx: 16.75, cy: 16.5, r: 5.5, fill: paint })];
  }

  if (name === 'link') {
    return [
      h('path', {
        d: 'M9.9 12.1c0 1.9 1.6 3.2 3.6 3.2 1 0 1.8-.4 2.5-1.1l2.7-2.7c2.1-2.1 2.1-4.5.1-5.7-1.3-.8-3.3-.9-4.7 0',
        fill: 'none',
        stroke: paint,
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    ];
  }

  if (name === 'pencil') {
    return [
      h('path', {
        d: 'M4.15 15.25 15 4.4 19.6 9 8.75 19.85Z',
        fill: paint,
      }),
    ];
  }

  if (name === 'sort') {
    return [
      h('path', {
        d: 'M4 14.5h16L12 21.5Z',
        fill: paint,
        stroke: paint,
        'stroke-width': 1.5,
        'stroke-linejoin': 'round',
      }),
    ];
  }

  if (name === 'server') {
    return [h('rect', { x: 2.5, y: 2.25, width: 19, height: 8.5, rx: 2.5, fill: paint })];
  }

  if (name === 'upload') {
    return [h('rect', { x: 3, y: 18.25, width: 18, height: 3, fill: paint })];
  }

  if (name === 'columns') {
    return [h('rect', { x: 0, y: 0, width: 24, height: 8, fill: paint })];
  }

  if (name === 'collapse') {
    return [
      h('path', {
        d: 'M21 3l-6 6m0-6v6h6',
        fill: 'none',
        stroke: paint,
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    ];
  }

  if (name === 'expand') {
    return [
      h('path', {
        d: 'M14 10 21 3m-6 0h6v6',
        fill: 'none',
        stroke: paint,
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    ];
  }

  const nodes = outlineGeometry[name];

  if (nodes.length === 1) {
    return [h('rect', { x: 0, y: 0, width: 24, height: 12, fill: paint })];
  }

  const secondaryNode = name.startsWith('arrow') ? nodes.at(-1)! : nodes[0];

  return [
    h(secondaryNode.tag, {
      ...secondaryNode.attrs,
      fill: 'none',
      stroke: paint,
      'stroke-width': 3.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  ];
};

/* @__NO_SIDE_EFFECTS__ */
export const createOutlineIcon = (name: OutlineIconName) => {
  return defineComponent({
    name: `Vf${name.charAt(0).toUpperCase()}${name.slice(1)}Icon`,
    inheritAttrs: false,
    props: {
      size: {
        type: [Number, String] as PropType<number | string>,
        default: 'var(--vf-icon-current-size, var(--vf-icon-size-md))',
      },
      variant: {
        type: String as PropType<IconVariant>,
        default: 'regular',
        validator: (value: string) => iconVariants.includes(value as IconVariant),
      },
      family: {
        type: String as PropType<IconFamily>,
        default: 'classic',
        validator: (value: string) => iconFamilies.includes(value as IconFamily),
      },
      secondaryColor: {
        type: String,
        default: 'var(--vf-icon-secondary-color, currentColor)',
      },
      secondaryOpacity: {
        type: [Number, String] as PropType<number | string>,
        default: 'var(--vf-icon-secondary-opacity, 0.4)',
      },
    },
    setup(props, { attrs }) {
      const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

      return () => {
        if (props.variant === 'solid') {
          const solidIcon = solidIconData[name];

          if (!solidIcon) {
            throw new Error(`Missing solid geometry for icon "${name}".`);
          }

          const svgAttrs = {
            ...attrs,
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: solidIcon.viewBox,
            width: props.size,
            height: props.size,
            fill: 'none',
          };

          if (props.family === 'classic') {
            return h('svg', {
              ...svgAttrs,
              innerHTML: classicSolidBodyOverrides[name] ?? solidIcon.body,
            });
          }

          const scopedBody = scopeSvgIds(solidIcon.body, instanceId);

          if (name === 'building') {
            return h('svg', svgAttrs, [
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', { fill: 'currentColor' }, [
                h('rect', { x: 8, y: 6, width: 2.5, height: 2.5, rx: 0.5 }),
                h('rect', { x: 13.5, y: 6, width: 2.5, height: 2.5, rx: 0.5 }),
                h('rect', { x: 8, y: 11.5, width: 2.5, height: 2.5, rx: 0.5 }),
                h('rect', { x: 13.5, y: 11.5, width: 2.5, height: 2.5, rx: 0.5 }),
                h('rect', { x: 10.5, y: 16.25, width: 3, height: 5.75, rx: 0.5 }),
              ]),
            ]);
          }

          if (name === 'database') {
            const separatorClipId = `vf-duotone-database-separators-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: separatorClipId }, [
                  h('path', {
                    d: 'M4.25 6.25c0-2 3.47-3.5 7.75-3.5s7.75 1.5 7.75 3.5v11.5c0 2-3.47 3.5-7.75 3.5s-7.75-1.5-7.75-3.5Z',
                  }),
                ]),
              ]),
              h(
                'g',
                {
                  color: props.secondaryColor,
                  opacity: props.secondaryOpacity,
                },
                [
                  h('path', {
                    transform: 'translate(-1.2 -1.2) scale(1.1)',
                    fill: 'currentColor',
                    d: 'M4.25 6.25c0-2 3.47-3.5 7.75-3.5s7.75 1.5 7.75 3.5v11.5c0 2-3.47 3.5-7.75 3.5s-7.75-1.5-7.75-3.5Z',
                  }),
                ],
              ),
              h('path', {
                transform: 'translate(-1.2 -1.2) scale(1.1)',
                d: 'M4.25 8.5C5.75 10.1 8.5 11 12 11s6.25-.9 7.75-2.5M4.25 13.75c1.5 1.6 4.25 2.5 7.75 2.5s6.25-.9 7.75-2.5',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': 1.4,
                'stroke-linecap': 'butt',
                'clip-path': `url(#${separatorClipId})`,
              }),
            ]);
          }

          if (name === 'alertCircle') {
            return h('svg', svgAttrs, [
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', { fill: 'currentColor' }, [
                h('rect', { x: 10.7, y: 6.5, width: 2.6, height: 7.5, rx: 1.3 }),
                h('circle', { cx: 12, cy: 17.5, r: 1.35 }),
              ]),
            ]);
          }

          if (name === 'checkCircle') {
            return h('svg', svgAttrs, [
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('path', {
                d: 'm7.5 12.2 3 3 6-6',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': 2.4,
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
              }),
            ]);
          }

          if (name === 'circleHalf') {
            const splitGradientId = `vf-duotone-circle-half-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h(
                  'linearGradient',
                  { id: splitGradientId, x1: 2, y1: 12, x2: 22, y2: 12, gradientUnits: 'userSpaceOnUse' },
                  [
                    h('stop', { offset: '0%', 'stop-color': 'currentColor' }),
                    h('stop', { offset: '50%', 'stop-color': 'currentColor' }),
                    h('stop', {
                      offset: '50%',
                      'stop-color': props.secondaryColor,
                      'stop-opacity': props.secondaryOpacity,
                    }),
                    h('stop', {
                      offset: '100%',
                      'stop-color': props.secondaryColor,
                      'stop-opacity': props.secondaryOpacity,
                    }),
                  ],
                ),
              ]),
              h('circle', { cx: 12, cy: 12, r: 10, fill: `url(#${splitGradientId})` }),
            ]);
          }

          if (name === 'clock') {
            return h('svg', svgAttrs, [
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('path', {
                d: 'M12 6.75V12l4 2.5',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': 2.5,
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
              }),
            ]);
          }

          if (name === 'eye') {
            return h('svg', svgAttrs, [
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('circle', { cx: 12, cy: 12, r: 1.5, fill: 'currentColor' }),
            ]);
          }

          if (name === 'history') {
            return h('svg', svgAttrs, [
              h('g', { color: props.secondaryColor, opacity: props.secondaryOpacity }, [
                h('path', {
                  d: 'M5.64 18.36A9 9 0 1 0 5.64 5.64',
                  fill: 'none',
                  stroke: 'currentColor',
                  'stroke-width': 3,
                  'stroke-linecap': 'round',
                }),
                h('path', {
                  transform: 'translate(-.75)',
                  d: 'M2 9.5 10.5 8l-7-6.5Z',
                  fill: 'currentColor',
                  stroke: 'currentColor',
                  'stroke-width': 0.5,
                  'stroke-linejoin': 'round',
                }),
              ]),
              h('path', {
                d: 'M12 7.25V12l3.75 2.25',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': 2.5,
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
              }),
            ]);
          }

          if (name === 'infoCircle') {
            return h('svg', svgAttrs, [
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', { fill: 'currentColor' }, [
                h('circle', { cx: 12, cy: 7, r: 1.35 }),
                h('rect', { x: 10.65, y: 10, width: 2.7, height: 7.5, rx: 1.35 }),
              ]),
            ]);
          }

          if (name === 'questionCircle') {
            return h('svg', svgAttrs, [
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('path', {
                d: 'M8.8 8.7a3.3 3.3 0 1 1 4.8 2.95C12.5 12.25 12 13 12 14',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': 2.2,
                'stroke-linecap': 'round',
              }),
              h('circle', { cx: 12, cy: 17.5, r: 1.25, fill: 'currentColor' }),
            ]);
          }

          if (name === 'sparkles') {
            return h('svg', svgAttrs, [
              h('path', {
                d: 'M14.5 3c.5 3.55 2.45 5.5 6 6-3.55.5-5.5 2.45-6 6-.5-3.55-2.45-5.5-6-6 3.55-.5 5.5-2.45 6-6Z',
                fill: 'currentColor',
                stroke: 'currentColor',
                'stroke-width': 1.75,
                'stroke-linejoin': 'round',
              }),
              h('g', { color: props.secondaryColor, opacity: props.secondaryOpacity }, [
                h('path', {
                  d: 'M6 14.5c.25 1.75 1.25 2.75 3.5 3-2.25.25-3.25 1.25-3.5 3-.25-1.75-1.25-2.75-3.5-3 2.25-.25 3.25-1.25 3.5-3Z',
                  fill: 'currentColor',
                  stroke: 'currentColor',
                  'stroke-width': 1.75,
                  'stroke-linejoin': 'round',
                }),
              ]),
            ]);
          }

          if (name === 'warning') {
            return h('svg', svgAttrs, [
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', { fill: 'currentColor' }, [
                h('rect', { x: 10.7, y: 8, width: 2.6, height: 7, rx: 1.3 }),
                h('circle', { cx: 12, cy: 18.25, r: 1.4 }),
              ]),
            ]);
          }

          if (name === 'xCircle') {
            return h('svg', svgAttrs, [
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('path', {
                d: 'm8.5 8.5 7 7m0-7-7 7',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': 2.4,
                'stroke-linecap': 'round',
              }),
            ]);
          }

          if (name === 'wallet') {
            const claspMaskId = `vf-duotone-wallet-clasp-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('mask', { id: claspMaskId }, [
                  h('path', {
                    d: 'M21.25 9.25H15a3 3 0 0 0 0 6h6.25Z',
                    fill: 'white',
                  }),
                ]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', {
                mask: `url(#${claspMaskId})`,
                innerHTML: scopeSvgIds(solidIcon.body, `${instanceId}-clasp`),
              }),
            ]);
          }

          if (name === 'caretDown' || name === 'caretLeft' || name === 'caretRight' || name === 'caretUp') {
            const primaryHalfClipId = `vf-duotone-${name}-half-${instanceId}`;
            const isVerticalSplit = name === 'caretDown' || name === 'caretUp';

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryHalfClipId }, [
                  h(
                    'rect',
                    isVerticalSplit ? { x: 12, y: 0, width: 12, height: 24 } : { x: 0, y: 12, width: 24, height: 12 },
                  ),
                ]),
              ]),
              h('path', {
                d: SOLID_DUOTONE_PATHS[name],
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
              }),
              h('path', {
                d: SOLID_DUOTONE_PATHS[name],
                fill: 'currentColor',
                'clip-path': `url(#${primaryHalfClipId})`,
              }),
            ]);
          }

          if (name === 'chevronDown' || name === 'chevronLeft' || name === 'chevronRight' || name === 'chevronUp') {
            return h('svg', svgAttrs, [
              h('path', {
                d: SOLID_DUOTONE_PATHS[name],
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
              }),
              h('path', {
                d: SOLID_DUOTONE_CHEVRON_PRIMARY_PATHS[name],
                fill: 'currentColor',
              }),
            ]);
          }

          if (name === 'minus') {
            const primaryHalfClipId = `vf-duotone-minus-half-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryHalfClipId }, [h('rect', { x: 12, y: 0, width: 12, height: 24 })]),
              ]),
              h('path', {
                d: SOLID_DUOTONE_PATHS.minus,
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
              }),
              h('path', {
                d: SOLID_DUOTONE_PATHS.minus,
                fill: 'currentColor',
                'clip-path': `url(#${primaryHalfClipId})`,
              }),
            ]);
          }

          if (name === 'check') {
            return h('svg', svgAttrs, [
              h('path', {
                d: SOLID_DUOTONE_PATHS.check,
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
              }),
              h('path', {
                d: SOLID_DUOTONE_CHECK_PRIMARY_PATH,
                fill: 'currentColor',
              }),
            ]);
          }

          if (name === 'filter') {
            return h('svg', svgAttrs, [
              h('path', {
                d: SOLID_DUOTONE_FILTER_PATH,
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
                stroke: props.secondaryColor,
                'stroke-width': 0.5,
                'stroke-linejoin': 'round',
              }),
              h('path', {
                d: SOLID_DUOTONE_FILTER_PRIMARY_PATH,
                fill: 'currentColor',
                stroke: 'currentColor',
                'stroke-width': 0.5,
                'stroke-linejoin': 'round',
              }),
            ]);
          }

          if (name === 'plus') {
            return h('svg', svgAttrs, [
              h('path', {
                d: 'M3 10.25h18v3.5H3Z',
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
              }),
              h('path', {
                d: 'M10.25 3h3.5v18h-3.5Z',
                fill: 'currentColor',
              }),
            ]);
          }

          if (name === 'send') {
            const primaryFacetClipId = `vf-duotone-send-facet-${instanceId}`;
            const silhouetteMaskId = `vf-duotone-send-silhouette-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryFacetClipId }, [h('path', { d: SOLID_DUOTONE_SEND_PRIMARY_CLIP_PATH })]),
                h('mask', { id: silhouetteMaskId }, [
                  h('path', {
                    d: 'M3 11 21 3l-6 18-3.5-8Z',
                    fill: 'white',
                    stroke: 'white',
                    'stroke-width': 1.5,
                    'stroke-linejoin': 'round',
                  }),
                ]),
              ]),
              h('rect', {
                width: 24,
                height: 24,
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
                mask: `url(#${silhouetteMaskId})`,
              }),
              h('g', { 'clip-path': `url(#${primaryFacetClipId})` }, [
                h('rect', {
                  width: 24,
                  height: 24,
                  fill: 'currentColor',
                  mask: `url(#${silhouetteMaskId})`,
                }),
              ]),
            ]);
          }

          if (name === 'xmark') {
            return h('svg', svgAttrs, [
              h('path', {
                d: SOLID_DUOTONE_XMARK_SECONDARY_PATH,
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
              }),
              h('path', {
                d: SOLID_DUOTONE_XMARK_PRIMARY_PATH,
                fill: 'currentColor',
              }),
            ]);
          }

          if (name === 'bookmark') {
            const primaryHalfClipId = `vf-duotone-bookmark-half-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryHalfClipId }, [h('rect', { x: 12, y: 0, width: 12, height: 24 })]),
              ]),
              h('path', {
                d: SOLID_DUOTONE_BOOKMARK_PATH,
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
              }),
              h('path', {
                d: SOLID_DUOTONE_BOOKMARK_PATH,
                fill: 'currentColor',
                'clip-path': `url(#${primaryHalfClipId})`,
              }),
            ]);
          }

          if (name === 'gear') {
            const primaryRingMaskId = `vf-duotone-gear-ring-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('mask', { id: primaryRingMaskId }, [
                  h('circle', { cx: 12, cy: 12, r: 6, fill: 'white' }),
                  h('circle', { cx: 12, cy: 12, r: 3, fill: 'black' }),
                ]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('rect', {
                width: 24,
                height: 24,
                fill: 'currentColor',
                mask: `url(#${primaryRingMaskId})`,
              }),
            ]);
          }

          if (name === 'globe') {
            const primaryAreaClipId = `vf-duotone-globe-center-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryAreaClipId }, [h('path', { d: SOLID_DUOTONE_GLOBE_PRIMARY_CLIP_PATH })]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', {
                'clip-path': `url(#${primaryAreaClipId})`,
                innerHTML: scopeSvgIds(solidIcon.body, `${instanceId}-primary-area`),
              }),
            ]);
          }

          if (name === 'heart') {
            const primaryHalfClipId = `vf-duotone-heart-half-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryHalfClipId }, [h('rect', { x: 12, y: 0, width: 12, height: 24 })]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', {
                'clip-path': `url(#${primaryHalfClipId})`,
                innerHTML: solidIcon.body,
              }),
            ]);
          }

          if (name === 'house') {
            const primaryBodyMaskId = `vf-duotone-house-body-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('mask', { id: primaryBodyMaskId }, [
                  h('rect', { x: 5.5, y: 12.37, width: 13, height: 8.63, fill: 'white' }),
                  h('rect', { x: 9.5, y: 15, width: 5, height: 6, rx: 0.75, fill: 'black' }),
                ]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('rect', {
                width: 24,
                height: 24,
                fill: 'currentColor',
                mask: `url(#${primaryBodyMaskId})`,
              }),
            ]);
          }

          if (name === 'key') {
            const primaryHalfClipId = `vf-duotone-key-half-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryHalfClipId }, [h('path', { d: SOLID_DUOTONE_KEY_PRIMARY_CLIP_PATH })]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopeSvgIds(CLASSIC_SOLID_KEY_BODY, `${instanceId}-secondary-half`),
              }),
              h('g', {
                'clip-path': `url(#${primaryHalfClipId})`,
                innerHTML: scopeSvgIds(CLASSIC_SOLID_KEY_BODY, `${instanceId}-primary-half`),
              }),
            ]);
          }

          if (name === 'phone') {
            const primaryHalfClipId = `vf-duotone-phone-half-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryHalfClipId }, [h('path', { d: SOLID_DUOTONE_LOWER_RIGHT_CLIP_PATH })]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', {
                'clip-path': `url(#${primaryHalfClipId})`,
                innerHTML: solidIcon.body,
              }),
            ]);
          }

          if (name === 'receipt') {
            return h('svg', svgAttrs, [
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('path', {
                d: 'M8 9h8M8 13h8M8 17h5.5',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': 1.5,
                'stroke-linecap': 'round',
              }),
            ]);
          }

          if (name === 'star') {
            const primaryHalfClipId = `vf-duotone-star-half-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryHalfClipId }, [h('rect', { x: 12, y: 0, width: 12, height: 24 })]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', {
                'clip-path': `url(#${primaryHalfClipId})`,
                innerHTML: solidIcon.body,
              }),
            ]);
          }

          if (name === 'activity') {
            const primaryHalfClipId = `vf-duotone-activity-half-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryHalfClipId }, [h('rect', { x: 12, y: 0, width: 12, height: 24 })]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', {
                'clip-path': `url(#${primaryHalfClipId})`,
                innerHTML: solidIcon.body,
              }),
            ]);
          }

          if (name === 'circleNotch') {
            const primaryHalfClipId = `vf-duotone-circle-notch-half-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryHalfClipId }, [h('rect', { x: 12, y: 0, width: 12, height: 24 })]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', {
                'clip-path': `url(#${primaryHalfClipId})`,
                innerHTML: solidIcon.body,
              }),
            ]);
          }

          if (name === 'mail') {
            const bodyClipId = `vf-duotone-mail-body-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: bodyClipId }, [h('rect', { x: 1, y: 4, width: 22, height: 16, rx: 2.5 })]),
              ]),
              h('rect', {
                x: 1,
                y: 4,
                width: 22,
                height: 16,
                rx: 2.5,
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
              }),
              h('path', {
                d: 'M1 4h22v2.2h-2.2l-7.4 6.15a2.2 2.2 0 0 1-2.8 0L3.2 6.2H1Z',
                fill: 'currentColor',
                'clip-path': `url(#${bodyClipId})`,
              }),
            ]);
          }

          if (name === 'message') {
            return h('svg', svgAttrs, [
              h('g', { transform: 'translate(1 1) scale(.9167)' }, [
                h('path', {
                  fill: props.secondaryColor,
                  opacity: props.secondaryOpacity,
                  d: 'M4 2h16a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-8l-7 4v-4H4a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z',
                }),
                h('path', {
                  d: 'M6 8h12M6 13h8',
                  fill: 'none',
                  stroke: 'currentColor',
                  'stroke-width': 2,
                  'stroke-linecap': 'round',
                }),
              ]),
            ]);
          }

          if (name === 'moon') {
            const primaryAreaClipId = `vf-duotone-moon-diagonal-${instanceId}`;

            return h('svg', svgAttrs, [
              h('defs', [
                h('clipPath', { id: primaryAreaClipId }, [h('path', { d: SOLID_DUOTONE_LOWER_RIGHT_CLIP_PATH })]),
              ]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', {
                'clip-path': `url(#${primaryAreaClipId})`,
                innerHTML: solidIcon.body,
              }),
            ]);
          }

          if (name === 'cloud' || name === 'shield') {
            const primaryHalfClipId = `vf-duotone-${name}-half-${instanceId}`;
            const primaryHalfRect =
              name === 'cloud' ? { x: 0, y: 14, width: 24, height: 10 } : { x: 12, y: 0, width: 12, height: 24 };

            return h('svg', svgAttrs, [
              h('defs', [h('clipPath', { id: primaryHalfClipId }, [h('rect', primaryHalfRect)])]),
              h('g', {
                color: props.secondaryColor,
                opacity: props.secondaryOpacity,
                innerHTML: scopedBody,
              }),
              h('g', {
                'clip-path': `url(#${primaryHalfClipId})`,
                innerHTML: solidIcon.body,
              }),
            ]);
          }

          if (countSolidPaintParts(scopedBody) > 1 && !solidArrowheadPoints[name] && !solidMaskOnlyNames.has(name)) {
            return h('svg', svgAttrs, [
              h('g', {
                style: {
                  '--vf-icon-secondary-paint': props.secondaryColor,
                  '--vf-icon-secondary-part-opacity': props.secondaryOpacity,
                },
                innerHTML: applySecondaryPaintToPart(scopedBody, getSolidSecondaryPartPosition(name)),
              }),
            ]);
          }

          const primaryMaskId = `vf-duotone-primary-${name}-${instanceId}`;
          const secondaryMaskId = `vf-duotone-secondary-${name}-${instanceId}`;
          const primaryLayer = h('g', { mask: `url(#${primaryMaskId})`, innerHTML: scopedBody });
          const secondaryLayer = h('g', {
            color: props.secondaryColor,
            opacity: props.secondaryOpacity,
            mask: `url(#${secondaryMaskId})`,
            innerHTML: scopeSvgIds(solidIcon.body, `${instanceId}-secondary`),
          });

          return h('svg', svgAttrs, [
            h('defs', [
              h('mask', { id: primaryMaskId }, [
                h('rect', { x: 0, y: 0, width: 24, height: 24, fill: 'white' }),
                ...createSecondaryMaskNodes(name, 'black'),
              ]),
              h('mask', { id: secondaryMaskId }, createSecondaryMaskNodes(name, 'white')),
            ]),
            primaryLayer,
            secondaryLayer,
            ...(name === 'calendar'
              ? [
                  h('path', {
                    transform: 'translate(0 -.75)',
                    d: 'M7 3v3M17 3v3',
                    fill: 'none',
                    stroke: 'currentColor',
                    'stroke-width': 2,
                    'stroke-linecap': 'round',
                  }),
                ]
              : []),
            ...(name === 'fileText'
              ? [
                  h('path', {
                    d: 'M8.5 12.25h7m-7 4h7',
                    fill: 'none',
                    stroke: 'currentColor',
                    'stroke-width': 1.5,
                    'stroke-linecap': 'round',
                  }),
                ]
              : []),
          ]);
        }

        const outlineVariant = props.variant as OutlineIconVariant;
        const strokeWidth = iconStrokeWidths[outlineVariant];

        if (props.family === 'duotone' && name === 'chartBar') {
          return h(
            'svg',
            {
              ...attrs,
              xmlns: 'http://www.w3.org/2000/svg',
              viewBox: '0 0 24 24',
              width: props.size,
              height: props.size,
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': strokeWidth,
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            },
            [
              h('g', { fill: props.secondaryColor, opacity: props.secondaryOpacity, stroke: 'none' }, [
                ...chartBarDuotoneRects.map((bar) => h('rect', { ...bar, rx: 1 })),
              ]),
              h(outlineGeometry.chartBar[0].tag, outlineGeometry.chartBar[0].attrs),
              ...chartBarDuotoneRects.map((bar) => h('rect', { ...bar, rx: 1, fill: 'none' })),
            ],
          );
        }

        if (
          props.family === 'duotone' &&
          (name === 'refresh' || name === 'rotateRight' || name === 'history' || name === 'info' || name === 'question')
        ) {
          const isRotateRight = name === 'rotateRight';
          const isHistory = name === 'history';
          const isInfo = name === 'info';
          const isQuestion = name === 'question';
          const silhouetteMaskId = `vf-duotone-${name}-silhouette-${instanceId}`;
          const borderMaskId = `vf-duotone-${name}-border-${instanceId}`;
          const innerMaskId = `vf-duotone-${name}-inner-${instanceId}`;
          const outerStrokeWidth = isQuestion ? 3.25 : SOLID_STROKE_DUOTONE_OUTER_STROKE_WIDTH;
          const innerStrokeWidth =
            isRotateRight || isHistory || isInfo || isQuestion
              ? outerStrokeWidth - solidDuotoneBorderStrokeWidths[outlineVariant]
              : solidStrokeDuotoneInnerStrokeWidths[outlineVariant];
          const arrowheadInsetStrokeWidth = outerStrokeWidth - innerStrokeWidth;
          const handsInnerStrokeWidth = 2.5 - solidDuotoneBorderStrokeWidths[outlineVariant];
          const refreshArc = (stroke: string, width: number) =>
            h('path', {
              d: isQuestion
                ? QUESTION_DUOTONE_PATH
                : isInfo
                  ? INFO_DUOTONE_PATH
                  : isRotateRight
                    ? ROTATE_RIGHT_DUOTONE_ARC_PATH
                    : isHistory
                      ? HISTORY_DUOTONE_ARC_PATH
                      : REFRESH_DUOTONE_ARCS_PATH,
              fill: 'none',
              stroke,
              'stroke-width': width,
              'stroke-linecap': 'round',
            });
          const refreshArrowheads = (fill: string, stroke: string, width: number) =>
            isInfo || isQuestion
              ? h('circle', { cx: 12, cy: isQuestion ? 20.5 : 6.25, r: 1.75, fill, stroke, 'stroke-width': width })
              : h('path', {
                  d: isHistory
                    ? HISTORY_DUOTONE_ARROWHEAD_PATH
                    : isRotateRight
                      ? ROTATE_RIGHT_DUOTONE_ARROWHEAD_PATH
                      : REFRESH_DUOTONE_ARROWHEADS_PATH,
                  fill,
                  stroke,
                  'stroke-width': width,
                  'stroke-linejoin': 'round',
                  ...(isHistory ? { transform: 'translate(-.75)' } : {}),
                });
          const historyHands = (stroke: string, width: number) =>
            h('path', {
              d: HISTORY_DUOTONE_HANDS_PATH,
              fill: 'none',
              stroke,
              'stroke-width': width,
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            });

          return h(
            'svg',
            {
              ...attrs,
              xmlns: 'http://www.w3.org/2000/svg',
              viewBox: '0 0 24 24',
              width: props.size,
              height: props.size,
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': strokeWidth,
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            },
            [
              h('defs', [
                h('mask', { id: silhouetteMaskId, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 24, height: 24 }, [
                  refreshArc('white', outerStrokeWidth),
                  refreshArrowheads('white', 'white', isInfo || isQuestion ? 0 : 0.5),
                  ...(isHistory ? [historyHands('white', 2.5)] : []),
                ]),
                h('mask', { id: borderMaskId, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 24, height: 24 }, [
                  h('rect', { x: 0, y: 0, width: 24, height: 24, fill: 'white', stroke: 'none' }),
                  refreshArrowheads('black', 'white', arrowheadInsetStrokeWidth),
                  refreshArc('black', innerStrokeWidth),
                  ...(isHistory ? [historyHands('black', handsInnerStrokeWidth)] : []),
                ]),
                h('mask', { id: innerMaskId, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 24, height: 24 }, [
                  refreshArrowheads('white', 'black', arrowheadInsetStrokeWidth),
                  refreshArc('white', innerStrokeWidth),
                  ...(isHistory ? [historyHands('white', handsInnerStrokeWidth)] : []),
                ]),
              ]),
              h('g', { mask: `url(#${silhouetteMaskId})` }, [
                h('rect', {
                  x: 0,
                  y: 0,
                  width: 24,
                  height: 24,
                  fill: 'currentColor',
                  stroke: 'none',
                  mask: `url(#${borderMaskId})`,
                }),
              ]),
              h('rect', {
                x: 0,
                y: 0,
                width: 24,
                height: 24,
                fill: props.secondaryColor,
                opacity: props.secondaryOpacity,
                stroke: 'none',
                mask: `url(#${innerMaskId})`,
              }),
            ],
          );
        }

        const isSolidStrokeDuotone =
          props.family === 'duotone' &&
          (name === 'collapse' ||
            name === 'expand' ||
            name === 'link' ||
            name === 'code' ||
            name === 'terminal' ||
            name === 'activity' ||
            name === 'circleNotch');
        const solidDuotonePath =
          props.family === 'duotone' && name !== 'bars' && name !== 'ellipsis'
            ? SOLID_DUOTONE_PATHS[name as keyof typeof SOLID_DUOTONE_PATHS]
            : undefined;
        const geometry =
          props.family === 'duotone' && name === 'bars'
            ? [h(outlineGeometry.bars[1].tag, outlineGeometry.bars[1].attrs)]
            : props.family === 'duotone' && name === 'ellipsis'
              ? [h('circle', { cx: 12, cy: 12, r: 1.5, fill: 'currentColor', stroke: 'none' })]
              : [
                  ...outlineGeometry[name].map((node) => h(node.tag, node.attrs)),
                  ...(props.family === 'duotone' && name === 'key'
                    ? [h('circle', { cx: 15.5, cy: 8.75, r: 1.75, fill: 'currentColor', stroke: 'none' })]
                    : []),
                ];
        const solidStrokeDuotonePath = SOLID_STROKE_DUOTONE_PATHS[name as keyof typeof SOLID_STROKE_DUOTONE_PATHS];
        const solidStrokeDuotoneSourceGeometry: GeometryNode[] = solidStrokeDuotonePath
          ? [{ tag: 'path', attrs: { d: solidStrokeDuotonePath } }]
          : outlineGeometry[name];
        const solidStrokeDuotoneOuterStrokeWidth =
          name === 'code' ? 2.75 : name === 'circleNotch' ? 3.5 : SOLID_STROKE_DUOTONE_OUTER_STROKE_WIDTH;
        const solidStrokeDuotoneInnerStrokeWidth =
          name === 'code' || name === 'terminal' || name === 'activity' || name === 'circleNotch'
            ? solidStrokeDuotoneOuterStrokeWidth - solidDuotoneBorderStrokeWidths[outlineVariant]
            : solidStrokeDuotoneInnerStrokeWidths[outlineVariant];
        const solidStrokeDuotoneMaskGeometry = isSolidStrokeDuotone
          ? solidStrokeDuotoneSourceGeometry.map((node) =>
              h(node.tag, {
                ...node.attrs,
                fill: 'none',
                stroke: 'black',
                'stroke-width': solidStrokeDuotoneInnerStrokeWidth,
              }),
            )
          : [];
        const solidStrokeDuotoneSecondaryGeometry = isSolidStrokeDuotone
          ? solidStrokeDuotoneSourceGeometry.map((node) =>
              h(node.tag, {
                ...node.attrs,
                fill: 'none',
                stroke: props.secondaryColor,
                'stroke-width': solidStrokeDuotoneOuterStrokeWidth,
              }),
            )
          : [];
        const solidStrokeDuotonePrimaryGeometry = isSolidStrokeDuotone
          ? solidStrokeDuotoneSourceGeometry.map((node) =>
              h(node.tag, {
                ...node.attrs,
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': solidStrokeDuotoneOuterStrokeWidth,
              }),
            )
          : [];
        const duotoneFillGeometry =
          props.family !== 'duotone'
            ? []
            : name === 'bars'
              ? [outlineGeometry.bars[0], outlineGeometry.bars[2]].map((node) =>
                  h(node.tag, {
                    ...node.attrs,
                    stroke: props.secondaryColor,
                    'stroke-width': strokeWidth,
                  }),
                )
              : name === 'ellipsis'
                ? [5, 19].map((cx) => h('circle', { cx, cy: 12, r: 1.5, fill: props.secondaryColor }))
                : createOutlineDuotoneFillNodes(name, props.secondaryColor);
        const solidStrokeDuotoneMaskId = `vf-duotone-${name}-outline-${instanceId}`;
        const solidDuotoneClipId = `vf-duotone-${name}-${instanceId}`;
        const solidDuotoneFillGeometry = solidDuotonePath
          ? h('path', {
              d: solidDuotonePath,
              fill: props.secondaryColor,
              'fill-opacity': props.secondaryOpacity,
              stroke: 'none',
            })
          : undefined;
        const solidDuotoneBorderGeometry = solidDuotonePath
          ? h('path', {
              d: solidDuotonePath,
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': solidDuotoneBorderStrokeWidths[outlineVariant],
            })
          : undefined;
        return h(
          'svg',
          {
            ...attrs,
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            width: props.size,
            height: props.size,
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': strokeWidth,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          },
          solidDuotoneFillGeometry && solidDuotoneBorderGeometry
            ? [
                h('defs', [
                  h('clipPath', { id: solidDuotoneClipId }, [
                    h('path', { d: solidDuotonePath, fill: 'white', stroke: 'none' }),
                  ]),
                ]),
                solidDuotoneFillGeometry,
                h('g', { 'clip-path': `url(#${solidDuotoneClipId})` }, [solidDuotoneBorderGeometry]),
              ]
            : solidStrokeDuotoneSecondaryGeometry.length > 0
              ? [
                  h('defs', [
                    h(
                      'mask',
                      {
                        id: solidStrokeDuotoneMaskId,
                        maskUnits: 'userSpaceOnUse',
                        x: 0,
                        y: 0,
                        width: 24,
                        height: 24,
                      },
                      [
                        h('rect', { x: 0, y: 0, width: 24, height: 24, fill: 'white', stroke: 'none' }),
                        ...solidStrokeDuotoneMaskGeometry,
                      ],
                    ),
                  ]),
                  h('g', { opacity: props.secondaryOpacity, fill: 'none' }, solidStrokeDuotoneSecondaryGeometry),
                  h('g', { mask: `url(#${solidStrokeDuotoneMaskId})` }, solidStrokeDuotonePrimaryGeometry),
                ]
              : duotoneFillGeometry.length > 0
                ? [h('g', { opacity: props.secondaryOpacity, stroke: 'none' }, duotoneFillGeometry), ...geometry]
                : geometry,
        );
      };
    },
  });
};
