import { cpSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const packageDirectory = resolve(import.meta.dirname, '..');
const sourceDirectory = resolve(packageDirectory, 'src');
const distDirectory = resolve(packageDirectory, 'dist');

rmSync(distDirectory, { force: true, recursive: true });
cpSync(sourceDirectory, distDirectory, { recursive: true });
