import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const packageDirectory = resolve(import.meta.dirname, '..');
const distDirectory = resolve(packageDirectory, 'dist');

rmSync(distDirectory, { force: true, recursive: true });
mkdirSync(distDirectory);
copyFileSync(resolve(packageDirectory, 'src/styles.css'), resolve(distDirectory, 'styles.css'));
