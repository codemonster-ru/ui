export type CmTableDensity = 'default' | 'compact';

export interface CmTableProps {
  caption?: string;
  density?: CmTableDensity;
  striped?: boolean;
  columnDividers?: boolean;
  stickyHeader?: boolean;
}
