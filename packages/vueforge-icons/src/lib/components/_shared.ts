export type IconSizeProps = {
  size?: number | string;
};

export const iconSizeDefaults = {
  size: 'var(--vf-icon-current-size, var(--vf-icon-size-md))',
} satisfies Required<IconSizeProps>;

export const iconSvgAttrs = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 512 512',
  fill: 'none',
} as const;

export const outlineIconSvgAttrs = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const;
