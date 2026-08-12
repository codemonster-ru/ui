export interface CmAccordionItem {
  id: string;
  title: string;
  content: string;
  disabled?: boolean;
}

export interface CmAccordionProps {
  id: string;
  items: readonly CmAccordionItem[];
  openItems?: readonly string[] | null;
  defaultOpenItems?: readonly string[];
  multiple?: boolean;
}

export interface CmAccordionOpenChange {
  openItems: string[];
}
