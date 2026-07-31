import { defineComponent, h, type PropType, type SVGAttributes } from 'vue';

type GeometryNode = {
  tag: 'circle' | 'line' | 'path' | 'polyline' | 'rect';
  attrs: SVGAttributes;
};

const path = (d: string, attrs: SVGAttributes = {}): GeometryNode => ({
  tag: 'path',
  attrs: { d, ...attrs },
});
const line = (x1: number, y1: number, x2: number, y2: number): GeometryNode => ({
  tag: 'line',
  attrs: { x1, y1, x2, y2 },
});
const circle = (cx: number, cy: number, r: number, attrs: SVGAttributes = {}): GeometryNode => ({
  tag: 'circle',
  attrs: { cx, cy, r, ...attrs },
});
const rect = (x: number, y: number, width: number, height: number, rx: number): GeometryNode => ({
  tag: 'rect',
  attrs: { x, y, width, height, rx },
});
const polyline = (points: string): GeometryNode => ({ tag: 'polyline', attrs: { points } });

export const outlineGeometry = {
  arrowLeft: [line(20.5, 12, 3.5, 12), polyline('9.25 6.25 3.5 12 9.25 17.75')],
  arrowRight: [line(3.5, 12, 20.5, 12), polyline('14.75 6.25 20.5 12 14.75 17.75')],
  arrowUp: [line(12, 20.5, 12, 3.5), polyline('6.25 9.25 12 3.5 17.75 9.25')],
  arrowDown: [line(12, 3.5, 12, 20.5), polyline('6.25 14.75 12 20.5 17.75 14.75')],
  arrowLeftLong: [line(21.5, 12, 2.5, 12), polyline('8.25 6.25 2.5 12 8.25 17.75')],
  arrowRightLong: [line(2.5, 12, 21.5, 12), polyline('15.75 6.25 21.5 12 15.75 17.75')],
  arrowUpLong: [line(12, 21.5, 12, 2.5), polyline('6.25 8.25 12 2.5 17.75 8.25')],
  arrowDownLong: [line(12, 2.5, 12, 21.5), polyline('6.25 15.75 12 21.5 17.75 15.75')],
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

export const createOutlineIcon = (name: OutlineIconName) => {
  return defineComponent({
    name: `Vf${name.charAt(0).toUpperCase()}${name.slice(1)}Icon`,
    inheritAttrs: false,
    props: {
      size: {
        type: [Number, String] as PropType<number | string>,
        default: 'var(--vf-icon-current-size, var(--vf-icon-size-md))',
      },
    },
    setup(props, { attrs }) {
      return () =>
        h(
          'svg',
          {
            ...attrs,
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            width: props.size,
            height: props.size,
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': 2,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          },
          outlineGeometry[name].map((node) => h(node.tag, node.attrs)),
        );
    },
  });
};
