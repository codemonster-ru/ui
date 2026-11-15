import { fileURLToPath } from 'node:url';
import { collectComponentManifests } from '../contracts/component-manifests.mjs';
import groups from '../../examples/shared/showcase-groups.json' with { type: 'json' };
import pages from '../../examples/shared/showcase-pages.json' with { type: 'json' };
import { publicName, referenceCatalog } from '../../examples/shared/showcase-component-reference.mts';

const contracts = fileURLToPath(new URL('../../contracts', import.meta.url));

export function buildShowcaseSearchIndex(guides, adapter) {
  const manifests = new Map(collectComponentManifests(contracts).map(({ slug, manifest }) => [slug, manifest]));
  return [
    ...referenceCatalog(groups, manifests).map(({ slug, name, description, category }) => ({
      path: `/components/${slug}/`,
      title: publicName(name),
      description: description?.replaceAll('`', ''),
      label: `Component · ${category}`,
      terms: `${category} ${slug}`,
      aliases: [`Cm${name.replaceAll(' ', '')}`, `cm${slug.replaceAll('-', '')}`],
    })),
    ...guides.flatMap(({ path, title, description, headings }) => [
      { path, title, description, label: 'Guide' },
      ...headings.map(({ id, title: heading, excerpt }) => ({
        path: `${path}#${id}`,
        title: heading,
        description: excerpt,
        label: `Guide · ${title}`,
        terms: title,
      })),
    ]),
    ...pages
      .filter(({ vueOnly }) => !vueOnly || adapter === 'vue')
      .map(({ id, label, title, description }) => ({
        path: `/${id}/`,
        title: title ?? label,
        description,
        label: 'Showcase',
        aliases: [id, label],
      })),
  ];
}
