export function documentationUrl(source: string): string {
  const [file, fragment] = source.split('#', 2);
  const slug = file.replace(/(?:^|\/)index\.md$/u, '').replace(/\.md$/u, '');
  return `/docs/${slug ? `${slug}/` : ''}${fragment ? `#${fragment}` : ''}`;
}
