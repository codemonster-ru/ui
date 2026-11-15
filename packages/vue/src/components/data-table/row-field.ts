export function tableRowField(row: object, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value === null || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, key)) {
      return undefined;
    }
    return (value as Record<string, unknown>)[key];
  }, row);
}
