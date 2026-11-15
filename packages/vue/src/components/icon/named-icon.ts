import * as icons from '@codemonster-ru/ui-icons';

export function normalizeIconName(name: string): string {
  return name.includes('-')
    ? name.toLowerCase().replace(/-([a-z0-9])/gu, (_, letter: string) => letter.toUpperCase())
    : name;
}

export function resolveNamedIcon(name: string): icons.CmIconGeometry {
  const entry = icons[name as keyof typeof icons];
  return entry && typeof entry === 'object' && 'classic/solid' in entry ? entry : icons.moon;
}
