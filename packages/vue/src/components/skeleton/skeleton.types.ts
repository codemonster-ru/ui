export type CmSkeletonRadius = 'control' | 'surface' | 'round';

export interface CmSkeletonProps {
  minHeight?: string | number | null;
  radius?: CmSkeletonRadius;
  animated?: boolean;
}

export interface VfSkeletonProps {
  minHeight?: string | number;
  radius?: string;
  animated?: boolean;
}
