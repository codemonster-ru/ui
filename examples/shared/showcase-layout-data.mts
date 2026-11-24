import { checkCircle, database, fileText, user } from '@codemonster-ru/ui-icons';
import { cmBreakpoints } from '@codemonster-ru/ui-tokens';

export const regionControls = [
  { key: 'plain', label: 'Plain columns' },
  { key: 'subheader', label: 'Subheader' },
  { key: 'content-subheader', label: 'Content subheader' },
  { key: 'header', label: 'Sticky header' },
  { key: 'sidebar', label: 'Sticky sidebar' },
  { key: 'aside', label: 'Sticky aside' },
  { key: 'notches', label: 'Edge notches' },
] as const;

export const shellTabs = [
  { value: 'content', label: 'Content', content: '' },
  { value: 'sidebar-content', label: 'With sidebar', content: '' },
  { value: 'sidebar-content-aside', label: 'With aside', content: '' },
] as const;

export const layoutExamples = [
  { slug: 'admin-shell', title: 'Admin Shell' },
  { slug: 'admin-layout', title: 'Admin Layout' },
  { slug: 'setup-layout', title: 'Setup Layout' },
  { slug: 'app-shell', title: 'App Shell' },
  { slug: 'document-layout', title: 'Document Layout' },
  { slug: 'auth-layout', title: 'Auth Layout' },
  { slug: 'error-layout', title: 'Error Layout' },
] as const;

export type LayoutExampleSlug = (typeof layoutExamples)[number]['slug'];

export const layoutPreviewChoices = [
  { value: 'fit', label: 'Fit' },
  { value: '320', label: 'min · 320 px' },
  ...Object.entries(cmBreakpoints).map(([name, width]) => ({ value: String(width), label: `${name} · ${width} px` })),
];

export const dashboardStats = [
  { label: 'Published', value: '24' },
  { label: 'Drafts', value: '8' },
  { label: 'Views', value: '12,480' },
];
export const dashboardActivity = [
  {
    title: 'Recent inventory changes',
    items: [
      'Warehouse A · 24 items received',
      'Warehouse B · 8 items reserved',
      'Warehouse C · 3 items returned',
      'Online stock · 12 items sold',
    ],
  },
  {
    title: 'Stock alerts',
    items: [
      'Wireless keyboard · 2 items remaining',
      'USB-C dock · out of stock',
      'Studio monitor · reorder needed',
      'Laptop stand · due tomorrow',
    ],
  },
];
export const warehouseTableCaption = 'Warehouse availability';
export const warehouseFilterLabel = 'Filter inventory';
export const warehouseEmptyText = 'No products match your search.';
export const warehouseStockTones = {
  Available: 'success',
  'Low stock': 'warning',
  'Out of stock': 'danger',
} as const;
export const columns = [
  { key: 'product', header: 'Product' },
  { key: 'sku', header: 'SKU' },
  { key: 'warehouse', header: 'Warehouse' },
  { key: 'available', header: 'Available', align: 'end' as const },
  { key: 'status', header: 'Status' },
];
export const rows = [
  { id: '1', product: 'Wireless keyboard', sku: 'KB-1042', warehouse: 'North', available: 24, status: 'Available' },
  { id: '2', product: 'USB-C dock', sku: 'DK-2208', warehouse: 'Central', available: 0, status: 'Out of stock' },
  { id: '3', product: 'Studio monitor', sku: 'MN-3410', warehouse: 'North', available: 7, status: 'Low stock' },
  { id: '4', product: 'Laptop stand', sku: 'ST-1184', warehouse: 'West', available: 31, status: 'Available' },
  { id: '5', product: 'Web camera', sku: 'CM-4421', warehouse: 'Central', available: 16, status: 'Available' },
  { id: '6', product: 'Mechanical mouse', sku: 'MS-3097', warehouse: 'West', available: 4, status: 'Low stock' },
  { id: '7', product: 'Desk microphone', sku: 'MC-8073', warehouse: 'North', available: 12, status: 'Available' },
].map(({ id, ...cells }) => ({ id: `product-${id}`, cells }));
export const steps = [
  { value: 'license', label: 'License', leadingIcon: fileText },
  { value: 'database', label: 'Database', leadingIcon: database },
  { value: 'admin', label: 'Admin', leadingIcon: user },
  { value: 'finish', label: 'Finish', leadingIcon: checkCircle },
];
export const initialSetupStep = 'database';

export const warehouseNavigation = [
  { value: 'dashboard', label: 'Dashboard' },
  {
    value: 'commerce',
    label: 'Commerce',
    children: [
      { value: 'product-catalog', label: 'Product catalog' },
      { value: 'inventory-management', label: 'Inventory management' },
      { value: 'warehouse-availability', label: 'Warehouse availability' },
    ],
  },
  { value: 'settings', label: 'Settings' },
];
