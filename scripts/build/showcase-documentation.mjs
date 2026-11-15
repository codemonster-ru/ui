import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import MarkdownIt from 'markdown-it';
import { documentationUrl } from '../../examples/shared/showcase-guide-links.mts';

export const documentationDirectory = join(import.meta.dirname, '../../docs');

const directoryGroups = ['architecture', 'components', 'css', 'recipes', 'tokens'];
const rootGuides = [
  'index.md',
  'getting-started.md',
  'vanilla.md',
  'integration.md',
  'migrate-from-vueforge.md',
  'release-notes.md',
  'codemonster-ui-1.1-release-notes.md',
  'codemonster-ui-2.0-release-notes.md',
];

const navigation = [
  [
    'Get started',
    [
      ['Overview', 'index.md'],
      ['Installation and Vue', 'getting-started.md'],
      ['Vanilla quick start', 'vanilla.md'],
      ['Component guides', 'components/index.md'],
    ],
  ],
  [
    'Design foundations',
    [
      ['Tokens', 'tokens/getting-started.md'],
      ['Theming', 'recipes/theme-switch.md'],
      ['CSS and typography', 'css/getting-started.md'],
      ['Display and icons', 'components/display.md'],
      ['Layouts', 'components/layouts.md'],
    ],
  ],
  [
    'Integration',
    [
      ['SSR and TypeScript', 'integration.md'],
      ['Accessibility', 'architecture/accessibility-requirements.md'],
      ['Migration', 'migrate-from-vueforge.md'],
    ],
  ],
];

const markdown = new MarkdownIt({ html: false });
const escape = markdown.utils.escapeHtml;
const sourceBase = 'https://github.com/codemonster-ru/ui/blob/main/';
const repository = 'https://guide-source.invalid';
const languages = {
  bash: 'Shell',
  css: 'CSS',
  html: 'HTML',
  js: 'JavaScript',
  json: 'JSON',
  text: 'Text',
  ts: 'TypeScript',
  vue: 'Vue',
};

markdown.renderer.rules.fence = (tokens, index) => {
  const { info, content } = tokens[index];
  const [language = 'text', file] = info.split(/\s+/u).filter(Boolean);
  const label = languages[language] ?? language;
  const filename = file?.startsWith('file=') ? ` · ${file.slice(5)}` : '';
  const id = `guide-code-${index}`;
  return `<figure class="guide-code">
  <figcaption><span id="${id}">${escape(label + filename)}</span>
    <span class="guide-code__controls"><span data-guide-copy-status role="status"></span>
    <button type="button" class="cm-button cm-button--secondary cm-button--sm" data-guide-copy aria-describedby="${id}" hidden>Copy</button></span>
  </figcaption>
  <pre tabindex="0" role="group" aria-labelledby="${id}"><code>${escape(content)}</code></pre>
</figure>\n`;
};

function inlineText(token) {
  return token.children
    .map((child) => (child.type === 'softbreak' || child.type === 'hardbreak' ? ' ' : child.content))
    .join('');
}

function headingId(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
    .replace(/\s+/gu, '-');
}

function shorten(text, length = 180) {
  if (text.length <= length) return text;
  return `${text
    .slice(0, length + 1)
    .replace(/\s+\S*$/u, '')
    .trimEnd()}…`;
}

