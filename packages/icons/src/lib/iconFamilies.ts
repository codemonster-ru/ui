export const iconFamilies = ['classic', 'duotone'] as const;

export type IconFamily = (typeof iconFamilies)[number];
