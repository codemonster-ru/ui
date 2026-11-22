/** @param {HTMLElement} root */
export function fillContrastTable(root) {
  const cells = root.querySelectorAll('[data-contrast-foreground]');
  if (!cells.length) return;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  const luminance = (color) => {
    if (!CSS.supports('color', color)) return NaN;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const channels = [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)].map((byte) => {
      const channel = byte / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };

  for (const cell of cells) {
    const style = getComputedStyle(cell);
    const foreground = luminance(style.getPropertyValue(cell.dataset.contrastForeground));
    const background = luminance(style.getPropertyValue(cell.dataset.contrastBackground));
    const ratio = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    cell.textContent = Number.isFinite(ratio) ? `${ratio.toFixed(2)}:1` : 'Unavailable';
  }
}