function parseGuide(source, content, resolveLink) {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/u);
  const meta = frontmatter?.[1].match(/^description: (.+)$/mu)?.[1].replace(/^(['"])(.*)\1$/u, '$2');
  const tokens = markdown.parse(frontmatter ? content.slice(frontmatter[0].length) : content, {});
  const counts = new Map();
  const headings = [];
  let title;
  let introduction = '';

  for (const [index, token] of tokens.entries()) {
    if (token.type === 'heading_open') {
      const label = inlineText(tokens[index + 1]);
      const slug = headingId(label);
      const count = counts.get(slug) ?? 0;
      const id = count ? `${slug}-${count}` : slug;
      counts.set(slug, count + 1);
      token.attrSet('id', id);
      token.attrSet('tabindex', '-1');

      if (token.tag === 'h1' && !title) title = label;
      else headings.push({ id, title: label, level: Number(token.tag[1]), excerpt: '' });

      if (source === 'index.md' && id === 'start-here' && tokens[index + 3]?.type === 'bullet_list_open') {
        tokens[index + 3].attrSet('class', 'guide-start');
        tokens[index + 3].attrSet('role', 'list');
      }
    }

    if (token.type !== 'inline') continue;
    for (const child of token.children) {
      if (child.type === 'link_open') child.attrSet('href', resolveLink(source, child.attrGet('href')));
    }
    if (tokens[index - 1]?.type === 'paragraph_open') {
      const paragraph = shorten(inlineText(token));
      const heading = headings.at(-1);
      if (heading && !heading.excerpt) heading.excerpt = paragraph;
      if (!heading && !introduction) introduction = paragraph;
    }
  }

  if (tokens[0]?.tag !== 'h1' || !title) throw new Error(`Missing an opening first-level title in docs/${source}`);
  return { title, description: meta ?? introduction, headings, tokens };
}

function renderNavigation(path, href) {
  return `<nav class="guide-nav" aria-label="Developer guides">
    ${navigation
      .map(
        ([label, links]) => `<div class="guide-nav__group"><p>${label}</p><ul role="list">
      ${links
        .map(([text, source]) => {
          const target = documentationUrl(source);
          return `<li><a href="${escape(href(target))}"${target === path ? ' aria-current="page"' : ''}>${text}</a></li>`;
        })
        .join('')}
    </ul></div>`,
      )
      .join('')}
  </nav>`;
}

function renderGuide(source, guide, href) {
  const path = documentationUrl(source);
  const index = source === 'index.md';
  const sectionLinks = guide.headings.filter(({ level }) => level === 2);
  const headerEnd = guide.tokens[3]?.type === 'paragraph_open' ? 6 : 3;
  const header = markdown.renderer.render(guide.tokens.slice(0, headerEnd), markdown.options, {});
  const content = markdown.renderer.render(guide.tokens.slice(headerEnd), markdown.options, {});
  return `<div class="guide-layout">
    ${renderNavigation(path, href)}
    <article class="guide-article">
      ${index ? '' : `<a class="guide-back" href="${href('/docs/')}">All guides</a>`}
      <header class="guide-header">${header}</header>
      ${
        !index && sectionLinks.length > 1
          ? `<nav class="guide-outline" aria-label="On this page"><p>On this page</p>
        <ul role="list">${sectionLinks.map(({ id, title: heading }) => `<li><a href="${escape(href(`${path}#${id}`))}">${escape(heading)}</a></li>`).join('')}</ul>
      </nav>`
          : ''
      }
      <div class="guide-prose">${content}</div>
      <footer class="guide-footer"><a href="${sourceBase}docs/${source}">View Markdown source on GitHub</a></footer>
    </article>
  </div>`;
}

export async function buildDocumentation({ relativeLinks = false } = {}) {
  const groups = await Promise.all(
    directoryGroups.map(async (directory) => {
      const files = await readdir(join(documentationDirectory, directory), { recursive: true });
      return files.filter((file) => file.endsWith('.md')).map((file) => `${directory}/${file}`);
    }),
  );
  const files = [...rootGuides, ...groups.flat().sort()];
  const sources = new Set(files);
  const href = (path) => (relativeLinks ? `.${path}` : path);

  function resolveLink(source, link) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(link)) return link;
    const target = new URL(link, `${repository}/docs/${source}`);
    const doc = target.pathname.slice('/docs/'.length);
    if (target.pathname.startsWith('/docs/') && sources.has(doc)) {
      return href(`${documentationUrl(doc)}${target.search}${target.hash}`);
    }
    return `${sourceBase}${target.pathname.slice(1)}${target.search}${target.hash}`;
  }

  const guides = await Promise.all(
    files.map(async (source) => {
      const content = await readFile(join(documentationDirectory, source), 'utf8');
      return [source, parseGuide(source, content, resolveLink)];
    }),
  );

  return {
    pages: new Map(
      guides.map(([source, guide]) => [
        documentationUrl(source),
        { title: guide.title, html: renderGuide(source, guide, href) },
      ]),
    ),
    index: guides.map(([source, { title, description, headings }]) => ({
      path: documentationUrl(source),
      title,
      description,
      headings: headings
        .filter(({ level }) => level <= 3)
        .map(({ id, title: heading, excerpt }) => ({
          id,
          title: heading,
          excerpt,
        })),
    })),
  };
}
