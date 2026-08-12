export type CmSkeletonRadius = 'control' | 'surface' | 'round';

export interface CmSkeletonProps {
  minHeight?: string | number | null;
  radius?: CmSkeletonRadius;
  animated?: boolean;
}
