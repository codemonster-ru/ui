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
  const output = stylesheet.toString();
  if (output !== source) writeFileSync(path, output);
}
