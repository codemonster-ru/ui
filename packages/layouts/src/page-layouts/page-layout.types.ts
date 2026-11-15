export interface CmAuthLayoutProps {
  as?: string;
  title?: string | null;
  description?: string | null;
  fillViewport?: boolean;
  centered?: boolean;
  surface?: boolean;
}

export interface CmErrorLayoutProps extends CmAuthLayoutProps {
  code?: string | number | null;
}
