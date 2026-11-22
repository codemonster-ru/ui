import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';

const packageDirectory = resolve(import.meta.dirname, '..');
const sourceDirectory = resolve(packageDirectory, 'src');
const distDirectory = resolve(packageDirectory, 'dist');

rmSync(distDirectory, { force: true, recursive: true });
cpSync(sourceDirectory, distDirectory, { recursive: true });

for (const file of readdirSync(distDirectory, { recursive: true })) {
  if (!file.endsWith('.css')) continue;
  const path = resolve(distDirectory, file);
  const source = readFileSync(path, 'utf8');
  const stylesheet = postcss.parse(source, { from: path });
  stylesheet.walkComments((comment) => {
    if (!/^!|@(?:license|preserve)\b|\bcopyright\b/iu.test(comment.text)) comment.remove();
  });
  // Compact formatting between nodes without touching selectors or declaration values.
  const compact = (whitespace) => whitespace.replace(/\n+[ \t]*$/u, '\n');
  stylesheet.walk((node) => {
    if (node.raws.before) node.raws.before = compact(node.raws.before);
    if (node.raws.after) node.raws.after = compact(node.raws.after);
  });
  const output = stylesheet.toString();
  if (output !== source) writeFileSync(path, output);
}
