import { cmBreakpoints } from '@codemonster-ru/ui-tokens';

export const previews = [['min', 320], ...Object.entries(cmBreakpoints)].map(([value, width]) => ({
  value: String(value),
  width: Number(width),
  label: `${value} · ${width} px`,
}));
export const defaultPreview = 'xl';

export const regionControls = [
  { key: 'plain', label: 'Plain columns' },
  { key: 'subheader', label: 'Show subheader' },
  { key: 'content-subheader', label: 'Show content subheader' },
  { key: 'header', label: 'Sticky header' },
  { key: 'sidebar', label: 'Sticky sidebar' },
  { key: 'aside', label: 'Sticky aside' },
  { key: 'notches', label: 'Edge notches' },
] as const;

export const layoutExamples = [
  { slug: 'admin-shell', title: 'CmAdminShell', label: 'Warehouse workspace', contract: true },
  { slug: 'admin-layout', title: 'CmAdminLayout', label: 'Admin dashboard', contract: true },
  { slug: 'setup-layout', title: 'CmSetupLayout', label: 'Installation flow', contract: true },
  { slug: 'app-shell', title: 'CmAppShell', label: 'App shell', contract: true },
  { slug: 'document-layout', title: 'CmDocumentLayout', label: 'Document layout', contract: true },
  { slug: 'auth-layout', title: 'CmAuthLayout', label: 'Sign-in page', contract: false },
  { slug: 'error-layout', title: 'CmErrorLayout', label: 'Error page', contract: false },
] as const;

export type LayoutExampleSlug = (typeof layoutExamples)[number]['slug'];

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
  { value: 'license', label: 'License' },
  { value: 'database', label: 'Database' },
  { value: 'admin', label: 'Admin' },
  { value: 'finish', label: 'Finish' },
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

export function warehousePagination() {
  return `<nav class="cm-data-table__pagination" aria-label="Table pagination">
    <label class="cm-data-table__page-size"><span>Rows per page</span>
      <select data-cm-data-table-page-size-control><option value="5">5</option><option value="10">10</option></select>
    </label>
    <span class="cm-data-table__pagination-summary" aria-live="polite">1-5 of ${rows.length}</span>
    <button class="cm-data-table__page-button" type="button" data-cm-data-table-page-action="previous" aria-label="Previous page" disabled>Previous</button>
    <span class="cm-data-table__page-summary" aria-live="polite">Page 1 of ${Math.ceil(rows.length / 5)}</span>
    <button class="cm-data-table__page-button" type="button" data-cm-data-table-page-action="next" aria-label="Next page">Next</button>
  </nav>`;
}
