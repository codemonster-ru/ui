import { file, gear, grid } from '@codemonster-ru/ui-icons';
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

export function previewClass(width: number) {
  return width < cmBreakpoints.lg
    ? 'layout-preview--stacked'
    : width < cmBreakpoints.xl
      ? 'layout-preview--two-columns'
      : '';
}

export const panels = [
  { slug: 'app-shell', title: 'App shell' },
  { slug: 'document-layout', title: 'Document layout' },
  { slug: 'admin-layout', title: 'Admin layout' },
  { slug: 'admin-shell', title: 'Admin shell' },
  { slug: 'setup-layout', title: 'Setup layout' },
] as const;
export const nav = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'inventory', label: 'Warehouse availability' },
  { value: 'settings', label: 'Settings' },
];
export const columns = [
  { key: 'product', header: 'Product' },
  { key: 'sku', header: 'SKU' },
  { key: 'warehouse', header: 'Warehouse' },
  { key: 'available', header: 'Available' },
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

export const warehouseIcons = Object.fromEntries(
  Object.entries({ dashboard: grid, commerce: file, settings: gear }).map(([name, icon]) => {
    const { viewBox, body } = icon['classic/regular'];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    return [`--warehouse-icon-${name}`, `url('data:image/svg+xml,${encodeURIComponent(svg)}')`];
  }),
);
export const warehouseIconStyle = Object.entries(warehouseIcons)
  .map(([key, value]) => `${key}:${value}`)
  .join(';');

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
  return `<nav class="warehouse-pagination" aria-label="Table pagination" data-total-rows="${rows.length}">
    <span data-warehouse-summary aria-live="polite">1–5 of ${rows.length}</span>
    <label>Rows <select data-warehouse-size><option value="5">5</option><option value="10">10</option></select></label>
    <button type="button" data-warehouse-page="previous" aria-label="Previous page" disabled>‹</button>
    ${[1, 2].map((page) => `<button type="button" data-warehouse-page="${page}" aria-label="Page ${page}"${page === 1 ? ' aria-current="page"' : ''}>${page}</button>`).join('')}
    <button type="button" data-warehouse-page="next" aria-label="Next page">›</button>
  </nav>`;
}
