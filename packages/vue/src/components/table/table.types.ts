export type CmTableDensity = 'default' | 'compact';

export interface CmTableProps {
  caption?: string;
  density?: CmTableDensity;
  compact?: boolean;
  striped?: boolean;
  columnDividers?: boolean;
  stickyHeader?: boolean;
}
