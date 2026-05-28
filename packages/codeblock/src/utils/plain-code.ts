export const escapeCodeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export const renderPlainCodeLines = (code: string): string[] =>
  (code || '').replace(/\r\n/g, '\n').split('\n').map(escapeCodeHtml);
