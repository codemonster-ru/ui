export type CmAvatarSize = 'sm' | 'md' | 'lg';
export type CmAvatarShape = 'square' | 'circle';

export interface CmAvatarProps {
  image?: string | null;
  imageAlt?: string;
  label?: string | null;
  size?: CmAvatarSize;
  shape?: CmAvatarShape;
}
